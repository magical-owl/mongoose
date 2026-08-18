# Apple App Store Compliance Guide

## Overview

This document outlines the requirements, guidelines, and processes for submitting the app currently codenamed Mongoose to the Apple App Store. The final public app name, support URL, marketing URL, privacy URL, screenshots, and metadata must be finalized before submission.

---

## 1. App Store Review Guidelines

Apple enforces a strict set of guidelines. Key areas relevant to this offline diary app:

### 1.1 Safety

- **Objectionable Content** (Guideline 1.1): Ensure no hate speech, harassment, violence, or sexually explicit content is generated or displayed by the app.
- **User-Generated Content** (Guideline 1.2): If the app allows users to post content, include content filtering, reporting mechanisms, and a method to block offensive users.
- **Privacy** (Guideline 5.1): Clearly disclose data collection and obtain user consent. See Section 3 below for Privacy Manifest requirements.
- **Data Security** (Guideline 5.1): Encrypt user data in transit (TLS 1.2+) and at rest.

### 1.2 Performance

- **App Completeness** (Guideline 2.1): Remove all placeholder content, debug logs, and test endpoints before submission.
- **Beta Testing** (Guideline 2.1): Ensure no demo, beta, or trial labels appear in the production build.
- **Hardware Compatibility** (Guideline 2.5): Test on physical devices (not just simulators) to verify all features work correctly.

### 1.3 Business

- **Subscriptions** (Guideline 3.1.1): If using in-app purchases, ensure they go through Apple's IAP system. No external purchase links.
- **Free Apps** (Guideline 3.2.1): Do not charge for features that are inherently free (e.g., accessing the camera).

### 1.4 Design

- **Minimal UI** (Guideline 4.1): The app should not be just a web view or a wrapper around a website.
- **Apple Pay** (Guideline 4.8): If using Apple Pay, follow the Human Interface Guidelines for payment sheets.

---

## 2. Required Capabilities & Entitlements

Ensure the following are configured in `app.json` / `eas.json` and the native Xcode project:

| Capability                | Entitlement                    | Purpose                          |
|---------------------------|--------------------------------|----------------------------------|
| In-App Purchase           | com.apple.developer.inapppay   | Required before enabling production premium purchase |
| Push Notifications        | com.apple.developer.push       | Only if reminders/alerts are shipped |
| Sign in with Apple        | com.apple.developer.applesignin| Only if social login is added |
| iCloud                    | com.apple.developer.icloud     | Only if cloud sync is added |
| Associated Domains        | applinks:yourdomain.com        | Only if universal links are added |

---

## 3. Privacy Manifest (PrivacyInfo.xcprivacy)

As of iOS 17.5, Apple **requires** a privacy manifest for any app that uses certain APIs. Create a `PrivacyInfo.xcprivacy` file in the `ios/` directory.

### API Categories to Declare

| API Category                                           | Reason Code         | Description                              |
|--------------------------------------------------------|---------------------|------------------------------------------|
| File timestamp APIs                                    | C617.1              | Access to file creation/modification date|
| System boot time APIs                                  | 35F9.1              | Calculate uptime / performance metrics   |
| Disk space APIs                                        | 85F4.1              | Check available storage                  |
| Active keyboard APIs                                   | 54BD.1              | Custom keyboard input handling           |
| User defaults (NSUserDefaults)                         | CA92.1              | Persist user preferences                 |

### Sample PrivacyInfo.xcprivacy Structure

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN"
  "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>NSPrivacyTracking</key>
  <false/>
  <key>NSPrivacyTrackingDomains</key>
  <array/>
  <key>NSPrivacyCollectedDataTypes</key>
  <array>
    <dict>
      <key>NSPrivacyCollectedDataType</key>
      <string>NSPrivacyCollectedDataTypeProductInteraction</string>
      <key>NSPrivacyCollectedDataTypeLinked</key>
      <false/>
      <key>NSPrivacyCollectedDataTypePurpose</key>
      <string>AppFunctionality</string>
    </dict>
  </array>
  <key>NSPrivacyAccessedAPITypes</key>
  <array>
    <dict>
      <key>NSPrivacyAccessedAPIType</key>
      <string>NSPrivacyAccessedAPICategoryFileTimestamp</string>
      <key>NSPrivacyAccessedAPITypeReasons</key>
      <array>
        <string>C617.1</string>
      </array>
    </dict>
  </array>
