"""Train a small MobileNetV2 classifier from the prepared dataset split."""

from __future__ import annotations

import json
import platform
import time
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import tensorflow as tf


IMAGE_SIZE = (160, 160)
BATCH_SIZE = 8
EPOCHS = 5
RANDOM_SEED = 42


def load_json(path: Path) -> dict[str, Any]:
    return json.loads(path.read_text(encoding="utf-8"))


def make_dataset(
    dataset_root: Path,
    records: list[dict[str, Any]],
    class_count: int,
    *,
    training: bool,
) -> tf.data.Dataset:
    paths = [str(dataset_root / Path(record["path"])) for record in records]
    labels = [record["class_index"] for record in records]
    dataset = tf.data.Dataset.from_tensor_slices((paths, labels))

    def load_image(path: tf.Tensor, label: tf.Tensor) -> tuple[tf.Tensor, tf.Tensor]:
        image_bytes = tf.io.read_file(path)
        image = tf.io.decode_jpeg(image_bytes, channels=3)
        image = tf.image.resize(image, IMAGE_SIZE)
        return tf.cast(image, tf.float32), tf.one_hot(label, class_count)

    dataset = dataset.map(load_image, num_parallel_calls=tf.data.AUTOTUNE)
    if training:
        dataset = dataset.shuffle(
            len(records), seed=RANDOM_SEED, reshuffle_each_iteration=True
        )
    return dataset.batch(BATCH_SIZE).prefetch(tf.data.AUTOTUNE)


