"""Create a deterministic stratified split and class mapping from the inspected dataset."""

from __future__ import annotations

import argparse
import hashlib
import json
import random
from collections import Counter, defaultdict
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from PIL import Image, UnidentifiedImageError


SUPPORTED_EXTENSIONS = {
    ".bmp",
    ".gif",
    ".jpeg",
    ".jpg",
    ".png",
    ".tif",
    ".tiff",
    ".webp",
}
RANDOM_SEED = 42
TRAIN_IMAGES_PER_CLASS = 10


def display_name(folder_name: str) -> str:
    suffix_start = folder_name.rfind("(")
    if suffix_start >= 0 and folder_name.endswith(")"):
        suffix = folder_name[suffix_start + 1 : -1]
        if suffix.isdigit():
            return folder_name[:suffix_start].strip()
    return folder_name.strip()


def is_readable_image(path: Path) -> bool:
    try:
        with Image.open(path) as image:
            image.verify()
        return True
    except (UnidentifiedImageError, OSError, ValueError, SyntaxError):
        return False


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as image_file:
        for chunk in iter(lambda: image_file.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def main() -> int:
    project_dir = Path(__file__).resolve().parent
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--dataset-root",
        type=Path,
        default=project_dir.parent / "resize plant_leaves dataset(1545)",
        help="Dataset directory (defaults to the dataset beside this project folder).",
    )
    parser.add_argument(
        "--inspection-report",
        type=Path,
        default=project_dir / "results" / "dataset_inspection.json",
        help="Inspection JSON that must match the current dataset.",
    )
    parser.add_argument(
        "--train-images-per-class",
        type=int,
        default=TRAIN_IMAGES_PER_CLASS,
        help=f"Training images per class (default: {TRAIN_IMAGES_PER_CLASS}).",
    )
    args = parser.parse_args()
    dataset_root = args.dataset_root.expanduser().resolve()
    inspection_path = args.inspection_report.expanduser().resolve()

    if not dataset_root.is_dir():
        parser.error(f"Dataset root does not exist or is not a directory: {dataset_root}")
    if not inspection_path.is_file():
        parser.error(f"Inspection report does not exist: {inspection_path}")
    if args.train_images_per_class < 1:
        parser.error("--train-images-per-class must be at least 1.")

    inspection = json.loads(inspection_path.read_text(encoding="utf-8"))
    if Path(inspection["dataset_root"]).resolve() != dataset_root:
        parser.error("Inspection report was generated for a different dataset root.")
    if inspection["totals"]["unreadable_image_count"] != 0:
        parser.error("Inspection found unreadable images; resolve these before splitting.")
    if inspection["totals"]["unlabelled_files"] != 0:
        parser.error("Inspection found unlabelled files; resolve these before splitting.")
    if inspection["totals"]["unsupported_file_count"] != 0:
        parser.error("Inspection found unsupported files; resolve these before splitting.")

    records: list[dict[str, Any]] = []
    actual_counts: Counter[str] = Counter()
    content_hashes: dict[str, list[str]] = defaultdict(list)
    class_labels: list[str] = []

    crop_dirs = sorted(
        (path for path in dataset_root.iterdir() if path.is_dir()),
        key=lambda path: path.name.casefold(),
    )
    for crop_dir in crop_dirs:
        class_dirs = sorted(
            (path for path in crop_dir.iterdir() if path.is_dir()),
            key=lambda path: path.name.casefold(),
        )
        for class_dir in class_dirs:
            label = f"{display_name(crop_dir.name)} - {display_name(class_dir.name)}"
            class_labels.append(label)
            image_paths = sorted(
                (
                    path
                    for path in class_dir.rglob("*")
                    if path.is_file() and path.suffix.lower() in SUPPORTED_EXTENSIONS
                ),
                key=lambda path: str(path).casefold(),
            )
            for image_path in image_paths:
                if not is_readable_image(image_path):
                    raise ValueError(f"Image became unreadable after inspection: {image_path}")
                relative_path = image_path.relative_to(dataset_root).as_posix()
                records.append({"path": relative_path, "class_label": label})
                actual_counts[label] += 1
                content_hashes[sha256_file(image_path)].append(relative_path)

    if not records:
        parser.error("No readable, labeled image files were found.")
    if len(class_labels) != len(set(class_labels)):
        parser.error("Two class folders produce the same crop-and-disease label.")

    expected_counts = {
        class_info["class_label"]: class_info["valid_image_count"]
        for crop in inspection["crops"]
        for class_info in crop["classes"]
    }
    if dict(actual_counts) != expected_counts:
        parser.error(
            "Dataset contents differ from the inspection report; rerun inspect_dataset.py."
        )

    duplicate_groups = [
        paths for paths in content_hashes.values() if len(paths) > 1
    ]
    if duplicate_groups:
        raise ValueError(
            "Exact duplicate images were found after inspection. "
            "Regenerate the inspection report and resolve/group duplicates before splitting."
        )

    too_small = {
        label: count
        for label, count in actual_counts.items()
        if count < args.train_images_per_class + 2
    }
    if too_small:
        raise ValueError(
            "Each class needs at least the requested training images plus one "
            "validation and one test image; found: "
            f"{too_small}"
        )

    class_labels = sorted(class_labels, key=str.casefold)
    class_to_index = {label: index for index, label in enumerate(class_labels)}
    for record in records:
        record["class_index"] = class_to_index[record["class_label"]]

    records_by_class: dict[str, list[dict[str, Any]]] = defaultdict(list)
    for record in records:
        records_by_class[record["class_label"]].append(record)

    rng = random.Random(RANDOM_SEED)
    splits: dict[str, list[dict[str, Any]]] = {
        "train": [],
        "validation": [],
        "test": [],
    }
    for label in class_labels:
        class_records = records_by_class[label]
        rng.shuffle(class_records)
        splits["train"].extend(class_records[: args.train_images_per_class])
        remaining = class_records[args.train_images_per_class :]
        validation_count = len(remaining) // 2
        splits["validation"].extend(remaining[:validation_count])
        splits["test"].extend(remaining[validation_count:])

    for split_name, split_records in splits.items():
        split_counts = Counter(record["class_label"] for record in split_records)
        missing = sorted(set(class_labels) - set(split_counts))
        if missing:
            raise ValueError(f"{split_name} split has no examples for: {missing}")

    split_hashes = {
        split_name: {
            sha256_file(dataset_root / record["path"])
            for record in split_records
        }
        for split_name, split_records in splits.items()
    }
    split_names = list(splits)
    for index, first_name in enumerate(split_names):
        for second_name in split_names[index + 1 :]:
            overlap = split_hashes[first_name] & split_hashes[second_name]
            if overlap:
                raise ValueError(
                    f"Exact duplicate leakage detected between {first_name} and {second_name}."
                )

    class_mapping = {
        "task": "crop_and_disease_classification",
        "class_count": len(class_labels),
        "class_names": class_labels,
        "class_to_index": class_to_index,
        "index_to_class": {
            str(index): label for label, index in class_to_index.items()
        },
    }
    mapping_path = project_dir / "class_labels.json"
    mapping_path.write_text(
        json.dumps(class_mapping, indent=2, ensure_ascii=False) + "\n",
        encoding="utf-8",
    )

    split_counts = {
        split_name: dict(
            sorted(
                Counter(record["class_label"] for record in split_records).items(),
                key=lambda item: item[0].casefold(),
            )
        )
        for split_name, split_records in splits.items()
    }
    split_report = {
        "generated_at_utc": datetime.now(timezone.utc).isoformat(),
        "dataset_root": str(dataset_root),
        "inspection_report": str(inspection_path),
        "random_seed": RANDOM_SEED,
        "strategy": (
            "exactly the requested number of randomly selected training images "
            "per class; remaining images divided between validation and test"
        ),
        "train_images_per_class": args.train_images_per_class,
        "actual_split_sizes": {
            name: len(split_records) for name, split_records in splits.items()
        },
        "actual_split_fractions": {
            name: len(split_records) / len(records)
            for name, split_records in splits.items()
        },
        "class_count": len(class_labels),
        "total_images": len(records),
        "class_distribution": dict(
            sorted(actual_counts.items(), key=lambda item: item[0].casefold())
        ),
        "train_class_distribution": dict(
            sorted(
                Counter(
                    record["class_label"] for record in splits["train"]
                ).items(),
                key=lambda item: item[0].casefold(),
            )
        ),
        "split_class_distribution": split_counts,
        "splits": splits,
        "duplicate_groups_found": len(duplicate_groups),
        "near_duplicate_detection": "not performed",
    }
    report_path = project_dir / "results" / "dataset_split.json"
    report_path.parent.mkdir(parents=True, exist_ok=True)
    report_path.write_text(
        json.dumps(split_report, indent=2, ensure_ascii=False) + "\n",
        encoding="utf-8",
    )

    print(f"Images assigned: {len(records)} across {len(class_labels)} classes")
    for split_name, split_records in splits.items():
        counts = Counter(record["class_label"] for record in split_records)
        print(
            f"{split_name}: {len(split_records)} images "
            f"({len(counts)}/{len(class_labels)} classes represented)"
        )
    print(f"Exact duplicate groups across splits: {len(duplicate_groups)}")
    print(f"Class mapping saved to: {mapping_path}")
    print(f"Split manifest saved to: {report_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
