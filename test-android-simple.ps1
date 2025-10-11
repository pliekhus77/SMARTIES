# Simple Android Development Environment Test

Write-Host "Testing Android development environment..." -ForegroundColor Green

# Check Android Studio installation
Write-Host "`n=== Android Studio ===" -ForegroundColor Cyan
$androidStudioPath = "C:\Program Files\Android\Android Studio\bin\studio64.exe"
if (Test-Path $androidStudioPath) {
    Write-Host "✓ Android Studio is installed" -ForegroundColor Green
} else {
    Write-Host "✗ Android Studio not found" -ForegroundColor Red
}

# Check environment variables
Write-Host "`n=== Environment Variables ===" -ForegroundColor Cyan
if ($env:ANDROID_HOME) {
    Write-Host "✓ ANDROID_HOME: $env:ANDROID_HOME" -ForegroundColor Green
} else {
    Write-Host "✗ ANDROID_HOME not set" -ForegroundColor Red
}

# Check common SDK locations
Write-Host "`n=== Android SDK ===" -ForegroundColor Cyan
$sdkPaths = @(
    "$env:USERPROFILE\AppData\Local\Android\Sdk",
    "$env:LOCALAPPDATA\Android\Sdk",
    "C:\Android\Sdk"
)

$sdkFound = $false
foreach ($path in $sdkPaths) {
    if (Test-Path $path) {
        Write-Host "✓ Android SDK found at: $path" -ForegroundColor Green
        $sdkFound = $true
        break
    }
}

if (-not $sdkFound) {
    Write-Host "✗ Android SDK not found in common locations" -ForegroundColor Red
}

# Check Java
Write-Host "`n=== Java ===" -ForegroundColor Cyan
$javaCmd = Get-Command java -ErrorAction SilentlyContinue
if ($javaCmd) {
    Write-Host "✓ Java is available" -ForegroundColor Green
    try {
        $javaVersion = java -version 2>&1 | Select-Object -First 1
        Write-Host "  Version: $javaVersion" -ForegroundColor White
    } catch {
        Write-Host "  Could not get version" -ForegroundColor Yellow
    }
} else {
    Write-Host "✗ Java not found in PATH" -ForegroundColor Red
}

Write-Host "`n=== Next Steps ===" -ForegroundColor Cyan
Write-Host "1. Open Android Studio to complete setup" -ForegroundColor White
Write-Host "2. Install Android SDK through Android Studio" -ForegroundColor White
Write-Host "3. Create an Android Virtual Device (AVD)" -ForegroundColor White
Write-Host "4. Run setup-android-env.ps1 to configure environment" -ForegroundColor White