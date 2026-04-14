# 📱 Manual Dataset Download - Step by Step

The automated download had access issues. **No problem!** Download manually in 2 minutes:

## 🎯 STEP 1: Go to Roboflow

🔗 **Link**: https://universe.roboflow.com/fyp-odgmu/phone-using-dhjge

## 🎯 STEP 2: Download as YOLOv8

1. On the page, click **"Download Dataset"** button (top right)
2. Select dropdown: **"YOLOv8"** (if not already selected)
3. Click **"Continue"** or the download button
4. Browser will download ZIP file: `roboflow.zip`

## 🎯 STEP 3: Extract to Correct Folder

After download completes:

1. **Navigate to**: `backend/model/datasets/`
2. **Create folder** (if not exists): `phones_v1`
3. **Extract ZIP contents** into `phones_v1/`

### Final structure should be:
```
backend/model/datasets/phones_v1/
├── images/
│   ├── train/     (3224 images)
│   ├── val/       (631 images)
│   └── test/      (337 images - optional)
├── labels/
│   ├── train/     (YOLO .txt files)
│   ├── val/
│   └── test/      (optional)
└── data.yaml      ✅ IMPORTANT - Must exist!
```

## ✅ VERIFY SUCCESS

Check if this file exists:
```
backend/model/datasets/phones_v1/data.yaml
```

If **data.yaml** is there → **YOU'RE READY TO TRAIN!** ✅

## 🚀 NEXT: Train Model

Once extracted, run:
```bash
cd backend/model
python train_phone_model.py
```

---

**Tell me when you've extracted the dataset!**