</dict>
</plist>
```

### Steps to Add the Privacy Manifest

1. In Xcode, select your target and go to **File → New → File**.
2. Select **Property List** and name it `PrivacyInfo`.
3. Add the keys listed above with appropriate reason codes.
4. For Expo managed workflows, configure via `expo-build-properties` plugin in `app.json`:

```json
{
  "expo": {
    "plugins": [
      [
        "expo-build-properties",
        {
          "ios": {
            "privacyManifests": {
              "NSPrivacyCollectedDataTypes": [
                {
                  "NSPrivacyCollectedDataType": "NSPrivacyCollectedDataTypeProductInteraction",
                  "NSPrivacyCollectedDataTypeLinked": false,
                  "NSPrivacyCollectedDataTypePurpose": "AppFunctionality"
                }
              ],
              "NSPrivacyAccessedAPITypes": [
                {
                  "NSPrivacyAccessedAPIType": "NSPrivacyAccessedAPICategoryFileTimestamp",
                  "NSPrivacyAccessedAPITypeReasons": ["C617.1"]
                }
              ]
            }
          }
        }
      ]
    ]
  }
}
```

---

## 4. App Tracking Transparency (ATT)

If the app tracks user activity across third-party apps or websites, you **must** request tracking permission.

### When ATT is Required

- Showing personalized ads.
- Sharing user data with data brokers.
- Using third-party analytics that track users across apps (e.g., Facebook SDK, certain Firebase features).

### Implementation

Add `NSUserTrackingUsageDescription` to `Info.plist`:

```xml
<key>NSUserTrackingUsageDescription</key>
<string>We use tracking to personalize your experience and improve our services.</string>
```

For Expo, configure in `app.json`:

```json
{
  "expo": {
    "ios": {
      "infoPlist": {
        "NSUserTrackingUsageDescription": "We use tracking to personalize your experience and improve our services."
      }
    }
  }
}
```

### Request Permission Programmatically

```typescript
import { requestTrackingPermissionsAsync } from 'expo-tracking-transparency';

