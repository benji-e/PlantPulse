"""Inspect a crop/disease image dataset without modifying the source files."""

from __future__ import annotations

import argparse
import hashlib
import json
import re
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
COUNT_SUFFIX = re.compile(r"\s*\(\d+\)\s*$")


def display_name(folder_name: str) -> str:
    """Remove an optional count suffix while preserving the source folder name elsewhere."""
    return COUNT_SUFFIX.sub("", folder_name).strip()


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as image_file:
        for chunk in iter(lambda: image_file.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def inspect_image(path: Path) -> tuple[bool, str | None]:
    try:
        with Image.open(path) as image:
            image.verify()
        return True, None
    except (UnidentifiedImageError, OSError, ValueError, SyntaxError) as error:
        return False, f"{type(error).__name__}: {error}"


def main() -> int:
    script_dir = Path(__file__).resolve().parent
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--dataset-root",
        type=Path,
        default=script_dir.parent / "resize plant_leaves dataset(1545)",
        help="Dataset directory (defaults to the dataset beside this project folder).",
    )
    parser.add_argument(
        "--output",
        type=Path,
        default=script_dir / "results" / "dataset_inspection.json",
        help="Where to save the inspection report.",
    )
    args = parser.parse_args()
    dataset_root = args.dataset_root.expanduser().resolve()
    output_path = args.output.expanduser().resolve()

    if not dataset_root.is_dir():
        parser.error(f"Dataset root does not exist or is not a directory: {dataset_root}")

    crop_dirs = sorted(
        (path for path in dataset_root.iterdir() if path.is_dir()),
        key=lambda path: path.name.casefold(),
    )
    report: dict[str, Any] = {
        "generated_at_utc": datetime.now(timezone.utc).isoformat(),
        "dataset_root": str(dataset_root),
        "expected_crop_count": 7,
        "crop_count": len(crop_dirs),
        "supported_image_extensions": sorted(SUPPORTED_EXTENSIONS),
        "crops": [],
        "unlabelled_files": [],
        "unexpected_files": [],
        "empty_folders": [],
        "unreadable_images": [],
        "duplicate_images": [],
        "totals": {},
    }

    totals = Counter()
    extension_counts = Counter()
    content_hashes: dict[str, list[str]] = defaultdict(list)

    for crop_dir in crop_dirs:
        class_dirs = sorted(
            (path for path in crop_dir.iterdir() if path.is_dir()),
            key=lambda path: path.name.casefold(),
        )
        crop_record: dict[str, Any] = {
            "folder_name": crop_dir.name,
            "crop_label": display_name(crop_dir.name),
            "class_folder_count": len(class_dirs),
            "classes": [],
            "unlabelled_files_at_crop_root": [],
        }

        for folder in (crop_dir, *crop_dir.rglob("*")):
            if folder.is_dir() and not any(folder.iterdir()):
                report["empty_folders"].append(str(folder))

        for path in sorted(crop_dir.iterdir(), key=lambda item: item.name.casefold()):
            if path.is_file():
                record = {"path": str(path), "reason": "file is directly in a crop folder"}
                crop_record["unlabelled_files_at_crop_root"].append(record)
                report["unlabelled_files"].append(record)

        for class_dir in class_dirs:
            class_record: dict[str, Any] = {
                "folder_name": class_dir.name,
                "disease_or_health_label": display_name(class_dir.name),
                "class_label": (
                    f"{display_name(crop_dir.name)} - {display_name(class_dir.name)}"
                ),
                "image_count": 0,
                "valid_image_count": 0,
                "unreadable_image_count": 0,
                "unsupported_file_count": 0,
                "image_extensions": {},
                "representative_filenames": [],
                "nested_folders": [],
            }
            class_files = sorted(
                (path for path in class_dir.rglob("*") if path.is_file()),
                key=lambda path: str(path).casefold(),
            )
            class_record["nested_folders"] = sorted(
                str(path.relative_to(class_dir))
                for path in class_dir.rglob("*")
                if path.is_dir()
            )

            for path in class_files:
                extension = path.suffix.lower()
                if extension not in SUPPORTED_EXTENSIONS:
                    class_record["unsupported_file_count"] += 1
                    record = {
                        "path": str(path),
                        "reason": "unsupported file extension",
                    }
                    report["unexpected_files"].append(record)
                    continue

                class_record["image_count"] += 1
                extension_counts[extension] += 1
                class_record["image_extensions"][extension] = (
                    class_record["image_extensions"].get(extension, 0) + 1
                )
                class_record["representative_filenames"].append(path.name)
                is_valid, error = inspect_image(path)
                if is_valid:
                    class_record["valid_image_count"] += 1
                    content_hashes[sha256_file(path)].append(str(path))
                else:
                    class_record["unreadable_image_count"] += 1
                    report["unreadable_images"].append(
                        {"path": str(path), "error": error}
                    )

            class_record["representative_filenames"] = (
                class_record["representative_filenames"][:5]
            )
            crop_record["classes"].append(class_record)
            for key in (
                "image_count",
                "valid_image_count",
                "unreadable_image_count",
                "unsupported_file_count",
            ):
                totals[key] += class_record[key]

        report["crops"].append(crop_record)

    for path in sorted(dataset_root.iterdir(), key=lambda item: item.name.casefold()):
        if path.is_file():
            report["unexpected_files"].append(
                {"path": str(path), "reason": "file is directly in the dataset root"}
            )

    report["duplicate_images"] = [
        {"sha256": digest, "paths": paths}
        for digest, paths in sorted(content_hashes.items())
        if len(paths) > 1
    ]
    report["totals"] = {
        "crop_folders": len(crop_dirs),
        "class_folders": sum(crop["class_folder_count"] for crop in report["crops"]),
        **dict(totals),
        "supported_image_extensions": dict(sorted(extension_counts.items())),
        "unlabelled_files": len(report["unlabelled_files"]),
        "unexpected_files": len(report["unexpected_files"]),
        "empty_folders": len(report["empty_folders"]),
        "duplicate_file_groups": len(report["duplicate_images"]),
        "images_in_duplicate_groups": sum(
            len(group["paths"]) for group in report["duplicate_images"]
        ),
    }

    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(json.dumps(report, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")

    print(f"Dataset root: {dataset_root}")
    print(
        f"Crop folders: {report['totals']['crop_folders']} "
        f"(expected {report['expected_crop_count']})"
    )
    for crop in report["crops"]:
        print(f"\n{crop['folder_name']} -> {crop['crop_label']}")
        for class_info in crop["classes"]:
            print(
                f"  {class_info['folder_name']} -> {class_info['class_label']}: "
                f"{class_info['valid_image_count']} valid / "
                f"{class_info['image_count']} supported-extension files"
            )
            if class_info["representative_filenames"]:
                print(
                    "    Examples: "
                    + ", ".join(class_info["representative_filenames"])
                )

    print("\nTotals:")
    for key, value in report["totals"].items():
        print(f"  {key}: {value}")
    print(f"Unreadable images: {len(report['unreadable_images'])}")
    print(f"Empty folders: {len(report['empty_folders'])}")
    print(f"Unlabelled files: {len(report['unlabelled_files'])}")
    print(f"Unexpected files: {len(report['unexpected_files'])}")
    print(f"Exact duplicate groups: {len(report['duplicate_images'])}")
    print(f"Report saved to: {output_path}")

    if len(crop_dirs) != report["expected_crop_count"]:
        print("WARNING: The discovered crop-folder count differs from the expected count.")
    if report["totals"]["class_folders"] == 0:
        print("ERROR: No class folders were found; reliable labels cannot be determined.")
        return 2
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
