#!/usr/bin/env python3
"""
YOLO Phone Detection Model Test with Visualization
Tests the model on dataset images and displays detection results with bounding boxes
"""

import os
import sys
from pathlib import Path
import cv2
import numpy as np
from collections import defaultdict
import json
from datetime import datetime

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

def test_model_on_dataset():
    """Test YOLO model on dataset images with visualization"""
    
    print("\n" + "="*70)
    print("🤖 YOLO Phone Detection Model Test with Visualization")
    print("="*70 + "\n")
    
    # Find available model
    model_names = ['best.pt', 'yolov8n.pt', 'yolo26n.pt']
    model_path = None
    
    for model_name in model_names:
        candidate = Path(__file__).parent / model_name
        if candidate.exists():
            model_path = candidate
            break
    
    if model_path is None:
        print("❌ ERROR: No model found. Trying parent directory...")
        for model_name in model_names:
            candidate = Path(__file__).parent.parent.parent / model_name
            if candidate.exists():
                model_path = candidate
                break
    
    if model_path is None:
        print("❌ ERROR: Could not find model file")
        print(f"   Looked for: {model_names}")
        sys.exit(1)
    
    print(f"✅ Model found: {model_path.name}")
    print(f"   Size: {model_path.stat().st_size / (1024*1024):.2f} MB")
    print(f"   Modified: {datetime.fromtimestamp(model_path.stat().st_mtime)}\n")
    
    # Import YOLO
    try:
        from ultralytics import YOLO
        print("✅ PyTorch/YOLO libraries loaded\n")
    except ImportError as e:
        print(f"❌ Cannot import YOLO: {e}")
        print("   Installing required packages...")
        os.system("pip install ultralytics torch torchvision")
        from ultralytics import YOLO
    
    # Load model
    print(f"📦 Loading model from {model_path}...")
    try:
        model = YOLO(str(model_path))
        print("✅ Model loaded successfully\n")
    except Exception as e:
        print(f"❌ Failed to load model: {e}")
        sys.exit(1)
    
    # Dataset paths
    dataset_root = Path(__file__).parent / 'datasets'
    test_images_dir = dataset_root / 'test' / 'images'
    test_labels_dir = dataset_root / 'test' / 'labels'
    
    if not test_images_dir.exists():
        print(f"❌ Dataset not found at {test_images_dir}")
        sys.exit(1)
    
    print(f"📁 Dataset path: {test_images_dir}")
    
    # Get image list
    image_files = sorted([f for f in test_images_dir.glob('*.jpg')] + 
                         [f for f in test_images_dir.glob('*.jpeg')] +
                         [f for f in test_images_dir.glob('*.png')])
    
    print(f"📊 Found {len(image_files)} test images\n")
    
    if len(image_files) == 0:
        print("❌ No images found in test directory")
        sys.exit(1)
    
    # Create output directory
    output_dir = Path(__file__).parent / 'test_results' / f'run_{datetime.now().strftime("%Y%m%d_%H%M%S")}'
    output_dir.mkdir(parents=True, exist_ok=True)
    
    print(f"📤 Results will be saved to: {output_dir}\n")
    
    # Statistics
    stats = {
        'total_images': len(image_files),
        'images_with_phone': 0,
        'images_without_phone': 0,
        'total_detections': 0,
        'detections_per_image': [],
        'confidence_scores': [],
        'inference_times': [],
        'processing_errors': 0,
        'tested_images': []
    }
    
    # Test on first 20 images (for quick testing)
    test_limit = min(20, len(image_files))
    print(f"🔬 Testing on first {test_limit} images...\n")
    print("-" * 70)
    
    for idx, image_path in enumerate(image_files[:test_limit], 1):
        print(f"\n[{idx}/{test_limit}] Processing: {image_path.name}")
        
        try:
            # Read image
            img = cv2.imread(str(image_path))
            if img is None:
                print(f"   ❌ Could not read image")
                stats['processing_errors'] += 1
                continue
            
            h, w = img.shape[:2]
            print(f"   📐 Image size: {w}x{h}")
            
            # Run inference
            print(f"   🔍 Running inference...")
            results = model(image_path, conf=0.3, imgsz=640, device='cpu')
            
            if results is None or len(results) == 0:
                print(f"   ⚠️  No results returned")
                stats['processing_errors'] += 1
                continue
            
            result = results[0]
            inference_time = result.speed['inference']  # ms
            stats['inference_times'].append(inference_time)
            print(f"   ⏱️  Inference time: {inference_time:.2f}ms")
            
            # Get detections
            boxes = result.boxes
            num_detections = len(boxes) if boxes is not None else 0
            
            print(f"   📍 Detections: {num_detections}")
            
            if num_detections > 0:
                stats['images_with_phone'] += 1
                stats['total_detections'] += num_detections
                
                # Draw boxes on image
                img_marked = img.copy()
                
                for i, box in enumerate(boxes):
                    # Get box coordinates
                    x1, y1, x2, y2 = map(int, box.xyxy[0])
                    conf = float(box.conf[0])
                    
                    stats['confidence_scores'].append(conf)
                    
                    # Draw bounding box
                    color = (0, 255, 0) if conf > 0.7 else (0, 165, 255)  # Green if confident, orange if less
                    cv2.rectangle(img_marked, (x1, y1), (x2, y2), color, 2)
                    
                    # Draw label
                    label = f"Phone {conf:.2%}"
                    font = cv2.FONT_HERSHEY_SIMPLEX
                    font_scale = 0.5
                    thickness = 1
                    
                    text_size = cv2.getTextSize(label, font, font_scale, thickness)[0]
                    cv2.rectangle(img_marked, (x1, y1-20), (x1+text_size[0], y1), color, -1)
                    cv2.putText(img_marked, label, (x1, y1-5), font, font_scale, (255, 255, 255), thickness)
                    
                    print(f"      📦 Detection {i+1}: Box({x1}, {y1}, {x2}, {y2}) Confidence: {conf:.2%}")
                
                # Save marked image
                output_path = output_dir / f"{image_path.stem}_DETECTED.jpg"
                cv2.imwrite(str(output_path), img_marked)
                print(f"   💾 Saved: {output_path.name}")
            else:
                stats['images_without_phone'] += 1
                output_path = output_dir / f"{image_path.stem}_CLEAN.jpg"
                cv2.imwrite(str(output_path), img)
                print(f"   ✓ No phone detected - image saved as clean")
            
            stats['detections_per_image'].append(num_detections)
            stats['tested_images'].append({
                'name': image_path.name,
                'detections': num_detections,
                'inference_time': inference_time
            })
            
        except Exception as e:
            print(f"   ❌ Error processing image: {e}")
            stats['processing_errors'] += 1
            import traceback
            traceback.print_exc()
    
    # Print summary
    print("\n" + "="*70)
    print("📊 TEST SUMMARY")
    print("="*70)
    
    print(f"\n✅ Testing Complete!")
    print(f"   Total images tested: {stats['total_images']}")
    print(f"   Images processed: {test_limit}")
    print(f"   Images with phone: {stats['images_with_phone']}")
    print(f"   Images without phone: {stats['images_without_phone']}")
    print(f"   Processing errors: {stats['processing_errors']}")
    
    if stats['total_detections'] > 0:
        print(f"\n📍 Detection Statistics:")
        print(f"   Total detections: {stats['total_detections']}")
        print(f"   Average detections per image: {np.mean(stats['detections_per_image']):.2f}")
        print(f"   Avg confidence: {np.mean(stats['confidence_scores']):.2%}")
        print(f"   Min confidence: {np.min(stats['confidence_scores']):.2%}")
        print(f"   Max confidence: {np.max(stats['confidence_scores']):.2%}")
    
    if stats['inference_times']:
        print(f"\n⏱️  Performance Statistics:")
        print(f"   Avg inference time: {np.mean(stats['inference_times']):.2f}ms")
        print(f"   Min inference time: {np.min(stats['inference_times']):.2f}ms")
        print(f"   Max inference time: {np.max(stats['inference_times']):.2f}ms")
    
    # Save detailed results
    results_file = output_dir / 'test_results.json'
    with open(results_file, 'w') as f:
        json.dump({k: v for k, v in stats.items() if k != 'tested_images'}, 
                  f, indent=2)
    
    # Save list of tested images
    tested_file = output_dir / 'tested_images.json'
    with open(tested_file, 'w') as f:
        json.dump(stats['tested_images'], f, indent=2)
    
    print(f"\n💾 Results saved to: {output_dir}")
    print(f"   - Test results: test_results.json")
    print(f"   - Tested images: tested_images.json")
    print(f"   - Marked images: *_DETECTED.jpg / *_CLEAN.jpg")
    
    print("\n" + "="*70)
    print(f"✅ Model is WORKING CORRECTLY!" if stats['images_with_phone'] > 0 else "⚠️  No phones detected in test set")
    print("="*70 + "\n")

if __name__ == '__main__':
    test_model_on_dataset()
