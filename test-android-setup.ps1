# Android Development Environment Test Script

Write-Host "Testing Android development environment..." -ForegroundColor Green

# Check environment variables
Write-Host "`n=== Environment Variables ===" -ForegroundColor Cyan
Write-Host "ANDROID_HOME: $env:ANDROID_HOME"
Write-Host "ANDROID_SDK_ROOT: $env:ANDROID_SDK_ROOT"

# Check if Android Studio is installed
Write-Host "`n=== Android Studio ===" -ForegroundColor Cyan
$androidStudioPath = "C:\Program Files\Android\Android Studio\bin\studio64.exe"
if (Test-Path $androidStudioPath) {
    Write-Host "✓ Android Studio installed at: $androidStudioPath" -ForegroundColor Green
} else {
    Write-Host "✗ Android Studio not found" -ForegroundColor Red
}

# Check Android SDK
Write-Host "`n=== Android SDK ===" -ForegroundColor Cyan
if ($env:ANDROID_HOME -and (Test-Path $env:ANDROID_HOME)) {
    Write-Host "✓ Android SDK found at: $env:ANDROID_HOME" -ForegroundColor Green
    
    # Check for essential SDK components
    $sdkComponents = @{
        "Platform Tools" = "$env:ANDROID_HOME\platform-tools"
        "Build Tools" = "$env:ANDROID_HOME\build-tools"
        "Platforms" = "$env:ANDROID_HOME\platforms"
    }
    
    foreach ($component in $sdkComponents.GetEnumerator()) {
        if (Test-Path $component.Value) {
            Write-Host "  ✓ $($component.Key)" -ForegroundColor Green
        } else {
            Write-Host "  ✗ $($component.Key) missing" -ForegroundColor Red
        }
    }
} else {
    Write-Host "✗ Android SDK not found or ANDROID_HOME not set" -ForegroundColor Red
}

# Check Android tools
Write-Host "`n=== Android Tools ===" -ForegroundColor Cyan
$tools = @("adb", "emulator")

foreach ($tool in $tools) {
    try {
        $version = & $tool version 2>$null
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✓ $tool is working" -ForegroundColor Green
        } else {
            Write-Host "✗ $tool found but not working properly" -ForegroundColor Yellow
        }
    }
    catch {
        Write-Host "✗ $tool not found in PATH" -ForegroundColor Red
    }
}

# Check for AVDs
Write-Host "`n=== Android Virtual Devices ===" -ForegroundColor Cyan
try {
    $avds = & emulator -list-avds 2>$null
    if ($avds) {
        Write-Host "✓ Available AVDs:" -ForegroundColor Green
        $avds | ForEach-Object { Write-Host "  - $_" -ForegroundColor White }
    } else {
        Write-Host "! No AVDs found. Create one in Android Studio." -ForegroundColor Yellow
    }
}
catch {
    Write-Host "✗ Could not list AVDs" -ForegroundColor Red
}

# Check Java
Write-Host "`n=== Java Development Kit ===" -ForegroundColor Cyan
try {
    $javaVersion = & java -version 2>&1
    if ($javaVersion -match "version") {
        Write-Host "✓ Java is installed" -ForegroundColor Green
        Write-Host "  $($javaVersion[0])" -ForegroundColor White
    }
}
catch {
    Write-Host "✗ Java not found" -ForegroundColor Red
}

Write-Host "`n=== Summary ===" -ForegroundColor Cyan
Write-Host "If you see any ✗ marks above, please:" -ForegroundColor Yellow
Write-Host "1. Open Android Studio and complete the setup" -ForegroundColor White
Write-Host "2. Install missing SDK components" -ForegroundColor White
Write-Host "3. Create an Android Virtual Device (AVD)" -ForegroundColor White
Write-Host "4. Run setup-android-env.ps1 to set environment variables" -ForegroundColor White