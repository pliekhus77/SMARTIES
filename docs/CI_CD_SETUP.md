# CI/CD setup (SMARTIES)

## Overview

The SMARTIES client is **.NET 8 MAUI** (`SMARTIES.MAUI`). Continuous integration is **GitHub Actions** on the main solution (`SMARTIES.sln`). This document reflects the **current** workflows in `.github/workflows/`.

**Play release / signing:** See **`docs/ANDROID_PLAY_RELEASE_EXECUTION_PACK.md`** (LIE-232) for keystore secrets, signed AAB expectations, and internal testing checklist.

---

## Workflows

### 1. `SMARTIES CI/CD` — `.github/workflows/ci.yml`

**Triggers:** `push` / `pull_request` to `main` and `develop`; `push` of tags `v*` or `android/**`; `workflow_dispatch` (optional input **`sign_release`** = `true` to build a signed AAB when secrets are set).

**.NET SDK:** Repo root `global.json` pins the **8.0** feature band (`rollForward: latestFeature`) so CI and local builds resolve the same major SDK family as `actions/setup-dotnet` (`8.0.x`).

| Job | Runner | Purpose |
|-----|--------|---------|
| `test` | `ubuntu-latest` | `dotnet restore/build` on solution; `dotnet test` on `SMARTIES.MAUI.Tests` with TRX + coverage; optional Codecov upload |
| `build-android` | `ubuntu-latest` | Installs MAUI workload; `dotnet build` `SMARTIES.MAUI.csproj` for `net8.0-android` **Release**; uploads `bin/Release/net8.0-android/` |
| `sign-android-release` | `ubuntu-latest` | After **`test`** succeeds: runs only on tag `v*` / `android/**` or `workflow_dispatch` with `sign_release=true`. Decodes `ANDROID_KEYSTORE_BASE64` to a temp path, runs `dotnet publish` with `AndroidPackageFormat=aab` and signing MSBuild properties from secrets. **Forks:** skips without failing if secrets are missing. **Upstream:** fails if signing was requested but secrets are incomplete. Uploads one artifact named `smarties-android-{ApplicationDisplayVersion}-{ApplicationVersion}-{sha}.aab` (90-day retention). See **`docs/ANDROID_PLAY_RELEASE_EXECUTION_PACK.md`** §3–§4. |
| `build-ios` | `macos-latest` | Release build for `net8.0-ios` (unsigned validation) |
| `build-windows` | `windows-latest` | Release build for Windows TFM when present in csproj |
| `notify` | `ubuntu-latest` | Step summary + optional PR comment |

### 2. Build status — `.github/workflows/build-status.yml`

Runs after CI completes; surfaces status for monitoring.

### 3. Legacy: `deploy-hackathon.yml`

References **Expo** / `smarties/` paths that are **not present** in the current repository layout. **Do not use** for MAUI or Play releases until the workflow is removed or replaced. Prefer `ci.yml` + the Android Play execution pack.

---

## Quality gates

| Stage | Blocking | Notes |
|-------|----------|--------|
| Unit tests | Yes | `SMARTIES.MAUI.Tests`, Release configuration |
| Android compile (CI) | Yes | `net8.0-android` Release build |
| iOS / Windows compile | Yes | As configured in `ci.yml` |
| Codecov | No | `fail_ci_if_error: false` |

---

## Artifacts

| Name | Contents | Retention (current) |
|------|----------|---------------------|
| `test-results` | TRX + coverage XML | 7 days |
| `android-build` | Folder under `bin/Release/net8.0-android/` | 7 days |
| `ios-build` | iOS build output | 7 days |
| `windows-build` | Windows build output | 7 days |
| `smarties-android-*-{sha}.aab` | Single signed Play bundle from `sign-android-release` | 90 days |

Download from the Actions run summary → **Artifacts**.

---

## Secrets

**Public CI (forks):** No secrets required for compile/test jobs.

**Signed Android release (`sign-android-release` job):**

- `ANDROID_KEYSTORE_BASE64`, `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS`, `ANDROID_KEY_PASSWORD` (normative names in **`docs/ANDROID_PLAY_RELEASE_EXECUTION_PACK.md`** §3.1)

Never commit keystores or passwords to the repo.

---

## Local validation

```bash
dotnet restore SMARTIES.sln
dotnet build SMARTIES.sln -c Release
dotnet test SMARTIES.MAUI.Tests/SMARTIES.MAUI.Tests.csproj -c Release --no-build
```

Android workload (local): `dotnet workload install maui` then build `SMARTIES.MAUI` for `net8.0-android`.

---

## Troubleshooting

| Symptom | Check |
|---------|--------|
| MAUI workload missing in CI | `dotnet workload install maui` step present |
| Android SDK / license errors on runner | `AcceptAndroidSDKLicenses` in csproj; Ubuntu runner JDK/Android setup |
| Wrong doc (Expo / Node) | Older copies of this file; **this** revision is MAUI-only |

---

## Summary

- **Truth for builds:** `.github/workflows/ci.yml` + `SMARTIES.MAUI`.
- **Truth for Play:** `docs/ANDROID_PLAY_RELEASE_EXECUTION_PACK.md`.
- **Legacy Expo deploy workflow:** non-authoritative until reconciled.
