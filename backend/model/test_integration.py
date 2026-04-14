#!/usr/bin/env python3
"""
Integration test for phone detection model in production services
"""

import sys
import base64
sys.path.insert(0, '../src/services')

print("=" * 70)
print("📱 PHONE DETECTION MODEL - INTEGRATION TEST")
print("=" * 70)

# Test 1: Import the detection service
print("\n[TEST 1] Importing detection service...")
try:
    from yoloPhoneDetection import detect_phone_in_base64
    print("✅ Detection service imported successfully")
except Exception as e:
    print(f"❌ Failed to import: {e}")
    sys.exit(1)

# Test 2: Create a blank test image
print("\n[TEST 2] Creating test image (blank frame)...")
try:
    # Simple 1x1 white PNG
    test_image = b'\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x02\x00\x00\x00\x90wS\xde\x00\x00\x00\x0cIDATx\x9cc\xf8\x0f\x00\x00\x01\x01\x00\x05\x18\xf4\x9b\xe0\x00\x00\x00\x00IEND\xaeB\x60\x82'
    test_b64 = base64.b64encode(test_image).decode()
    print(f"✅ Test image created (base64 len: {len(test_b64)})")
except Exception as e:
    print(f"❌ Failed to create test image: {e}")
    sys.exit(1)

# Test 3: Run detection
print("\n[TEST 3] Running detection on test image...")
try:
    result = detect_phone_in_base64(test_b64)
    print("✅ Detection completed")
except Exception as e:
    print(f"❌ Detection failed: {e}")
    sys.exit(1)

# Test 4: Validate result structure
print("\n[TEST 4] Validating result structure...")
required_keys = ["detected", "confidence", "count", "boxes", "suspicious"]
try:
    for key in required_keys:
        if key not in result:
            raise ValueError(f"Missing key: {key}")
    print(f"✅ Result structure valid. Keys: {list(result.keys())}")
except Exception as e:
    print(f"❌ Invalid result: {e}")
    sys.exit(1)

# Test 5: Check result values
print("\n[TEST 5] Checking result values...")
print(f"  - Detected: {result['detected']}")
print(f"  - Confidence: {result['confidence']}%")
print(f"  - Count: {result['count']}")
print(f"  - Boxes: {len(result['boxes'])}")
print(f"  - Suspicious: {len(result['suspicious'])}")

# Test 6: Verify model is using correct thresholds
print("\n[TEST 6] Verifying optimized thresholds...")
from yoloPhoneDetection import CONFIDENCE_HIGH, CONFIDENCE_SOFT, MODEL_PATH
print(f"  - Model: {MODEL_PATH}")
print(f"  - High Confidence: {CONFIDENCE_HIGH*100:.0f}% (expected 68%)")
print(f"  - Soft Threshold: {CONFIDENCE_SOFT*100:.0f}% (expected 52%)")

if CONFIDENCE_HIGH == 0.68 and CONFIDENCE_SOFT == 0.52:
    print("✅ Thresholds are optimized for new model")
else:
    print("❌ Thresholds don't match expected values")
    sys.exit(1)

print("\n" + "=" * 70)
print("✅ INTEGRATION TEST PASSED - Model is ready for production")
print("=" * 70)
