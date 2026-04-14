# 📱 Custom Phone Detection Model Training

**Status**: ✅ Setup Ready | ⏳ Waiting for Dataset

This folder contains everything needed to **train a custom YOLOv8 phone detection model** specifically optimized for proctoring exam detection.

---

## 📂 Folder Structure

```
backend/model/
│
├── 📁 datasets/                    # Training datasets
│   ├── phones_v1/                 # Main dataset (you'll download here)
│   └── phones_v2/                 # Optional: secondary dataset
│
├── 📁 trained_models/              # Trained model outputs
│   └── phone_detector/
│       ├── weights/
│       │   ├── best.pt             # ← Best trained model
│       │   └── last.pt
│       └── results/
│
├── 📁 training_logs/               # Training metrics & logs
│
├── 🐍 train_phone_model.py         # Main training script
├── 📖 DATASET_GUIDE.md             # Where to get datasets
├── 🚀 QUICK_START.md               # Get started in 5 minutes
└── 📋 README.md                    # This file

```

---

## 🎯 Why Train a Custom Model?

❌ **Problem with best.pt:**
- Generic YOLO trained on general objects
- Not optimized for phones specifically
- Your system shows phone detection not working well
- Lots of false positives/negatives

✅ **Solution: Custom Training**
- Train on specific phone detection dataset
- Model learns phone characteristics
- Optimized for your exam proctoring use case
- Much higher accuracy

---

## 🚀 THREE-STEP PROCESS

### Step 1️⃣: Get Dataset (5 minutes)
- Download phone detection dataset from Roboflow
- Extract to `datasets/phones_v1/`
- See `DATASET_GUIDE.md` for links

### Step 2️⃣: Train Model (5-30 minutes)
```bash
python train_phone_model.py
```
- Automatically finds dataset
- Trains YOLOv8 on phone data
- Saves best model

### Step 3️⃣: Deploy Model (1 minute)
- Model automatically copied to `backend/src/services/`
- System uses new trained model
- MUCH better phone detection!

---

## 📊 Dataset Options

| Source | Link | Format | Speed |
|--------|------|--------|-------|
| **Roboflow** ⭐ | https://universe.roboflow.com/search?q=phone%20detection | YOLOv8 | ⚡⚡⚡ |
| COCO | https://cocodataset.org/ | Various | ⚡ |
| ImageNet | https://image-net.org/ | Various | ⚡⚡ |
| Open Images | https://storage.googleapis.com/openimages | Various | ⚡ |

**👉 START WITH ROBOFLOW** - Easiest and YOLOv8 format ready!

---

## 📖 Quick Reference

### Get Started:
1. Read `QUICK_START.md` (5 min)
2. Read `DATASET_GUIDE.md` (2 min)
3. Download dataset (2 min)
4. Extract dataset (1 min)
5. Run training script (5-30 min depending on dataset size)

### Training:
```bash
# Default training
python train_phone_model.py

# Custom epochs and batch size
python train_phone_model.py --epochs 200 --batch 32

# Specific dataset
python train_phone_model.py --dataset path/to/dataset
```

### Options:
- `--epochs`: Training iterations (100)
- `--batch`: Batch size (16)
- `--img-size`: Image resolution (640)
- `--model`: Size - n/s/m/l/x (n = tiny/fast, x = big/accurate)

---

## 💡 Recommendations

**For Fast Training:**
- Model: `nano` (n)
- Epochs: 50-100
- Batch: 16
- Dataset: Roboflow (10k images)

**For Accurate Detection:**
- Model: `medium` (m) or `large` (l)
- Epochs: 200-300
- Batch: 32
- Dataset: Large dataset (50k+ images)

---

## ⏱️ Time Estimates

| Task | Time |
|------|------|
| Download dataset | 2-10 min |
| Extract dataset | 1 min |
| Prepare dataset | 2 min |
| Training (GPU) | 5-30 min |
| Testing | 2 min |
| **Total** | **~15-45 min** |

**Much faster with GPU! CPU = 10x slower**

---

## 📈 After Training

Your trained model will be:
```
backend/model/trained_models/phone_detector/weights/best.pt
```

Automatically copied to:
```
backend/src/services/phone_detector_custom.pt
```

Then deployed in your proctoring system!

---

## 🔧 Requirements

```bash
# Install if needed
pip install ultralytics opencv-python torch
```

**GPU Support (NVIDIA):**
```bash
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu118
```

---

## 📞 NEXT STEPS

1. **READ**: `QUICK_START.md` (2 min)
2. **READ**: `DATASET_GUIDE.md` (3 min)
3. **DOWNLOAD**: Phone dataset (5 min)
4. **EXTRACT**: To `datasets/phones_v1/` (1 min)
5. **TELL ME**: "DATASET READY" (0 min)
6. **RUN**: Training script (15-30 min)
7. **DEPLOY**: New model in system (1 min)

---

## 🎓 Learning Resources

- YOLOv8 Docs: https://docs.ultralytics.com/
- Roboflow: https://roboflow.com/
- YOLO Training Guide: https://github.com/ultralytics/yolov5

---

**STATUS**: 

✅ Model folder structure created
✅ Training script ready
✅ Documentation complete
⏳ WAITING FOR YOUR DATASET

**→ Go get dataset and come back!**
