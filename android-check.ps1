Write-Host "Checking Android development setup..." -ForegroundColor Green

# Check Android Studio
$studioPath = "C:\Program Files\Android\Android Studio\bin\studio64.exe"
if (Test-Path $studioPath) {
    Write-Host "Android Studio: INSTALLED" -ForegroundColor Green
} else {
    Write-Host "Android Studio: NOT FOUND" -ForegroundColor Red
}

# Check ANDROID_HOME
if ($env:ANDROID_HOME) {
    Write-Host "ANDROID_HOME: $env:ANDROID_HOME" -ForegroundColor Green
} else {
    Write-Host "ANDROID_HOME: NOT SET" -ForegroundColor Red
}

# Check Java
if (Get-Command java -ErrorAction SilentlyContinue) {
    Write-Host "Java: AVAILABLE" -ForegroundColor Green
} else {
    Write-Host "Java: NOT FOUND" -ForegroundColor Red
}

Write-Host "Next step: Open Android Studio to complete setup" -ForegroundColor Cyan