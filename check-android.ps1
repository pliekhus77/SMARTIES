Write-Host "Checking Android development setup..." -ForegroundColor Green

# Check Android Studio
$studioPath = "C:\Program Files\Android\Android Studio\bin\studio64.exe"
if (Test-Path $studioPath) {
    Write-Host "✓ Android Studio installed" -ForegroundColor Green
} else {
    Write-Host "✗ Android Studio not found" -ForegroundColor Red
}

# Check ANDROID_HOME
if ($env:ANDROID_HOME) {
    Write-Host "✓ ANDROID_HOME set to: $env:ANDROID_HOME" -ForegroundColor Green
} else {
    Write-Host "✗ ANDROID_HOME not set" -ForegroundColor Red
}

# Check SDK locations
$sdk1 = "$env:USERPROFILE\AppData\Local\Android\Sdk"
$sdk2 = "$env:LOCALAPPDATA\Android\Sdk"

if (Test-Path $sdk1) {
    Write-Host "✓ Android SDK found at: $sdk1" -ForegroundColor Green
} elseif (Test-Path $sdk2) {
    Write-Host "✓ Android SDK found at: $sdk2" -ForegroundColor Green
} else {
    Write-Host "✗ Android SDK not found" -ForegroundColor Red
}

# Check Java
if (Get-Command java -ErrorAction SilentlyContinue) {
    Write-Host "✓ Java available" -ForegroundColor Green
} else {
    Write-Host "✗ Java not found" -ForegroundColor Red
}

Write-Host "Next: Open Android Studio to complete setup" -ForegroundColor Cyan