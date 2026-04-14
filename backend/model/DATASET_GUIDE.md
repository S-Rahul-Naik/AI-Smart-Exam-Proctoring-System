# Phone Detection Model Training Guide

## Folder Structure Created
```
backend/model/
├── datasets/              # Download datasets here
│   ├── phones_v1/       # Dataset 1
│   ├── phones_v2/       # Dataset 2
│   └── custom_data/     # Your custom data
├── trained_models/      # Trained models saved here
└── training_logs/       # Training logs
```

---

## 📱 BEST PHONE DETECTION DATASETS

### 1. **Roboflow - Phone Detection Dataset** (BEST FOR YOU)
🔗 **Link**: https://universe.roboflow.com/search?q=phone%20detection
- Multiple phone datasets available
- Various lighting conditions
- Different phone models
- **Popular options**:
  - Phone Detection (General): https://universe.roboflow.com/phone-detection-83cvd
  - Mobile Phone Detection: https://universe.roboflow.com/mobile-phone-detection-hh47w
  - Cell Phone Detection: https://universe.roboflow.com/workspace/cell-phone/cell-phone-detection/dataset

**How to Use Roboflow:**
1. Go to link → Click "Download"
2. Select "YOLOv8" format
3. Select "download zip"
4. Extract to `backend/model/datasets/phones_v1/`

### 2. **Open Images Dataset - Phones**
🔗 **Link**: https://storage.googleapis.com/openimages/web/visualizer/index.html
- Search for "cellular phone"
- Millions of images available
- Free to use
- Requires downloading via script

### 3. **COCO Dataset - Cell Phone Class**
🔗 **Link**: https://cocodataset.org/
- Professional dataset
- Class 67 = cell phone
- Already trained models on this

### 4. **ImageNet - Mobile Phone**
🔗 **Link**: https://www.image-net.org/
- High quality images
- Various angles and lighting
- Professional dataset

### 5. **GitHub - Phone Detection Datasets**
🔗 **Link 1**: https://github.com/robustness-gym/robustness-gym (includes phone datasets)
🔗 **Link 2**: https://github.com/ultralytics/yolov5/wiki/Detect-Objects-in-Images (example datasets)

---

## 🚀 QUICKSTART - Fastest Way to Get Data

### Option A: Use Roboflow (Easiest)
```bash
# 1. Go to https://universe.roboflow.com/search?q=phone%20detection
# 2. Pick a phone dataset
# 3. Click Download → YOLOv8 format → Get zip
# 4. Extract to: backend/model/datasets/phones_v1/
```

### Option B: Download via Script (Automatic)
I'll create a script to auto-download datasets.

### Option C: Use Best.pt + Fine-tune (Fast)
```bash
# Use best.pt as starting point, fine-tune on phone data
# This is faster but less accurate than training from scratch
```

---

## 📊 Dataset Requirements for YOLOv8

```
datasets/phones_v1/
├── images/
│   ├── train/     (70% of images)
│   ├── val/       (15% of images)
│   └── test/      (15% of images)
├── labels/
│   ├── train/     (YOLO .txt format)
│   ├── val/
│   └── test/
└── data.yaml      # Dataset config
```

---

## 🎓 Training Steps (Once You Have Data)

### Step 1: Prepare Dataset
- Download from links above
- Verify YOLO format
- Check train/val/test split

### Step 2: Install Requirements
```bash
pip install ultralytics opencv-python
```

### Step 3: Run Training
```bash
python train_phone_model.py
```

### Step 4: Test Model
```bash
python detect_phone.py --model runs/detect/train/weights/best.pt --image test.jpg
```

---

## 🔗 RECOMMENDED FLOW

1. **Start Here** → Go to Roboflow phone dataset
2. **Download** → Get YOLOv8 format
3. **Extract** → Put in `backend/model/datasets/phones_v1/`
4. **I'll create** → training script
5. **Train** → Custom phone detection model
6. **Deploy** → Use trained model in proctoring system

---

## Next Steps

1. Pick a dataset from above
2. Download it
3. Tell me when ready → I'll create training script
4. Start training
5. Deploy custom model

---

**What to do now:**
- Go pick a dataset from Roboflow (easiest)
- Download as YOLOv8 format
- Extract to `backend/model/datasets/phones_v1/`
- Come back and tell me "DATASET READY"
