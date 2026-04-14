#!/usr/bin/env python3
"""
Custom Phone Detection Model Training Script
Trains YOLOv8 on phone detection dataset
"""

import os
import sys
from pathlib import Path
from ultralytics import YOLO
import argparse

# Get repo root
REPO_ROOT = Path(__file__).parent.parent.parent
MODEL_DIR = REPO_ROOT / 'backend' / 'model'
DATASETS_DIR = MODEL_DIR / 'datasets'
TRAINED_MODELS_DIR = MODEL_DIR / 'trained_models'
TRAINING_LOGS_DIR = MODEL_DIR / 'training_logs'

# Ensure directories exist
TRAINED_MODELS_DIR.mkdir(parents=True, exist_ok=True)
TRAINING_LOGS_DIR.mkdir(parents=True, exist_ok=True)

def train_phone_detection(
    dataset_path: str = None,
    epochs: int = 100,
    batch_size: int = 16,
    img_size: int = 640,
    model_variant: str = 'n'  # n=nano, s=small, m=medium, l=large
):
    """
    Train YOLOv8 model for phone detection
    
    Args:
        dataset_path: Path to dataset (should have data.yaml)
        epochs: Number of training epochs
        batch_size: Batch size for training
        img_size: Image size for training
        model_variant: YOLOv8 variant (n, s, m, l, x)
    """
    
    print("=" * 80)
    print("🚀 PHONE DETECTION MODEL TRAINING")
    print("=" * 80)
    
    # Auto-detect dataset if not provided
    if not dataset_path:
        # Check for data.yaml directly in datasets folder
        if (DATASETS_DIR / 'data.yaml').exists():
            dataset_path = str(DATASETS_DIR)
            print(f"✅ Found dataset: {dataset_path}")
        else:
            # Check for subdirectories
            possible_datasets = list(DATASETS_DIR.glob('*/data.yaml'))
            if possible_datasets:
                dataset_path = str(possible_datasets[0].parent)
                print(f"✅ Found dataset: {dataset_path}")
            else:
                print("❌ No dataset found!")
                print(f"   Please download dataset to: {DATASETS_DIR}")
                print("   Expected structure (either of these):")
                print("   Option 1:")
                print("   datasets/")
                print("   ├── data.yaml")
                print("   ├── train/")
                print("   ├── valid/")
                print("   └── test/")
                print("\n   Option 2:")
                print("   datasets/phones_v1/")
                print("   ├── images/")
                print("   ├── labels/")
                print("   └── data.yaml")
                sys.exit(1)
    
    dataset_path = Path(dataset_path)
    
    # Verify data.yaml exists
    data_yaml = dataset_path / 'data.yaml'
    if not data_yaml.exists():
        print(f"❌ data.yaml not found at {data_yaml}")
        sys.exit(1)
    
    print(f"\n📊 Training Configuration:")
    print(f"   Dataset: {dataset_path}")
    print(f"   Epochs: {epochs}")
    print(f"   Batch Size: {batch_size}")
    print(f"   Image Size: {img_size}x{img_size}")
    print(f"   Model: YOLOv8{model_variant}")
    print(f"   Output Dir: {TRAINED_MODELS_DIR}")
    
    # Load model
    print(f"\n🤖 Loading YOLOv8{model_variant}...")
    model = YOLO(f'yolov8{model_variant}.pt')
    
    # Train
    print(f"\n⏳ Training starting...")
    results = model.train(
        data=str(data_yaml),
        epochs=epochs,
        imgsz=img_size,
        batch=batch_size,
        device=0,  # Use GPU
        patience=20,  # Early stopping
        save=True,
        project=str(TRAINED_MODELS_DIR),
        name='phone_detector',
        exist_ok=True,  # Overwrite if exists
        verbose=True,
    )
    
    print("\n" + "=" * 80)
    print("✅ TRAINING COMPLETE!")
    print("=" * 80)
    
    # Get best model path
    best_model = TRAINED_MODELS_DIR / 'phone_detector' / 'weights' / 'best.pt'
    print(f"\n📦 Best Model: {best_model}")
    print(f"   File size: {best_model.stat().st_size / (1024*1024):.2f} MB")
    
    # Test model
    print(f"\n🧪 Testing model on validation set...")
    val_results = model.val()
    
    print(f"\n📈 Results saved to: {TRAINING_LOGS_DIR}")
    
    # Copy to main location
    import shutil
    final_model = REPO_ROOT / 'backend' / 'src' / 'services' / 'phone_detector_custom.pt'
    if best_model.exists():
        shutil.copy(best_model, final_model)
        print(f"\n✅ Model copied to: {final_model}")
    
    return best_model

def test_model(model_path: str, test_image: str):
    """Test trained model on image"""
    print(f"\n🧪 Testing model: {model_path}")
    print(f"   Image: {test_image}")
    
    model = YOLO(model_path)
    results = model.predict(test_image, conf=0.3)
    
    print(f"\n✅ Detection complete!")
    for result in results:
        if result.boxes:
            print(f"   {len(result.boxes)} phone(s) detected")
            for box in result.boxes:
                print(f"   - Confidence: {box.conf.item():.2%}")

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Train YOLOv8 Phone Detection Model')
    parser.add_argument('--dataset', type=str, default=None, help='Path to dataset')
    parser.add_argument('--epochs', type=int, default=100, help='Number of epochs')
    parser.add_argument('--batch', type=int, default=16, help='Batch size')
    parser.add_argument('--img-size', type=int, default=640, help='Image size')
    parser.add_argument('--model', type=str, default='n', help='Model variant (n/s/m/l/x)')
    parser.add_argument('--test', type=str, default=None, help='Test image path')
    parser.add_argument('--test-model', type=str, default=None, help='Model to test with')
    
    args = parser.parse_args()
    
    if args.test and args.test_model:
        # Test mode
        test_model(args.test_model, args.test)
    else:
        # Train mode
        train_phone_detection(
            dataset_path=args.dataset,
            epochs=args.epochs,
            batch_size=args.batch,
            img_size=args.img_size,
            model_variant=args.model
        )