const { status } = await requestTrackingPermissionsAsync();
if (status === 'granted') {
  // Tracking allowed
}
```

### Timing

- Call `requestTrackingPermissionsAsync()` **after** the splash screen and **before** any analytics SDKs initialize.
- On iOS 14.5+, the ATT prompt must appear before IDFA access.

---

## 5. TestFlight Process

### 5.1 Internal Testing

- Up to 100 internal testers (Apple ID email addresses).
- No Beta App Review required.
- Available immediately after build processing completes.

### 5.2 External Testing

- Up to 10,000 external testers.
- Requires **Beta App Review** (same guidelines as production review).
- Each build must pass review before external testers can install.

### 5.3 Submission Flow

1. Archive build via EAS (`eas build --platform ios --profile production`).
2. Submit to App Store Connect via EAS (`eas submit --platform ios`).
3. In App Store Connect, go to **TestFlight → iOS → Select Build**.
4. Add tester groups and submit for Beta Review (if external).
5. Once approved, testers receive an invitation email.

### 5.4 Testing Checklist

- [ ] Crash reporting (Sentry / Crashlytics) is enabled for debug builds.
- [ ] TestFlight feedback is collected in App Store Connect.
- [ ] Internal testers have been added before build upload.
- [ ] External testers are in groups with clear naming (e.g., "Beta v2.1.0").
- [ ] Expired builds are removed from active groups.

---

## 6. Common Rejection Reasons

| Rejection Reason                                     | Solution                                                                 |
|------------------------------------------------------|--------------------------------------------------------------------------|
| **Crash on launch**                                  | Test on physical devices; review crash logs in App Store Connect.        |
| **Incomplete information**                           | Fill out all metadata fields (description, keywords, support URL, etc.). |
| **Placeholder content**                              | Remove all lorem ipsum, "Coming Soon" text, and dummy data.              |
| **Misleading metadata**                              | Ensure screenshots match actual app UI; keywords are relevant.           |
| **Non-functional features**                          | Disable or hide features not yet implemented.                            |
| **Login required without demo**                      | Provide a demo account or a video preview of the app.                    |
| **Paywall for core functionality**                   | Core features must be free; only additional features can be locked.      |
| **Unclear privacy policy URL**                       | Provide a valid, public privacy policy URL in App Store Connect.         |
| **Missing App Tracking Transparency prompt**         | Add ATT dialog if app uses IDFA or cross-app tracking.                   |
| **Using private APIs**                               | Remove any usage of non-public Apple frameworks.                         |
| **Insufficient age rating**                          | Set the correct age rating in App Store Connect.                         |
| **Broken deep links**                                | Test all universal links and URL schemes before submission.              |

---

## 7. Metadata Requirements

Complete the following fields in App Store Connect before submission:

| Field                      | Requirement                                                | Example                                      |
|----------------------------|------------------------------------------------------------|----------------------------------------------|
| App Name                   | Max 30 characters                                          | Final release name required; Mongoose is codename |
| Subtitle                   | Max 30 characters                                          | Private offline diary                        |
| Privacy Policy URL         | Required, valid HTTPS URL                                  | Public release URL required                  |
| Support URL                | Required, valid HTTPS URL                                  | Public release URL required                  |
| Marketing URL              | Optional                                                   | Public release URL required if used          |
| Description                | Max 4,000 characters; first 3 lines most visible           | "A private offline diary for..."             |
| Keywords                   | Max 100 characters, comma-separated                        | journal, diary, notes, mood, reflection      |
| Apple Advertising          | Optional — opt in or out on App Store Connect              | Opt in (default)                             |
| App Category               | Select primary and secondary categories                    | Lifestyle, Productivity                      |
| Age Rating                 | Select appropriate content descriptors                     | 4+ (if no mature content)                    |
| Content Rights             | Confirm you own all content rights                         | Yes                                          |
| License Agreement          | Accept latest Apple Developer Program License Agreement    | Accepted                                     |

### Rating Descriptors (Age Rating)

| Descriptor                | 4+ | 9+ | 12+ | 17+ |
|---------------------------|----|----|-----|-----|
| Cartoon/Fantasy Violence  | ❌ | ✓  | ✓   | ✓   |
| Realistic Violence        | ❌ | ❌ | ❌  | ✓   |
| Mature/Suggestive Themes  | ❌ | ❌ | ✓  | ✓   |
| Profanity or Crude Humor  | ❌ | ❌ | ✓  | ✓   |
| Alcohol/Tobacco/Drugs     | ❌ | ❌ | ❌ | ✓   |
| Gambling/Simulated        | ❌ | ❌ | ✓  | ✓   |
| Unrestricted Web Access   | ❌ | ❌ | ❌ | ✓   |

---

## 8. Screenshot Specifications

### Required Devices & Sizes

| Device          | Screen Size   | Upload Size (pixels)  | Orientation    | Quantity Required |
|-----------------|---------------|-----------------------|----------------|-------------------|
| iPhone 6.7"     | 1290 × 2796   | 1242 × 2688 (scaled)  | Portrait       | 6.7", 6.5", 5.5" |
| iPhone 6.5"     | 1242 × 2688   | 1242 × 2688           | Portrait       | Up to 10 each     |
| iPhone 5.5"     | 1242 × 2208   | 1242 × 2208           | Portrait       | Up to 10 each     |
| iPad Pro 12.9"  | 2048 × 2732   | 2048 × 2732           | Portrait/Landscape | Up to 10 each  |
| iPad Pro 11"    | 1668 × 2388   | 1668 × 2388           | Portrait       | Up to 10 each     |

### Screenshot Rules

- **Format:** PNG or JPEG (PNG preferred for quality).
- **No transparency:** Images must have an opaque background.
- **No device frames:** Do not include bezels, phone outlines, or chrome.
- **Status bar:** Must be the standard iOS status bar (time, signal, battery).
- **Content:** Screenshots must reflect the current version of the app.
- **Text:** All text must be legible at the displayed size.
- **Watermarks:** No watermarks, logos, or promotional text on screenshots.

### Screenshot Best Practices

1. **Show the main value proposition** in the first 2 screenshots.
2. **Use captions** (App Store Connect allows optional text overlays).
3. **Show real data** — avoid empty states.
4. **Localize screenshots** for each language the app supports.
5. **Include 4–6 screenshots** per device; more is better up to 10.

---

## 9. Submission Checklist

- [ ] App passes `npx expo-doctor` without errors.
- [ ] All `console.log` / `console.warn` calls removed from production code.
- [ ] Privacy manifest (`PrivacyInfo.xcprivacy`) is included and correct.
- [ ] ATT prompt is implemented (if applicable).
- [ ] Age rating set correctly in App Store Connect.
- [ ] Privacy policy URL is valid and live.
- [ ] All metadata fields are filled in App Store Connect.
- [ ] Screenshots uploaded for all required device sizes.
- [ ] Build tested on physical iOS device (iPhone and iPad).
- [ ] Internal TestFlight build installed and tested.
- [ ] App icon uploaded (1024×1024, no transparency).
- [ ] Version number and build number bumped.
- [ ] EAS build profile is set to `production`.
- [ ] Submission uses `--auto-submit` for TestFlight; manual for production.

---

## 10. Post-Submission

- **Review time:** Typically 24–48 hours.
- **Status updates:** Monitor via App Store Connect or email.
- **Rejection:** Address the issue in the Resolution Center, resubmit.
- **Approval:** Schedule release for the desired date.
- **Expedited review:** Request once per year for critical bug fixes.

---

*Last updated: 2025-01-27*
