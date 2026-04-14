# 🚀 QUICK START - Train Custom Phone Detection Model

## ✅ Folder Structure Ready
```
backend/model/
├── datasets/              ← Download datasets here
├── trained_models/        ← Trained models saved here
├── training_logs/         ← Training logs
├── DATASET_GUIDE.md       ← Dataset links & info
└── train_phone_model.py   ← Training script
```

---

## 📱 STEP 1: GET DATASET (Pick ONE)

### 🌟 **EASIEST** - Roboflow
1. Go: https://universe.roboflow.com/search?q=phone%20detection
2. Pick any phone detection dataset
3. Click **Download**
4. Select **YOLOv8** format
5. Click **download zip**
6. Extract to: `backend/model/datasets/phones_v1/`

**That's it!**

---

## 🎓 STEP 2: PREPARE DATASET

After extracting, you should have:
```
backend/model/datasets/phones_v1/
├── images/
│   ├── train/     (phone images)
│   ├── val/       (validation images)
│   └── test/      (test images)
├── labels/
│   ├── train/     (.txt files with bounding boxes)
│   ├── val/
│   └── test/
└── data.yaml      ← IMPORTANT: Must have this!
```

**If you don't see data.yaml, download again!**

---

## 🏃 STEP 3: TRAIN MODEL

Open terminal in `backend/model/` and run:

```bash
# Install ultralytics if needed
pip install ultralytics

# Train model
python train_phone_model.py
```

**Or with custom settings:**
```bash
python train_phone_model.py --epochs 200 --batch 32 --model m
```

Options:
- `--epochs`: Number of training iterations (default: 100)
- `--batch`: Batch size (default: 16)
- `--model`: Model size - n(tiny)/s(small)/m(medium)/l(large)/x(xlarge)
- `--dataset`: Path to dataset (auto-detected if not provided)

---

## ⏱️ TRAINING TIME

| Model | GPU (RTX 3060) | CPU |
|-------|---|---|
| Nano (n) | ~5 min | ~30 min |
| Small (s) | ~10 min | ~60 min |
| Medium (m) | ~20 min | ~120 min |

**GPU = MUCH FASTER!**

---

## 📊 AFTER TRAINING

```
backend/model/trained_models/phone_detector/
├── weights/
│   ├── best.pt        ← This is your trained model!
│   └── last.pt
└── results/           ← Training metrics & graphs
```

---

## 🔌 STEP 4: USE TRAINED MODEL IN SYSTEM

After training, the model is automatically copied to:
```
backend/src/services/phone_detector_custom.pt
```

Update detection service to use it:
```python
# In yoloPhoneDetection.py
MODEL_PATH = "phone_detector_custom.pt"  # Use custom trained model
```

---

## 📋 DATASET RECOMMENDATIONS

| Dataset | Quality | Size | Best For |
|---------|---------|------|----------|
| **Roboflow** | ⭐⭐⭐⭐⭐ | Medium | **START HERE** |
| **COCO** | ⭐⭐⭐⭐ | Large | Professional |
| **ImageNet** | ⭐⭐⭐⭐⭐ | Very Large | High Accuracy |
| **Open Images** | ⭐⭐⭐⭐ | Huge | Diverse |

---

## 🧪 TEST YOUR MODEL

```bash
# After training
python train_phone_model.py --test model_path.pt --test-model test_image.jpg
```

---

## ⚡ NEXT: DO THIS NOW

1. **Go to**: https://universe.roboflow.com/search?q=phone%20detection
2. **Pick** a phone dataset
3. **Download** as YOLOv8 format
4. **Extract** to: `backend/model/datasets/phones_v1/`
5. **Tell me** "DATASET READY"
6. **I'll help** with training next!

---

## 💡 TIPS

✅ Use GPU if available (100x faster)
✅ Start with small batch (16) then increase
✅ Use model 'n' (nano) for speed OR 'm' (medium) for accuracy
✅ Monitor GPU: `nvidia-smi` (if on Windows + GPU)
✅ Training stops early if no improvement (patience=20)

---

## ❓ ISSUES?

- **No CUDA**: CPU training works but slow
- **Out of Memory**: Lower batch size (8 or 4)
- **Bad Results**: Use bigger dataset or more epochs
- **Slow Detection**: Use smaller model (nano)

---

Let me know when you have the dataset! 🚀