def main() -> int:
    project_dir = Path(__file__).resolve().parent
    dataset_root = project_dir.parent / "resize plant_leaves dataset(1545)"
    mapping_path = project_dir / "class_labels.json"
    split_path = project_dir / "results" / "dataset_split.json"
    model_dir = project_dir / "model"
    results_dir = project_dir / "results"

    if not mapping_path.is_file() or not split_path.is_file():
        raise FileNotFoundError(
            "Required class mapping or split manifest is missing. "
            "Run prepare_dataset.py first."
        )
    if not dataset_root.is_dir():
        raise FileNotFoundError(f"Dataset directory not found: {dataset_root}")

    mapping = load_json(mapping_path)
    split_report = load_json(split_path)
    if Path(split_report["dataset_root"]).resolve() != dataset_root.resolve():
        raise ValueError("Split manifest refers to a different dataset directory.")
    if split_report["train_images_per_class"] != 10:
        raise ValueError(
            "This training run expects exactly 10 training images per class. "
            "Rerun prepare_dataset.py with --train-images-per-class 10."
        )

    class_names = mapping["class_names"]
    class_count = len(class_names)
    if class_count != mapping["class_count"]:
        raise ValueError("Class mapping count does not match the class list.")
    for split_name in ("train", "validation", "test"):
        for record in split_report["splits"][split_name]:
            if mapping["class_to_index"].get(record["class_label"]) != record["class_index"]:
                raise ValueError(
                    f"Invalid class index for {record['path']} in {split_name}."
                )

    train_counts = Counter(
        record["class_label"] for record in split_report["splits"]["train"]
    )
    if set(train_counts) != set(class_names) or set(train_counts.values()) != {10}:
        raise ValueError("Training split must contain exactly 10 images per class.")

    tf.keras.utils.set_random_seed(RANDOM_SEED)
    tf.config.threading.set_intra_op_parallelism_threads(4)
    tf.config.threading.set_inter_op_parallelism_threads(2)

    print(f"TensorFlow version: {tf.__version__}")
    print(f"Python version: {platform.python_version()}")
    print(f"Visible devices: {tf.config.list_physical_devices()}")
    print(f"Dataset: {dataset_root}")
    print(f"Classes: {class_count}; training images: {sum(train_counts.values())}")
    print(
        "Images per split: "
        + ", ".join(
            f"{name}={len(split_report['splits'][name])}"
            for name in ("train", "validation", "test")
        )
    )

    train_ds = make_dataset(
        dataset_root,
        split_report["splits"]["train"],
        class_count,
        training=True,
    )
    validation_ds = make_dataset(
        dataset_root,
        split_report["splits"]["validation"],
        class_count,
        training=False,
    )

    augmentation = tf.keras.Sequential(
        [
            tf.keras.layers.RandomFlip("horizontal", seed=RANDOM_SEED),
            tf.keras.layers.RandomRotation(0.08, seed=RANDOM_SEED),
            tf.keras.layers.RandomZoom(0.1, seed=RANDOM_SEED),
        ],
        name="training_augmentation",
    )
    backbone = tf.keras.applications.MobileNetV2(
        input_shape=(*IMAGE_SIZE, 3),
        include_top=False,
        weights="imagenet",
    )
    backbone.trainable = False

    inputs = tf.keras.Input(shape=(*IMAGE_SIZE, 3), name="image")
    x = augmentation(inputs)
    x = tf.keras.layers.Rescaling(1.0 / 127.5, offset=-1, name="mobilenet_scaling")(x)
    x = backbone(x, training=False)
    x = tf.keras.layers.GlobalAveragePooling2D()(x)
    x = tf.keras.layers.Dropout(0.2, seed=RANDOM_SEED)(x)
    outputs = tf.keras.layers.Dense(class_count, activation="softmax", name="predictions")(x)
    model = tf.keras.Model(inputs, outputs, name="multi_crop_mobilenetv2")
    model.compile(
        optimizer=tf.keras.optimizers.Adam(learning_rate=1e-3),
        loss="categorical_crossentropy",
        metrics=["accuracy"],
    )

    model_dir.mkdir(parents=True, exist_ok=True)
    results_dir.mkdir(parents=True, exist_ok=True)
    checkpoint_path = model_dir / "best_model.keras"
    callbacks = [
        tf.keras.callbacks.ModelCheckpoint(
            filepath=checkpoint_path,
            monitor="val_loss",
            save_best_only=True,
            verbose=1,
        ),
        tf.keras.callbacks.EarlyStopping(
            monitor="val_loss",
            patience=2,
            restore_best_weights=True,
            verbose=1,
        ),
    ]

    started_at = datetime.now(timezone.utc)
    start_time = time.perf_counter()
    history = model.fit(
        train_ds,
        validation_data=validation_ds,
        epochs=EPOCHS,
        callbacks=callbacks,
        verbose=2,
    )
    training_seconds = time.perf_counter() - start_time
    model.save(checkpoint_path)

    history_data = {
        key: [float(value) for value in values]
        for key, values in history.history.items()
    }
    best_checkpoint_epoch_index = min(
        range(len(history_data["val_loss"])),
        key=lambda index: history_data["val_loss"][index],
    )
    training_report = {
        "started_at_utc": started_at.isoformat(),
        "completed_at_utc": datetime.now(timezone.utc).isoformat(),
        "training_duration_seconds": training_seconds,
        "tensorflow_version": tf.__version__,
        "python_version": platform.python_version(),
        "visible_devices": [str(device) for device in tf.config.list_physical_devices()],
        "architecture": "MobileNetV2, ImageNet weights, frozen backbone",
        "image_size": list(IMAGE_SIZE),
        "batch_size": BATCH_SIZE,
        "maximum_epochs": EPOCHS,
        "epochs_completed": len(history_data.get("loss", [])),
        "random_seed": RANDOM_SEED,
        "training_images_per_class": 10,
        "class_count": class_count,
        "split_sizes": split_report["actual_split_sizes"],
        "history": history_data,
        "best_model_path": str(checkpoint_path),
        "best_checkpoint_epoch": best_checkpoint_epoch_index + 1,
        "best_checkpoint_validation_loss": history_data["val_loss"][
            best_checkpoint_epoch_index
        ],
        "best_checkpoint_validation_accuracy": history_data["val_accuracy"][
            best_checkpoint_epoch_index
        ],
        "peak_validation_accuracy": max(history_data["val_accuracy"]),
        "test_set_used_during_training": False,
    }
    (results_dir / "training_history.json").write_text(
        json.dumps(training_report, indent=2, ensure_ascii=False) + "\n",
        encoding="utf-8",
    )
    print(f"Training time: {training_seconds:.1f} seconds")
    print(f"Best model saved to: {checkpoint_path}")
    print(f"Training history saved to: {results_dir / 'training_history.json'}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
