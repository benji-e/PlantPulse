"""Predict a crop-and-disease class for one image using the saved trained model."""

from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Any

import tensorflow as tf


IMAGE_SIZE = (160, 160)


def load_json(path: Path) -> dict[str, Any]:
    return json.loads(path.read_text(encoding="utf-8"))


def main() -> int:
    project_dir = Path(__file__).resolve().parent
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("image", type=Path, help="Path to a JPEG plant-leaf image.")
    args = parser.parse_args()

    image_path = args.image.expanduser().resolve()
    model_path = project_dir / "model" / "best_model.keras"
    mapping_path = project_dir / "class_labels.json"
    if not image_path.is_file():
        parser.error(f"Image file does not exist: {image_path}")
    if not model_path.is_file():
        parser.error(f"Trained model not found: {model_path}. Train the model first.")

    mapping = load_json(mapping_path)
    model = tf.keras.models.load_model(model_path)
    image = tf.io.decode_image(
        tf.io.read_file(str(image_path)),
        channels=3,
        expand_animations=False,
    )
    image = tf.image.resize(image, IMAGE_SIZE)
    scores = model.predict(tf.expand_dims(image, axis=0), verbose=0)[0]
    predicted_index = int(tf.argmax(scores).numpy())
    if predicted_index >= len(mapping["class_names"]):
        raise ValueError("Model output index is not present in class_labels.json.")

    print(f"Image: {image_path}")
    print(f"Predicted class: {mapping['class_names'][predicted_index]}")
    print(f"Model score: {float(scores[predicted_index]):.4f}")
    print(
        "Note: This score is not necessarily a calibrated probability. "
        "The model only predicts among its 29 trained classes and may be unreliable "
        "for unknown crops, conditions, or images outside the training data."
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
