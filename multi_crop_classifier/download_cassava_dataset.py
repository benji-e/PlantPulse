"""Download and inspect the official TensorFlow Datasets cassava collection."""

from __future__ import annotations

import argparse
import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import tensorflow as tf
import tensorflow_datasets as tfds


def main() -> int:
    project_dir = Path(__file__).resolve().parent
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--data-dir",
        type=Path,
        default=project_dir.parent / "cassava_dataset",
        help="Separate, short-path location for the downloaded and prepared dataset.",
    )
    args = parser.parse_args()
    data_dir = args.data_dir.expanduser().resolve()
    data_dir.mkdir(parents=True, exist_ok=True)

    print(f"TensorFlow: {tf.__version__}")
    print(f"TensorFlow Datasets: {tfds.__version__}")
    print(f"Dataset cache: {data_dir}")
    print("Preparing the official TFDS 'cassava' dataset. The initial download may take time.")

    builder = tfds.builder("cassava", data_dir=str(data_dir))
    builder.download_and_prepare()
    info = builder.info

    if "label" not in info.features:
        raise ValueError("Cassava dataset metadata has no label feature.")
    class_names = list(info.features["label"].names)
    split_sizes = {
        split_name: split_info.num_examples
        for split_name, split_info in info.splits.items()
    }
    if set(split_sizes) != {"train", "validation", "test"}:
        raise ValueError(f"Unexpected cassava split names: {sorted(split_sizes)}")
    if len(class_names) != 5:
        raise ValueError(
            f"Expected five disease/healthy classes, discovered {len(class_names)}: "
            f"{class_names}"
        )

    sample_checks: list[dict[str, Any]] = []
    for split_name in ("train", "validation", "test"):
        dataset = builder.as_dataset(split=split_name, shuffle_files=False)
        sample = next(iter(dataset.take(1)), None)
        if sample is None:
            raise ValueError(f"The {split_name} split contains no examples.")
        image = sample["image"]
        label = int(sample["label"].numpy())
        if image.shape.rank != 3 or image.shape[-1] != 3:
            raise ValueError(
                f"Unexpected image shape in {split_name}: {image.shape}"
            )
        if label < 0 or label >= len(class_names):
            raise ValueError(f"Out-of-range class label in {split_name}: {label}")
        sample_checks.append(
            {
                "split": split_name,
                "image_shape": [int(dimension) for dimension in image.shape],
                "label_index": label,
                "label_name": class_names[label],
                "filename": (
                    sample["image/filename"].numpy().decode("utf-8")
                    if "image/filename" in sample
                    else None
                ),
            }
        )

    report = {
        "generated_at_utc": datetime.now(timezone.utc).isoformat(),
        "dataset_name": info.name,
        "dataset_version": str(info.version),
        "dataset_description": info.description,
        "dataset_data_dir": str(data_dir),
        "citation": info.citation,
        "homepage": info.homepage,
        "class_count": len(class_names),
        "class_names_in_label_index_order": class_names,
        "split_sizes": split_sizes,
        "total_examples": sum(split_sizes.values()),
        "feature_description": str(info.features),
        "sample_checks": sample_checks,
        "training_note": (
            "Use the published train split for model fitting, validation for model "
            "selection, and test only once for final evaluation."
        ),
    }
    report_dir = project_dir / "results"
    report_dir.mkdir(parents=True, exist_ok=True)
    report_path = report_dir / "cassava_dataset_inspection.json"
    report_path.write_text(
        json.dumps(report, indent=2, ensure_ascii=False) + "\n",
        encoding="utf-8",
    )

    print(f"Dataset version: {info.version}")
    print(f"Class labels: {class_names}")
    for split_name, count in split_sizes.items():
        print(f"{split_name}: {count} images")
    print(f"Total examples: {report['total_examples']}")
    print(f"Dataset inspection saved to: {report_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
