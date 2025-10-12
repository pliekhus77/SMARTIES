# Start SMARTIES Development Server
Write-Host "Starting SMARTIES Development Server..." -ForegroundColor Green

# Set Android environment
$env:ANDROID_HOME = "C:\Users\pliekhus\AppData\Local\Android\Sdk"
$env:PATH = "$env:ANDROID_HOME\platform-tools;$env:PATH"

# Check if emulator is running
$devices = & adb devices
if ($devices -match "emulator-\d+\s+device") {
    Write-Host "✅ Android emulator is running" -ForegroundColor Green
} else {
    Write-Host "❌ Android emulator not found. Please start the emulator first." -ForegroundColor Red
    exit 1
}

# Start Expo development server
Write-Host "Starting Expo development server..." -ForegroundColor Cyan
npx expo start --android --clear