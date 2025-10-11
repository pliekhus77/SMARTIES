# Android Development Environment Setup Script
# Run this script after installing Android Studio and setting up the SDK

Write-Host "Setting up Android development environment..." -ForegroundColor Green

# Common Android SDK locations
$possibleSdkPaths = @(
    "$env:USERPROFILE\AppData\Local\Android\Sdk",
    "$env:LOCALAPPDATA\Android\Sdk",
    "C:\Android\Sdk"
)

$androidHome = $null
foreach ($path in $possibleSdkPaths) {
    if (Test-Path $path) {
        $androidHome = $path
        break
    }
}

if ($androidHome) {
    Write-Host "Found Android SDK at: $androidHome" -ForegroundColor Green
    
    # Set environment variables for current session
    $env:ANDROID_HOME = $androidHome
    $env:ANDROID_SDK_ROOT = $androidHome
    
    # Add Android tools to PATH
    $androidTools = @(
        "$androidHome\platform-tools",
        "$androidHome\tools",
        "$androidHome\tools\bin"
    )
    
    foreach ($tool in $androidTools) {
        if (Test-Path $tool) {
            $env:PATH = "$tool;$env:PATH"
        }
    }
    
    # Set permanent environment variables (requires admin)
    try {
        [Environment]::SetEnvironmentVariable("ANDROID_HOME", $androidHome, "User")
        [Environment]::SetEnvironmentVariable("ANDROID_SDK_ROOT", $androidHome, "User")
        
        $currentPath = [Environment]::GetEnvironmentVariable("PATH", "User")
        $newPath = $currentPath
        
        foreach ($tool in $androidTools) {
            if ((Test-Path $tool) -and ($currentPath -notlike "*$tool*")) {
                $newPath = "$tool;$newPath"
            }
        }
        
        [Environment]::SetEnvironmentVariable("PATH", $newPath, "User")
        Write-Host "Environment variables set permanently!" -ForegroundColor Green
    }
    catch {
        Write-Host "Could not set permanent environment variables. You may need to run as administrator." -ForegroundColor Yellow
    }
    
    # Verify installation
    Write-Host "`nVerifying Android tools..." -ForegroundColor Cyan
    
    if (Get-Command "adb" -ErrorAction SilentlyContinue) {
        Write-Host "✓ ADB is available" -ForegroundColor Green
        & adb version
    } else {
        Write-Host "✗ ADB not found in PATH" -ForegroundColor Red
    }
    
    if (Test-Path "$androidHome\platform-tools\adb.exe") {
        Write-Host "✓ ADB executable found" -ForegroundColor Green
    }
    
} else {
    Write-Host "Android SDK not found. Please:" -ForegroundColor Red
    Write-Host "1. Open Android Studio" -ForegroundColor Yellow
    Write-Host "2. Go through the setup wizard" -ForegroundColor Yellow
    Write-Host "3. Install the Android SDK" -ForegroundColor Yellow
    Write-Host "4. Run this script again" -ForegroundColor Yellow
}

Write-Host "`nNext steps:" -ForegroundColor Cyan
Write-Host "1. Open Android Studio and complete the setup wizard" -ForegroundColor White
Write-Host "2. Install Android SDK (API level 33 or higher recommended)" -ForegroundColor White
Write-Host "3. Create an Android Virtual Device (AVD)" -ForegroundColor White
Write-Host "4. Test the emulator" -ForegroundColor White