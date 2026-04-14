#!/usr/bin/env python
"""
Automated training completion handler
Monitors training progress and triggers deployment when complete
Run this in a separate terminal to watch training and auto-deploy
"""

import os
import sys
import time
import subprocess
from pathlib import Path
from datetime import datetime

def get_training_status():
    """Check if training has completed"""
    model_path = Path(__file__).parent / "trained_models" / "phone_detector" / "weights" / "best.pt"
    
    # Check if model file exists and is recent (within last 5 minutes)
    if model_path.exists():
        mtime = path.stat().st_mtime
        age_seconds = time.time() - mtime
        
        # If file was modified recently, training likely just finished
        if age_seconds < 300:  # 5 minutes
            return "COMPLETED_RECENTLY"
        
        # If file has been there for a while, might be from previous run
        return "EXISTS"
    
    return "NOT_FOUND"

def check_training_subprocess(proc):
    """Check if training subprocess is still running"""
    if proc is None:
        return False
    return proc.poll() is None  # None means process still running

def run_deployment():
    """Execute deployment pipeline"""
    print("\n" + "=" * 80)
    print("🚀 STARTING AUTOMATED DEPLOYMENT")
    print("=" * 80)
    
    model_dir = Path(__file__).parent
    
    try:
        # Step 1: Deploy model
        print("\n📦 Step 1: Deploying trained model...")
        deploy_script = model_dir / "deploy_trained_model.py"
        result = subprocess.run(
            [sys.executable, str(deploy_script)],
            cwd=str(model_dir),
            capture_output=True,
            text=True,
            timeout=300  # 5 minute timeout
        )
        
        if result.returncode != 0:
            print(f"❌ Deployment failed!\n{result.stderr}")
            return False
        
        print(result.stdout)
        
        # Step 2: Test deployment
        print("\n🧪 Step 2: Testing deployed model...")
        test_script = model_dir / "test_deployed_model.py"
        result = subprocess.run(
            [sys.executable, str(test_script)],
            cwd=str(model_dir),
            capture_output=True,
            text=True,
            timeout=300  # 5 minute timeout
        )
        
        if result.returncode != 0:
            print(f"⚠️  Tests encountered issues:\n{result.stderr}")
        
        print(result.stdout)
        
        # Step 3: Update status
        print("\n✅ DEPLOYMENT COMPLETE!")
        print("\n📝 Next Steps:")
        print("   1. Start backend: npm run dev")
        print("   2. Start frontend")
        print("   3. Run exam with phone detection enabled")
        print("   4. Test detection accuracy")
        
        return True
        
    except subprocess.TimeoutExpired:
        print("❌ Deployment timed out!")
        return False
    except Exception as e:
        print(f"❌ Deployment error: {e}")
        return False

def main():
    print("=" * 80)
    print("📊 TRAINING MONITOR & AUTO-DEPLOYER")
    print("=" * 80)
    print("\nThis script monitors training progress and auto-deploys when complete.")
    print("Started:", datetime.now().strftime("%Y-%m-%d %H:%M:%S"))
    
    model_dir = Path(__file__).parent
    model_path = model_dir / "trained_models" / "phone_detector" / "weights" / "best.pt"
    
    check_interval = 30  # Check every 30 seconds
    max_wait_time = 6 * 3600  # Wait up to 6 hours
    elapsed_time = 0
    last_mtime = 0
    
    while elapsed_time < max_wait_time:
        if model_path.exists():
            current_mtime = model_path.stat().st_mtime
            size_mb = model_path.stat().st_size / (1024 * 1024)
            
            # Check if file was just modified (new epoch completed)
            if current_mtime > last_mtime:
                elapsed = time.time() - last_mtime if last_mtime > 0 else 0
                print(f"\n✅ [{datetime.now().strftime('%H:%M:%S')}] Model updated!")
                print(f"   Size: {size_mb:.2f}MB | Last update: {elapsed:.0f}s ago")
                last_mtime = current_mtime
        else:
            if elapsed_time % 300 == 0:  # Log every 5 minutes
                print(f"⏳ [{datetime.now().strftime('%H:%M:%S')}] Training in progress... ({elapsed_time}s elapsed)")
        
        # Check if this looks like training completion
        # Training usually takes 60-120 minutes, with final model 6-10MB
        if model_path.exists():
            size_mb = model_path.stat().st_size / (1024 * 1024)
            time_since_update = time.time() - last_mtime
            
            # If no updates for 2+ minutes and file is right size, training likely complete
            if elapsed_time > 300 and time_since_update > 120 and 5 <= size_mb <= 50:
                print(f"\n✅ Training appears to be complete!")
                print(f"   Model size: {size_mb:.2f}MB (expected 6-10MB)")
                print(f"   No updates for {time_since_update:.0f}s")
                
                # Confirm by checking for completion markers
                training_log = model_dir / "trained_models" / "phone_detector" / "results.csv"
                if training_log.exists():
                    print(f"   ✅ Training log found: {training_log}")
                    
                    # Run deployment
                    if run_deployment():
                        print("\n" + "=" * 80)
                        print("✅ ALL SYSTEMS READY - PHONE DETECTION DEPLOYED")
                        print("=" * 80)
                        sys.exit(0)
                    else:
                        print("\n❌ Deployment failed but model exists")
                        sys.exit(1)
        
        time.sleep(check_interval)
        elapsed_time += check_interval

    print(f"\n⏰ Timeout: Training not completed within {max_wait_time} seconds")
    print("\nYou can manually deploy when ready:")
    print(f"  cd {model_dir}")
    print(f"  python deploy_trained_model.py")
    sys.exit(1)

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n⏹️  Monitor stopped by user")
        print("To resume monitoring, run this script again")
        print("Or manually deploy with: python deploy_trained_model.py")
        sys.exit(0)
