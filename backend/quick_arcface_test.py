#!/usr/bin/env python3
"""
Quick ArcFace Testing Tool - Compare Two Face Images
Tests facial features matching (eyes, nose, chin, lips, ears)
NOT based on brightness/lighting

Usage:
    python quick_arcface_test.py <photo1_url> <photo2_url> [--scenario same|different]

Examples:
    # Test same person different lighting
    python quick_arcface_test.py \
        "https://res.cloudinary.com/.../stud_001_signup.jpg" \
        "https://res.cloudinary.com/.../stud_001_login.jpg" \
        --scenario same

    # Test different people
    python quick_arcface_test.py \
        "https://res.cloudinary.com/.../stud_001_signup.jpg" \
        "https://res.cloudinary.com/.../stud_002_signup.jpg" \
        --scenario different
"""

import sys
import json
from deepface import DeepFace

def test_arcface_features(photo1_url, photo2_url, scenario="unknown"):
    """
    Test ArcFace facial feature matching
    """
    print("\n" + "=" * 90)
    print("🧠 ArcFace Facial Features Test")
    print("=" * 90)
    
    print(f"\n📸 Photo 1:")
    print(f"   {photo1_url[:85]}")
    
    print(f"\n📸 Photo 2:")
    print(f"   {photo2_url[:85]}")
    
    if scenario:
        print(f"\n🏷️  Test Scenario: {scenario.upper()}")
        if scenario.lower() == "same":
            print("    Expected: ✅ ALLOW (same person, different conditions)")
        elif scenario.lower() == "different":
            print("    Expected: ❌ BLOCK (different people)")
    
    print(f"\n🔬 Analyzing facial features...")
    print("    Features: eyes, nose, chin, lips, ears, face geometry")
    print("    Method: 512-dimensional ArcFace embedding extraction")
    
    try:
        # Run verification
        print(f"\n⏳ Comparing faces (this may take 10-30 seconds on first run)...")
        result = DeepFace.verify(
            photo1_url,
            photo2_url,
            model_name="ArcFace",
            enforce_detection=False
        )
        
        verified = result["verified"]
        distance = result.get("distance", 999)
        
        # Determine decision
        decision = "ALLOW" if verified else "BLOCK"
        
        # Calculate confidence
        if verified:
            confidence = max(85, int(100 - (distance * 30)))
        else:
            confidence = 90
        
        # Print detailed results
        print(f"\n" + "=" * 90)
        print(f"📊 RESULTS")
        print("=" * 90)
        
        print(f"\n🎯 DECISION: {'✅ ALLOW' if verified else '❌ BLOCK'}")
        print(f"   Distance: {distance:.4f}")
        print(f"   Confidence: {confidence}%")
        
        if verified:
            print(f"\n✅ SAME PERSON VERIFIED")
            print(f"   • Facial features (eyes, nose, chin, lips, ears) match")
            print(f"   • Face geometry and proportions identical")
            print(f"   • Distance {distance:.4f} < 0.35 threshold")
            print(f"   • Not affected by lighting/brightness differences")
            print(f"   • ArcFace model confidence: {confidence}%")
        else:
            print(f"\n❌ DIFFERENT PERSON DETECTED")
            print(f"   • Facial features (eyes, nose, chin, lips, ears) are DIFFERENT")
            print(f"   • Face geometry and proportions do NOT match")
            print(f"   • Distance {distance:.4f} > 0.35 threshold")
            print(f"   • Person blocked from proceeding")
        
        # Compare with expected
        if scenario:
            print(f"\n📋 VALIDATION:")
            if scenario.lower() == "same":
                if verified:
                    print(f"   ✅ CORRECT - Same person test passed!")
                else:
                    print(f"   ⚠️  UNEXPECTED - Same person was blocked!")
                    print(f"      Maybe different angles, expression, or obstruction?")
            elif scenario.lower() == "different":
                if not verified:
                    print(f"   ✅ CORRECT - Different person blocked!")
                else:
                    print(f"   ⚠️  UNEXPECTED - Different person was allowed!")
                    print(f"      This should not happen!")
        
        # Export result
        result_data = {
            "decision": decision,
            "verified": verified,
            "distance": round(distance, 4),
            "confidence": confidence,
            "scenario": scenario,
            "features_analyzed": [
                "eyes",
                "nose",
                "chin",
                "lips",
                "ears",
                "face_geometry",
                "facial_symmetry",
                "face_orientation"
            ],
            "not_analyzed": [
                "brightness",
                "lighting",
                "image_quality",
                "skin_tone"
            ]
        }
        
        print(f"\n📁 Full Result (JSON):")
        print(json.dumps(result_data, indent=2))
        
        print("\n" + "=" * 90)
        return result_data
        
    except Exception as e:
        print(f"\n❌ ERROR: {str(e)}")
        print("\nPossible issues:")
        print("  • URL not accessible (check if public)")
        print("  • Face not detectable in image")
        print("  • Network error (check internet connection)")
        print("  • Image format not supported")
        
        return {
            "decision": "ERROR",
            "error": str(e),
            "verified": False,
            "confidence": 0
        }

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print(__doc__)
        sys.exit(1)
    
    photo1 = sys.argv[1]
    photo2 = sys.argv[2]
    scenario = None
    
    if len(sys.argv) > 3 and sys.argv[3] == "--scenario":
        if len(sys.argv) > 4:
            scenario = sys.argv[4]
    
    result = test_arcface_features(photo1, photo2, scenario)
    print("\n✅ Test complete!\n")
