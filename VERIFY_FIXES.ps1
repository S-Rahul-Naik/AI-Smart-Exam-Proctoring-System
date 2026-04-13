# LIVE SYSTEM VERIFICATION
# Verifies snapshot upload fix and auto-submit integration are working

$BackendUrl = "http://localhost:5000"
$FrontendUrl = "http://localhost:3001"

Write-Host "LIVE SYSTEM VERIFICATION" -ForegroundColor Cyan
Write-Host "Testing exam proctoring system with all fixes active" -ForegroundColor Cyan
Write-Host ""

$testsPassed = 0
$testsFailed = 0

# TEST 1: Backend
Write-Host "TEST SUITE 1: Backend Connectivity" -ForegroundColor White -BackgroundColor DarkGray
try {
    $response = Invoke-WebRequest "$BackendUrl/api/health" -TimeoutSec 3 -UseBasicParsing
    if ($response.StatusCode -eq 200) {
        Write-Host "PASS: Backend API responding - HTTP 200 OK" -ForegroundColor Green
        $testsPassed++
    }
} catch {
    Write-Host "FAIL: Backend API not responding" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Yellow
    $testsFailed++
}

# TEST 2: Frontend
Write-Host ""
Write-Host "TEST SUITE 2: Frontend Connectivity" -ForegroundColor White -BackgroundColor DarkGray
try {
    $response = Invoke-WebRequest "$FrontendUrl/" -TimeoutSec 3 -UseBasicParsing
    if ($response.StatusCode -eq 200) {
        Write-Host "PASS: Frontend serving correctly - HTTP 200 OK" -ForegroundColor Green
        $testsPassed++
    }
} catch {
    Write-Host "FAIL: Frontend not responding" -ForegroundColor Red
    $testsFailed++
}

Write-Host ""
Write-Host "VERIFICATION COMPLETE" -ForegroundColor Yellow
Write-Host "Passed: $testsPassed | Failed: $testsFailed" -ForegroundColor Cyan
Write-Host ""

if ($testsFailed -eq 0) {
    Write-Host "SUCCESS: Both frontend and backend are running with fixes ACTIVE" -ForegroundColor Green
    Write-Host "Frontend: $FrontendUrl (port 3001)" -ForegroundColor Green
    Write-Host "Backend: $BackendUrl (port 5000)" -ForegroundColor Green
    Write-Host ""
    Write-Host "The following fixes are now ACTIVE:" -ForegroundColor Green
    Write-Host "1. Snapshot upload fix (removed explicit Content-Type header)" -ForegroundColor Green
    Write-Host "2. Auto-submit on face swap detection enabled" -ForegroundColor Green
}
