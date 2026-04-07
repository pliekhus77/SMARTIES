## Cursor Cloud specific instructions

### Overview

SMARTIES is a .NET MAUI 8.0 mobile app (barcode-scanning dietary compliance checker). The solution (`SMARTIES.sln`) contains `SMARTIES.MAUI` (main app) and `SMARTIES.MAUI.Tests` (xUnit tests). A standalone `SMARTIES.Console` project exists outside the solution for quick service validation.

### Environment

- **.NET SDK 8.0** installed at `$HOME/.dotnet` (added to `PATH` via `~/.bashrc`).
- **MAUI Android workload** (`maui-android`) installed.
- **Android SDK** at `$HOME/android-sdk` with platform 34 and build-tools 34.0.0.
- **JDK 17** at `/usr/lib/jvm/java-17-openjdk-amd64`.
- Environment variables `DOTNET_ROOT`, `ANDROID_HOME`, `JAVA_HOME` are persisted in `~/.bashrc`.

### Build

```bash
# Build full solution (net8.0 + net8.0-android):
dotnet build SMARTIES.sln --configuration Release \
  /p:AndroidSdkDirectory=$HOME/android-sdk \
  /p:JavaSdkDirectory=/usr/lib/jvm/java-17-openjdk-amd64

# Build net8.0 target only (faster, no Android SDK needed — sufficient for tests):
dotnet build SMARTIES.MAUI/SMARTIES.MAUI.csproj -f net8.0 --configuration Release
```

### Gotcha: Android SDK path

The Android SDK is **not** auto-detected. When building the `net8.0-android` target, you must pass `/p:AndroidSdkDirectory=$HOME/android-sdk /p:JavaSdkDirectory=/usr/lib/jvm/java-17-openjdk-amd64`. The `net8.0` target (used by tests) does not need Android SDK.

### Gotcha: `platform-tools` required

The Android build's `ResolveSdks` task fails if `platform-tools` is missing from the Android SDK, even though `platforms;android-34` and `build-tools;34.0.0` are installed. Ensure `platform-tools` is installed: `$HOME/android-sdk/cmdline-tools/latest/bin/sdkmanager "platform-tools"`.

### Tests

```bash
dotnet test SMARTIES.MAUI.Tests/SMARTIES.MAUI.Tests.csproj --configuration Release
```

All 94 tests run against the `net8.0` TFM (no emulator needed). Security tests (`Security/SecurityTests.cs`) are excluded because `SecureStorage` is unavailable on Linux.

### Console demo

```bash
dotnet run --project SMARTIES.Console/SMARTIES.Console.csproj
```

Exercises Open Food Facts API, user profiles, dietary analysis, and product caching. On first run the SQLite DB is created; the profile table may not exist until the second invocation.

### Notes

- This is a client-side mobile app with no backend services, Docker, or databases to run.
- The MAUI app cannot launch on Linux (no emulator/device); development validation is done via tests and the Console project.
- CI (`.github/workflows/ci.yml`) mirrors local steps: restore, build, test, then Android artifact build.
