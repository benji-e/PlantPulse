"""Evaluate the saved model once on the held-out test split."""

from __future__ import annotations

import json
import csv
import time
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import numpy as np
import tensorflow as tf
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix


IMAGE_SIZE = (160, 160)
BATCH_SIZE = 8


def load_json(path: Path) -> dict[str, Any]:
    return json.loads(path.read_text(encoding="utf-8"))


def main() -> int:
    project_dir = Path(__file__).resolve().parent
    dataset_root = project_dir.parent / "resize plant_leaves dataset(1545)"
    model_path = project_dir / "model" / "best_model.keras"
    mapping_path = project_dir / "class_labels.json"
    split_path = project_dir / "results" / "dataset_split.json"
    if not model_path.is_file():
        raise FileNotFoundError(f"Trained model not found: {model_path}")

    mapping = load_json(mapping_path)
    split_report = load_json(split_path)
    if Path(split_report["dataset_root"]).resolve() != dataset_root.resolve():
        raise ValueError("The saved split manifest refers to a different dataset.")
    records = split_report["splits"]["test"]
    if not records:
        raise ValueError("The test split is empty.")

    paths = [str(dataset_root / Path(record["path"])) for record in records]
    true_indices = np.asarray(
        [record["class_index"] for record in records], dtype=np.int64
    )

    def load_image(path: tf.Tensor) -> tf.Tensor:
        image = tf.io.decode_jpeg(tf.io.read_file(path), channels=3)
        return tf.image.resize(image, IMAGE_SIZE)

    dataset = tf.data.Dataset.from_tensor_slices(paths)
    dataset = dataset.map(load_image, num_parallel_calls=tf.data.AUTOTUNE)
    dataset = dataset.batch(BATCH_SIZE).prefetch(tf.data.AUTOTUNE)

    model = tf.keras.models.load_model(model_path)
    start = time.perf_counter()
    probabilities = model.predict(dataset, verbose=0)
    elapsed = time.perf_counter() - start
    predicted_indices = np.argmax(probabilities, axis=1)

    class_indices = list(range(len(mapping["class_names"])))
    report = classification_report(
        true_indices,
        predicted_indices,
        labels=class_indices,
        target_names=mapping["class_names"],
        output_dict=True,
        zero_division=0,
    )
    matrix = confusion_matrix(
        true_indices, predicted_indices, labels=class_indices
    ).tolist()
    metrics = {
        "evaluated_at_utc": datetime.now(timezone.utc).isoformat(),
        "model_path": str(model_path),
        "dataset_root": str(dataset_root),
        "evaluation_split": "held-out test",
        "test_image_count": len(records),
        "class_count": len(class_indices),
        "class_names_in_index_order": mapping["class_names"],
        "images_per_true_class": dict(Counter(
            mapping["class_names"][index] for index in true_indices
        )),
        "accuracy": float(accuracy_score(true_indices, predicted_indices)),
        "macro_f1": float(report["macro avg"]["f1-score"]),
        "weighted_f1": float(report["weighted avg"]["f1-score"]),
        "per_class": {
            name: report[name]
            for name in mapping["class_names"]
        },
        "confusion_matrix": matrix,
        "confusion_matrix_axis_order": mapping["class_names"],
        "inference_total_seconds": elapsed,
        "inference_milliseconds_per_image": elapsed * 1000 / len(records),
        "split_sizes": split_report["actual_split_sizes"],
        "training_images_per_class": split_report["train_images_per_class"],
        "confidence_note": (
            "Softmax scores are model outputs and are not necessarily calibrated "
            "probabilities of correctness."
        ),
    }

    results_dir = project_dir / "results"
    results_dir.mkdir(parents=True, exist_ok=True)
    metrics_path = results_dir / "test_metrics.json"
    matrix_path = results_dir / "confusion_matrix.csv"
    metrics_path.write_text(
        json.dumps(metrics, indent=2, ensure_ascii=False) + "\n",
        encoding="utf-8",
    )
    with matrix_path.open("w", encoding="utf-8", newline="") as output_file:
        writer = csv.writer(output_file)
        writer.writerow(["true_label", *mapping["class_names"]])
        for label, row in zip(mapping["class_names"], matrix):
            writer.writerow([label, *row])

    print(f"Held-out test images: {len(records)}")
    print(f"Accuracy: {metrics['accuracy']:.4f}")
    print(f"Macro F1: {metrics['macro_f1']:.4f}")
    print(f"Weighted F1: {metrics['weighted_f1']:.4f}")
    print(f"Inference: {metrics['inference_milliseconds_per_image']:.2f} ms/image")
    print(f"Metrics saved to: {metrics_path}")
    print(f"Confusion matrix saved to: {matrix_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
