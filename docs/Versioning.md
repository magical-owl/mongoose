# Versioning Strategy

## Overview

Meadow follows **Semantic Versioning 2.0.0** for all releases. Version numbers are expressed as `MAJOR.MINOR.PATCH` and are managed consistently across iOS, Android, and backend services.

---

## Semantic Versioning (MAJOR.MINOR.PATCH)

```
MAJOR.MINOR.PATCH
  │     │     │
  │     │     └─── PATCH: Backward-compatible bug fixes (incremented)
  │     └───────── MINOR: Backward-compatible feature additions (incremented)
  └─────────────── MAJOR: Incompatible API/breaking changes (incremented)
```

### Rules

- **MAJOR** (1, 2, 3, ...): Increment when making incompatible API changes, removing features, or making significant UI/UX overhauls that break existing user flows.
- **MINOR** (0, 1, 2, ...): Increment when adding backward-compatible functionality, new screens, or non-breaking enhancements.
- **PATCH** (0, 1, 2, ...): Increment when making backward-compatible bug fixes, performance improvements, or minor refinements.

### Pre-release Identifiers

Pre-release versions use hyphen-prefixed labels:

- `1.0.0-alpha.1` — Internal testing
- `1.0.0-beta.1` — External testing / TestFlight
- `1.0.0-rc.1` — Release candidate

### Build Metadata

Build metadata is appended with a `+` prefix and is ignored for precedence:

- `1.0.0-alpha.1+build.100`

---

## Build Number Management

### iOS

| Property | Purpose | Format | Managed By |
|---|---|---|---|
| `CFBundleShortVersionString` | User-visible release version | MAJOR.MINOR.PATCH (`1.2.3`) | Manual (via agvtool or Xcode) |
| `CFBundleVersion` | Internal build number | Integer, monotonically increasing (`12345`) | **EAS Build auto-increment** |

### Android

| Property | Purpose | Format | Managed By |
|---|---|---|---|
| `versionName` | User-visible release version | MAJOR.MINOR.PATCH (`1.2.3`) | Manual (in `build.gradle`) |
| `versionCode` | Internal build number | Integer, monotonically increasing (`12345`) | **EAS Build auto-increment** |

### Cross-Platform Alignment

Both iOS `CFBundleVersion` and Android `versionCode` must be:

- **Monotonically increasing** — never decrease.
- **Unique per build** — no two builds share the same number.
- **Synchronized** — the same integer is used across both platforms for the same release.

---

## iOS: CFBundleVersion vs CFBundleShortVersionString

### CFBundleShortVersionString

- Represents the public-facing release version.
- Follows strict `MAJOR.MINOR.PATCH` format.
- Updated only when a new release is prepared.
- Displayed in the App Store, Settings, and SpringBoard.

```xml
<key>CFBundleShortVersionString</key>
<string>1.2.3</string>
```

### CFBundleVersion

- Represents the internal build iteration number.
- Incremented for every build, including CI/test builds.
- Not visible to end users.
- Used by crash reporting tools and device enrollment.

```xml
<key>CFBundleVersion</key>
<string>1042</string>
```

---

## Android: versionCode vs versionName

### versionName

- Represents the public-facing release version.
- Follows strict `MAJOR.MINOR.PATCH` format.
- Displayed in Google Play, Settings, and app info.

```groovy
defaultConfig {
    versionName "1.2.3"
}
```

### versionCode

- Represents the internal build iteration number as a positive integer.
- Must be strictly greater than any previous versionCode.
- Used by Google Play to determine upgrade ordering.

```groovy
defaultConfig {
    versionCode 1042
}
```

---

## EAS Build Auto-Increment

### Configuration

EAS Build can automatically increment build numbers using the `autoIncrement` option in `eas.json`:

```json
{
  "build": {
    "production": {
      "autoIncrement": true,
      "env": {
        "APP_VERSION": "1.2.3"
      }
    },
    "preview": {
      "autoIncrement": true,
      "distribution": "internal"
    }
  }
}
```

### How It Works

1. EAS reads the current `versionCode` / `CFBundleVersion` from the project.
2. On each build, it increments the value by 1.
3. The new value is written to both iOS and Android configs before compilation.
4. The increment is committed back to the repository or tracked in EAS metadata.

### Versioning Script

For projects not using EAS auto-increment, a custom script can manage the value:

```bash
#!/bin/bash
# increment_build_number.sh
CURRENT=$(agvtool what-version -terse 2>/dev/null || echo 0)
NEXT=$((CURRENT + 1))
agvtool new-version -all $NEXT
echo "Build number updated to $NEXT"
```

---

## Changelog Management

### Changelog Format

Changelogs follow the [Keep a Changelog](https://keepachangelog.com/) standard:

```markdown
# Changelog

## [1.2.0] - 2024-11-15

### Added
- New profile screen with avatar upload
- Dark mode support

### Changed
- Reduced login timeout from 60s to 30s
- Updated onboarding illustrations

### Fixed
- Crash when opening notification with no network
- Text overflow on small devices

### Removed
- Deprecated share-to-social feature

### Security
- Updated certificate pinning for API endpoints

## [1.1.0] - 2024-10-01

### Added
- Search functionality
- Push notification support
```

### Versioning and Changelog Correlation

| Changelog Entry | Release Version | Build Number |
|---|---|---|
| Feature release | 1.2.0 | 1042 |
| Bug fix release | 1.2.1 | 1050 |
| Major overhaul | 2.0.0 | 1100 |

### Automation

- Every tagged release triggers an automated changelog draft via CI.
- Release managers curate the draft into the final changelog before publishing.
- Changelog entries are written in the imperative mood.

---

## Release Process

### 1. Version Bump

```bash
# Update version across all targets
./scripts/bump_version.sh 1.2.0
```

### 2. Build

```bash
eas build --platform all --profile production --auto-increment
```

### 3. Submit

```bash
eas submit --platform all --profile production
```

### 4. Tag

```bash
git tag -a "v1.2.0" -m "Release 1.2.0"
git push --tags
```

### 5. Changelog

Update `CHANGELOG.md` with the new release notes.

---

## Best Practices

- **Never reuse a version number.** Once published, a version is immutable.
- **Always increment `versionCode`/`CFBundleVersion`** even for test builds to avoid conflicts.
- **Keep pre-release versions short-lived** — merge to main and release promptly.
- **Use the same version string** across iOS and Android for the same release.
- **Automate version bumps** via CI scripts to prevent human error.
- **Document version schema** in project README for new contributors.
