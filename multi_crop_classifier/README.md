# Experimental Multi-Crop Leaf Classifier

This experiment classifies images into crop-and-disease/health labels discovered
from the local seven-crop dataset. It is not a validated cassava disease
diagnosis system or a field-ready agricultural recommendation tool.

## Dataset and split

Place the original `resize plant_leaves dataset(1545)` folder next to this
project directory. The scripts inspect and read source images in place; they do
not modify or copy the original dataset.

The current deterministic split uses random seed 42 and exactly 10 training
images from each of the 29 class folders (290 training images total). All other
valid images are assigned to validation and held-out test sets. Exact duplicate
files are checked so they cannot leak across splits. Near-duplicate detection is
not performed. The classes with only 12 images each have one validation and one
test example, so their evaluation is especially uncertain.

Inspect the dataset and prepare the split from the workspace root:

```powershell
.\.venv\Scripts\python.exe .\multi_crop_classifier\inspect_dataset.py
.\.venv\Scripts\python.exe .\multi_crop_classifier\prepare_dataset.py --train-images-per-class 10
```

The inspection report is saved to `results/dataset_inspection.json`, the
class-index mapping to `class_labels.json`, and the image paths and exact split
assignments to `results/dataset_split.json`.

## Environment and training

Use the project virtual environment:

```powershell
.\.venv\Scripts\python.exe -m pip install -r .\multi_crop_classifier\requirements.txt
```

Training uses TensorFlow/Keras MobileNetV2 with ImageNet pretrained weights,
160 × 160 input images, a frozen feature extractor, training-only augmentation,
batch size 8, and up to five epochs with early stopping. The pretrained weights
require internet access on the first run. TensorFlow itself is a large Windows
package; its download may take a long time on a slow connection.

When the dependencies have installed successfully:

```powershell
.\.venv\Scripts\python.exe .\multi_crop_classifier\train_model.py
```

The best validation-loss checkpoint is saved as
`model/best_model.keras`; training settings and per-epoch metrics are written to
`results/training_history.json`. Training and validation scores are not
substitutes for held-out test metrics.

## Evaluation and prediction

After training, evaluate once on the held-out test set:

```powershell
.\.venv\Scripts\python.exe .\multi_crop_classifier\evaluate_model.py
```

Test metrics and the confusion matrix are saved under `results/`. For a new
JPEG image:

```powershell
.\.venv\Scripts\python.exe .\multi_crop_classifier\predict_image.py "C:\path\to\leaf.jpg"
```

The prediction score is a model softmax output, not necessarily a calibrated
probability of correctness. The model only selects among the 29 classes it was
trained to recognize; it cannot reliably identify unknown crops, diseases, or
image conditions. Predictions should not be used alone to make treatment
decisions.

### Current test result

The saved checkpoint was evaluated on 634 held-out images: accuracy **80.13%**,
macro F1 **80.58%**, and weighted F1 **79.75%**. Inference averaged **65.15 ms
per image** on the CPU in this run. See `results/test_metrics.json` for
per-class precision/recall/F1 and `results/confusion_matrix.csv` for class
confusions. Two classes have only one test image each, so their per-class
metrics are particularly unstable. These results describe only this split and
do not establish real-world field performance.

## Research limitation

The available data is a seven-crop collection, not the Ugandan Cassava Leaf
Disease dataset named in the research proposal. Results from this experiment
must not be presented as validated cassava-diagnosis performance. To repeat the
workflow on cassava data, inspect that dataset first, confirm its actual label
structure, then regenerate the class mapping and splits before training.

## Cassava model in Google Colab

For the proposal's cassava task, use
`cassava_colab_training.ipynb` in Google Colab instead of this seven-crop
checkpoint. The notebook downloads the official TFDS cassava dataset from
within Colab, discovers and saves its label-index order, trains a separate
MobileNetV2 model, evaluates on the published held-out test split, and saves
`cassava_model.keras`, `class_labels.json`, metrics, training history, and a
confusion matrix under `MyDrive/cassava_leaf_model/`.

The notebook follows the current experiment constraint of 10 randomly selected
training examples per class by default. Set `TRAIN_IMAGES_PER_CLASS = None` in
the configuration cell to train on the complete official training split for a
stronger experiment. A GPU runtime is recommended; the pretrained MobileNetV2
weights and dataset require internet access in Colab. Keep the generated
cassava model and its cassava class-label file together; do not pair them with
the seven-crop model's mapping.
