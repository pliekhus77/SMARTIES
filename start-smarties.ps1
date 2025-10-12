# SMARTIES Full Stack Startup Script
Write-Host "Starting SMARTIES Full Stack Application..." -ForegroundColor Green

# Check if Node.js is installed
try {
    $nodeVersion = node --version
    Write-Host "Node.js version: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "Node.js not found. Please install Node.js first." -ForegroundColor Red
    exit 1
}

# Set up Android environment
$env:ANDROID_HOME = "C:\Users\pliekhus\AppData\Local\Android\Sdk"
$env:PATH = "$env:ANDROID_HOME\platform-tools;$env:PATH"

# Check if Android emulator is running
$devices = & adb devices 2>$null
if ($devices -match "emulator-\d+\s+device") {
    Write-Host "Android emulator is running" -ForegroundColor Green
} else {
    Write-Host "Android emulator not detected. Please start the emulator first." -ForegroundColor Yellow
}

# Install backend dependencies if needed
if (!(Test-Path "node_modules")) {
    Write-Host "Installing backend dependencies..." -ForegroundColor Cyan
    Copy-Item "backend-package.json" "package.json"
    npm install
}

# Start backend server in background
Write-Host "Starting MongoDB backend server on port 3002..." -ForegroundColor Cyan
$backendJob = Start-Job -ScriptBlock {
    Set-Location $using:PWD
    node backend-server.js
}

# Wait for backend to start
Write-Host "Waiting for backend to initialize..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# Test backend connection and show URLs
Write-Host ""
Write-Host "=== BACKEND SERVER ===" -ForegroundColor Cyan
Write-Host "Health Check URL: http://localhost:3002/api/health" -ForegroundColor White
Write-Host "API Base URL: http://localhost:3002/api" -ForegroundColor White

try {
    $response = Invoke-RestMethod -Uri "http://localhost:3002/api/health" -TimeoutSec 10
    Write-Host "✅ Backend Status: $($response.status)" -ForegroundColor Green
    Write-Host "✅ Database Status: $($response.database)" -ForegroundColor Green
    Write-Host "✅ Message: $($response.message)" -ForegroundColor Green
} catch {
    Write-Host "❌ Backend server not responding yet, continuing..." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "=== REACT NATIVE APP ===" -ForegroundColor Cyan
Write-Host "Starting Expo development server..." -ForegroundColor White
Set-Location "smarties"

try {
    Write-Host "Expo Dev Server will be available at:" -ForegroundColor White
    Write-Host "  • Metro: http://localhost:8083" -ForegroundColor White
    Write-Host "  • Expo DevTools: http://localhost:8083" -ForegroundColor White
    Write-Host ""
    Write-Host "To connect your device:" -ForegroundColor Yellow
    Write-Host "  1. Install Expo Go app on your phone" -ForegroundColor White
    Write-Host "  2. Scan the QR code that appears below" -ForegroundColor White
    Write-Host "  3. Or press 'a' to open Android emulator" -ForegroundColor White
    Write-Host ""
    
    npx expo start --clear --port 8083
} catch {
    Write-Host "❌ Failed to start React Native app" -ForegroundColor Red
} finally {
    # Clean up background job
    Write-Host "Stopping backend server..." -ForegroundColor Yellow
    Stop-Job $backendJob -ErrorAction SilentlyContinue
    Remove-Job $backendJob -ErrorAction SilentlyContinue
}

Write-Host "SMARTIES application stopped" -ForegroundColor Green