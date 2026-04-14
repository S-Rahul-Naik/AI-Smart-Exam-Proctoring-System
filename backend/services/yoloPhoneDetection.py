#!/usr/bin/env python3
"""
YOLO-based Phone Detection Service
Detects cell phones in video frames using YOLOv8
Integrates with Node.js backend for real-time proctoring
"""

import cv2
import sys
import json
import base64
import numpy as np
from io import BytesIO
from pathlib import Path
from ultralytics import YOLO

# Initialize YOLO model
try:
    model = YOLO("yolov8n.pt")  # Nano model - lightweight and fast
    print("✅ YOLO model loaded successfully", file=sys.stderr)
except Exception as e:
    print(f"❌ Failed to load YOLO model: {e}", file=sys.stderr)
    sys.exit(1)


def detect_phone_in_base64(image_base64: str) -> dict:
    """
    Detect phones in a base64-encoded image
    
    Args:
        image_base64: Base64-encoded image data
    
    Returns:
        {
            "detected": bool,
            "confidence": float (0-100),
            "count": int,
            "boxes": [{"x": int, "y": int, "width": int, "height": int, "confidence": float}]
        }
    """
    # Minimum confidence threshold to avoid false positives
    PHONE_CONFIDENCE_THRESHOLD = 75
    
    try:
        # Decode base64 image
        image_data = base64.b64decode(image_base64)
        nparr = np.frombuffer(image_data, np.uint8)
        frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if frame is None:
            return {"detected": False, "confidence": 0, "count": 0, "boxes": []}
        
        # Run YOLO detection
        results = model(frame, verbose=False)
        
        phones_detected = []
        max_confidence = 0
        
        for result in results:
            for box in result.boxes:
                cls = int(box.cls[0])
                label = model.names[cls]
                confidence = float(box.conf[0]) * 100  # Convert to 0-100
                
                # Check if detected object is a cell phone AND meets confidence threshold
                if ("cell phone" in label.lower() or "phone" in label.lower()) and confidence >= PHONE_CONFIDENCE_THRESHOLD:
                    x1, y1, x2, y2 = map(int, box.xyxy[0])
                    width = x2 - x1
                    height = y2 - y1
                    
                    phones_detected.append({
                        "x": x1,
                        "y": y1,
                        "width": width,
                        "height": height,
                        "confidence": round(confidence, 2)
                    })
                    
                    max_confidence = max(max_confidence, confidence)
        
        is_detected = len(phones_detected) > 0
        
        return {
            "detected": is_detected,
            "confidence": round(max_confidence, 2),
            "count": len(phones_detected),
            "boxes": phones_detected
        }
    
    except Exception as e:
        print(f"❌ Error in phone detection: {e}", file=sys.stderr)
        return {"detected": False, "confidence": 0, "count": 0, "boxes": [], "error": str(e)}


def process_frame_file(image_path: str) -> dict:
    """
    Detect phones in an image file
    
    Args:
        image_path: Path to image file
    
    Returns:
        Detection result dict
    """
    # Minimum confidence threshold to avoid false positives
    PHONE_CONFIDENCE_THRESHOLD = 75
    
    try:
        frame = cv2.imread(image_path)
        
        if frame is None:
            return {"detected": False, "confidence": 0, "count": 0, "boxes": []}
        
        results = model(frame, verbose=False)
        
        phones_detected = []
        max_confidence = 0
        
        for result in results:
            for box in result.boxes:
                cls = int(box.cls[0])
                label = model.names[cls]
                confidence = float(box.conf[0]) * 100
                
                if ("cell phone" in label.lower() or "phone" in label.lower()) and confidence >= PHONE_CONFIDENCE_THRESHOLD:
                    x1, y1, x2, y2 = map(int, box.xyxy[0])
                    width = x2 - x1
                    height = y2 - y1
                    
                    phones_detected.append({
                        "x": x1,
                        "y": y1,
                        "width": width,
                        "height": height,
                        "confidence": round(confidence, 2)
                    })
                    
                    max_confidence = max(max_confidence, confidence)
        
        is_detected = len(phones_detected) > 0
        
        return {
            "detected": is_detected,
            "confidence": round(max_confidence, 2),
            "count": len(phones_detected),
            "boxes": phones_detected
        }
    
    except Exception as e:
        print(f"❌ Error processing frame: {e}", file=sys.stderr)
        return {"detected": False, "confidence": 0, "count": 0, "boxes": [], "error": str(e)}


if __name__ == "__main__":
    """
    Command-line usage:
    
    # Detect from base64 image
    python yoloPhoneDetection.py --base64 <image_base64_string>
    
    # Detect from file
    python yoloPhoneDetection.py --file <image_path>
    """
    
    if len(sys.argv) < 3:
        print("Usage: python yoloPhoneDetection.py --base64 <image_b64> | --file <path>")
        sys.exit(1)
    
    mode = sys.argv[1]
    data = sys.argv[2]
    
    if mode == "--base64":
        result = detect_phone_in_base64(data)
    elif mode == "--file":
        result = process_frame_file(data)
    else:
        print(f"Unknown mode: {mode}")
        sys.exit(1)
    
    # Output as JSON
    print(json.dumps(result))
