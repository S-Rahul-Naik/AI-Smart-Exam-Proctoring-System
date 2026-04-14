# PowerShell script to monitor and deploy trained model
# Run this in a separate terminal to watch for training completion

$modelDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$trainedModelPath = "$modelDir\trained_models\phone_detector\weights\best.pt"
$checkDelay = 10  # Check every 10 seconds

Write-Host "=" * 80
Write-Host "PHONE DETECTOR MODEL - AUTO-DEPLOY MONITOR"
Write-Host "=" * 80
Write-Host "Watching for training completion at: $trainedModelPath"
Write-Host "Check interval: $checkDelay seconds"
Write-Host ""

$lastSize = 0
$checkCount = 0

while ($true) {
    $checkCount++
    
    if (Test-Path $trainedModelPath) {
        $file = Get-Item $trainedModelPath
        $currentSize = $file.Length / (1024 * 1024)  # Convert to MB
        $lastModified = $file.LastWriteTime
        $timeSinceUpdate = (Get-Date) - $lastModified
        
        if ($currentSize -ne $lastSize) {
            Write-Host "[$(Get-Date -Format 'HH:mm:ss')] Model updated: $($currentSize.ToString('F2'))MB | Last update: $($timeSinceUpdate.TotalSeconds.ToString('F0'))s ago"
            $lastSize = $currentSize
        }
        
        # Check if training is complete (file hasn't changed for 2 minutes and size looks right)
        if ($lastSize -gt 5 -and $timeSinceUpdate.TotalSeconds -gt 120 -and $checkCount -gt 20) {
            Write-Host ""
            Write-Host "✅ TRAINING COMPLETE DETECTED!"
            Write-Host "   Model size: $($currentSize.ToString('F2'))MB"
            Write-Host "   No updates for $($timeSinceUpdate.TotalSeconds.ToString('F0'))s"
            Write-Host ""
            Write-Host "Starting deployment..."
            Write-Host ""
            
            # Run deployment
            Set-Location $modelDir
            python deploy_trained_model.py
            
            if ($LASTEXITCODE -eq 0) {
                Write-Host ""
                Write-Host "=" * 80
                Write-Host "✅ DEPLOYMENT SUCCESSFUL!"
                Write-Host "=" * 80
                Write-Host ""
                Write-Host "Running tests..."
                python test_deployed_model.py
                
                if ($LASTEXITCODE -eq 0) {
                    Write-Host ""
                    Write-Host "=" * 80
                    Write-Host "✅ ALL SYSTEMS READY - PHONE DETECTION DEPLOYED"
                    Write-Host "=" * 80
                    exit 0
                }
            }
        }
    } else {
        if ($checkCount % 6 -eq 0) {
            Write-Host "[$(Get-Date -Format 'HH:mm:ss')] Waiting for model file to be created..."
        }
    }
    
    Start-Sleep -Seconds $checkDelay
}
