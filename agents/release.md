# AI Agent & Developer Release Instructions

## 🚀 Master Setup & App Store Release Checklist

Use this step-by-step checklist to guide your app from local development to TestFlight staging and final App Store deployment:

### Phase 1: Accounts & Developer Registrations
- [ ] **Apple Developer Program ($99/yr)**: Register at [developer.apple.com](https://developer.apple.com).
- [ ] **Google Play Console ($25 one-time)**: Register at [play.google.com/console](https://play.google.com/console).
- [ ] **Expo Account (EAS Free)**: Create free account at [expo.dev](https://expo.dev).
- [ ] **RevenueCat Account (Free tier)**: Create account at [revenuecat.com](https://www.revenuecat.com) for in-app subscriptions.
- [ ] **Apple 15% Small Business Program**: Apply at [developer.apple.com/app-store/small-business-program](https://developer.apple.com/app-store/small-business-program) to cut Apple commission from 30% to 15%.

### Phase 2: App Store Listing Assets & Legal Links
- [ ] **App Icon**: `1024 x 1024 px` PNG (Square, no transparency or rounded corners).
- [ ] **App Store Screenshots**:
  - 6.7-inch display screenshots (`1290 x 2796 px`).
  - 6.5-inch display screenshots (`1242 x 2688 px`).
- [ ] **Store Metadata**:
  - App Title (Max 30 characters).
  - Subtitle (Max 30 characters).
  - Keywords (Max 100 characters, comma-separated).
  - Marketing & Support URLs.
- [ ] **Public Legal Links**:
  - Live HTTPS Privacy Policy URL (using [`COMPLIANCE/PRIVACY.md`](../COMPLIANCE/PRIVACY.md)).
  - Live HTTPS Terms of Service (EULA) URL.

### Phase 3: Local Code Quality & Automated Checks
- [ ] `npm run typecheck` (Verify 0 TypeScript errors).
- [ ] `npm test` (Verify all unit & subscription tests pass).
- [ ] `npm run doctor` (Verify Expo SDK 57 package health).

### Phase 4: Staging Build & TestFlight Verification
- [ ] **Log into EAS CLI**: `npx eas-cli login`.
- [ ] **Build Staging Binary**: `eas build --platform ios --profile preview`.
- [ ] **TestFlight Testing**:
  - Install app via Apple TestFlight on physical iPhone.
  - Verify Face ID / Touch ID biometric lock screen.
  - Test StoreKit Sandbox In-App Purchases (Pro Monthly, Pro Yearly, Pro Lifetime).
  - Verify mandatory **"Restore Purchases"** button on paywall (Guideline 3.1.1).

### Phase 5: Production Build & Store Submission
- [ ] **Version Bump**: Update `version` and `buildNumber`/`versionCode` in `package.json` and `app.json`.
- [ ] **Submit to Apple**: `eas submit --platform ios`.
- [ ] **Submit to Google**: `eas submit --platform android`.
- [ ] **Submit for App Review**: Click "Submit for Review" in App Store Connect (approval takes 24–48h).

---

## Version Bump Instructions

- Determine the next version using semantic versioning (MAJOR.MINOR.PATCH) based on the changes in the release branch.
- Update the `version` field in `package.json` to the new version string.
- Update the `version` and `versionCode`/`versionBuildNumber` in `app.json` (e.g., `"version": "X.Y.Z"`, `"ios.buildNumber": "X.Y.Z"`, `"android.versionCode": N`).
  - For Android `versionCode`, increment by 1 for each binary release. Use the formula: `(MAJOR * 10000) + (MINOR * 100) + PATCH` or simply the previous `versionCode + 1`.
- Commit the version bump with message format: `chore(release): bump version to X.Y.Z`.
- Tag the commit: `git tag vX.Y.Z && git push origin vX.Y.Z`.
- After tagging, push changes: `git push origin main --tags`.


## App Store & Google Play Compliance Pre-Submission Checklist

Before submitting a sensitive app (Diary, Journal, Finance, Habit Tracker, AI Companion, Notes) to Apple App Store Connect or Google Play Console, perform these mandatory compliance audits:

### 1. Apple App Store Guidelines Audit
- **Guideline 5.1.1 (Data Collection & Privacy)**: Verify that account deletion ("Delete Account") is easily accessible in-app and purges all user data across local storage (MMKV, SecureStore, SQLite) and backend servers.
- **Guideline 5.1.2 (Data Use & Sharing)**: Verify App Store Privacy Nutrition Labels accurately list all data types collected. Ensure zero user content (journal text, personal notes) is shared with third parties or used for tracking.
- **Guideline 2.5.18 (AI Generated Content & Safety)**: Ensure all AI features clearly label AI outputs, include content moderation filters, and provide an in-app toggle for users to disable AI processing.
- **Export Compliance**: Correctly declare encryption usage in `app.json` (`"ios.config.usesNonExemptEncryption": false` or provide proper CCATS documentation if using custom cryptography).

### 2. Google Play Data Safety & Compliance Audit
- **Data Safety Form**: Verify every data category collected or shared is disclosed in Google Play Console. Confirm that encryption in transit (HTTPS / TLS 1.3) is enabled for all network endpoints.
- **Data Deletion Policy**: Verify that the in-app account/data deletion flow and the external web deletion URL are active and operational.
- **Prominent Disclosure & Consent**: Verify runtime permission prompts (Camera, Location, Contacts, Microphone) display explicit context before requesting OS permission.

### 3. SDK & Tracker Dependency Audit
- **Zero Ad/Tracker SDKs**: Run `npm ls` and audit production bundles to guarantee no third-party ad networks, fingerprinting SDKs, or data brokers are included.
- **DPA & Subprocessor Audit**: Ensure all external backend services (hosting, crash reporting, AI proxies) have signed Data Processing Addendums (DPAs).

### 4. Legal, IP & Terms of Service Audit
- **Trademark & Brand Check**: Confirm app title, keywords, and app icon do not infringe on registered trademarks.
- **Asset License Verification**: Ensure all fonts, icons, and media have commercial clearance (Google Fonts OFL, `@expo/vector-icons`, royalty-free graphics).
- **Public Legal Links**: Verify live, accessible URLs for Privacy Policy and Terms of Use (EULA) are pasted in App Store Connect and Google Play Console.
- **Guideline 1.2 User Moderation Audit**: If the app features user-generated content or social sharing, verify that "Block User" and "Report Content" buttons are operational.

### 5. In-App Purchase (IAP) & Monetization Audit (Guideline 3.1.1)
- **Native IAP Enforcement**: If offering digital features, AI credits, or subscriptions, use native StoreKit / IAP (e.g. RevenueCat). Direct credit card inputs (Stripe web forms) inside iOS apps are strictly prohibited.
- **Restore Purchases Button**: Any paywall or subscription UI must include a prominent, working "Restore Purchases" button.
- **Apple Small Business Program**: Apply for Apple's Small Business Program to cut store commission fees from 30% to 15%.



## Changelog Generation

- Run `git log --oneline --no-decorate v<PREVIOUS_VERSION>..HEAD` to collect commits since the last release.
- Categorize commits using conventional commit types:
  - `feat:` → "New Features" section.
  - `fix:` → "Bug Fixes" section.
  - `chore:`, `ci:`, `build:` → "Maintenance" section.
  - `docs:` → "Documentation" section.
  - `refactor:`, `perf:` → "Code Quality & Performance" section.
  - `test:` → "Testing" section.
- For each commit, derive a user-facing description:
  - Strip the commit scope and type prefix (e.g., `feat(auth): add biometric login` → "Add biometric login").
  - Capitalize the first letter. Do not end with a period.
  - If the commit message is vague, expand it with clarifying detail.
- Append the new changelog entries to `CHANGELOG.md` under a header `## [X.Y.Z] - YYYY-MM-DD`.
- Include a `### Full Changelog` link: `https://github.com/org/meadow/compare/v<PREVIOUS>...v<NEW>`.
- Commit the changelog: `git commit -m "docs(changelog): add vX.Y.Z release notes"`.

## EAS Build

- Verify that `eas.json` has a `production` profile configured with the correct environment variables and credentials.
- Run the build:
  ```bash
  eas build --platform all --profile production --non-interactive
  ```
  Or submit for each platform separately:
  ```bash
  eas build --platform ios --profile production --non-interactive
  eas build --platform android --profile production --non-interactive
  ```
- Monitor the build in the EAS dashboard: `eas build:list --status in-review --limit 5`.
- If the build fails:
  1. Examine the build logs from the EAS dashboard URL printed in the output.
  2. Fix the issue (e.g., missing env vars, bundler error, native module incompatibility).
  3. Increment the Android `versionCode` in `app.json` (required for resubmission).
  4. Re-run `eas build`.
- On success, note the build artifact URLs for submission.

## TestFlight Submission

- Submit the iOS build to TestFlight:
  ```bash
  eas submit --platform ios --profile production --non-interactive
  ```
  Or submit a specific build ID:
  ```bash
  eas submit --platform ios --profile production --build-id <EAS_BUILD_ID> --non-interactive
  ```
- After submission, verify in App Store Connect:
  1. Open App Store Connect → My Apps → Meadow → TestFlight.
  2. Confirm the build appears in the "iOS" section.
  3. Complete "Export Compliance" if prompted (answering "No" to "Does your app use encryption?" unless cryptographic features are used).
  4. Add the build to the "External Testers" group if beta testing is needed.
- Provide testers with:
  - What's new in this build (copy from changelog).
  - Any specific areas to focus testing on.
  - Known issues or workarounds.

## App Store Connect Metadata

- Open App Store Connect → My Apps → Meadow → App Store → App Information.
- Update the following fields if they changed:
  - **Version**: Match `package.json` version.
  - **Primary Language**: (keep as configured).
  - **Category**: Update if the release changes the app's primary category.
- Open App Store → Pricing and Availability (only if pricing changes).
- Open App Store → Prepare for Submission:
  - **What's New in This Version**: Write concise, user-facing release notes (see "Release Notes" section below).
  - **Promotional Text** (optional): Short text that appears above the description on the App Store.
  - **Keywords**: Review and update if relevant for ASO.
  - **Support URL**: Verify.
  - **Marketing URL**: Verify.
  - **Copyright**: Update year if needed.
- Upload screenshots (see "Screenshots" section below).
- Set **Build** to the TestFlight build that passed internal testing.
- Demo Account: Ensure a test account is provided for the reviewer if authentication is required.

## Screenshots

- Generate screenshots for the following required device sizes:
  - **iOS**:
    - 6.7-inch (iPhone 14 Pro Max / 15 Pro Max): 1290×2796 px.
    - 6.5-inch (iPhone 11 Pro Max / 12 Pro Max): 1242×2688 px.
    - 5.5-inch (iPhone 8 Plus / SE 3): 1242×2208 px.
    - 12.9-inch iPad Pro (6th gen): 2048×2732 px.
  - **Android**:
    - Phone: 1080×1920 px (mdpi), 1440×2560 px (xhdpi), 2160×3840 px (xxxhdpi).
    - 7-inch tablet: 1200×1920 px.
    - 10-inch tablet: 1600×2560 px.
  - **Note**: Use the most common resolutions. Refer to App Store Connect and Play Console for the latest requirements.
- Use a screenshot automation tool (e.g., `fastlane snapshot`, `appium`, or a dedicated screenshot-as-a-service) to capture screenshots in the correct languages and device frames.
- Alternatively, manually capture screenshots using a simulator/emulator and resize/crop to the required dimensions.
- Upload screenshots to App Store Connect for each localization.
- Ensure screenshots match the current app UI exactly (no outdated designs, no placeholder data in production-facing screenshots).
- Order screenshots strategically: first 2-3 screenshots should show the most compelling features.

## Release Notes

- **For App Store / Play Store listing (What's New)**:
  - Keep to 3-5 bullet points maximum.
  - Use the active present tense: "Add", "Improve", "Fix".
  - Example:
    ```
    - Add biometric login for faster authentication
    - Improve offline mode with smarter caching
    - Fix crash on the profile screen when editing avatar
    - Various performance improvements and bug fixes
    ```
  - Do NOT include internal details (version numbers, commit hashes, developer references).
  - If the release contains security fixes, mention it: "Includes security improvements and fixes."

- **For internal / beta testers**:
  - Provide more detail: include areas to test, known issues, migration notes.
  - Example:
    ```
    TestFlight Beta X.Y.Z (Build N)
    
    What's New:
    - Biometric login: Test with FaceID and fingerprint.
    - Improved offline caching: Verify data syncs correctly when coming back online.
    
    Known Issues:
    - On iOS 16, the camera picker may flicker on first open (rare).
    
    Focus Areas:
    - Auth flows (login, signup, password reset).
    - Offline → online transitions.
    ```

## Monitoring

- **Crash Reporting**:
  - Monitor Sentry (or Crashlytics) dashboard for the first 48 hours post-release.
  - Alert thresholds:
    - Crash-free session rate < 99.0% → immediate investigation.
    - Any new critical/blocking crash → consider hotfix or rollback.
  - Tag releases in Sentry to correlate crashes with version.
  - Verify source maps are uploaded so stack traces are readable: check `sentry.properties` or EAS config.

- **Performance Monitoring**:
  - Track cold start time, screen load times, and network request durations.
  - Compare against release thresholds:
    - Cold start < 2 seconds (p95).
    - Screen transitions < 300ms.
    - Network request timeout rate < 1%.

- **User Feedback**:
  - Monitor App Store ratings and reviews daily for the first week.
  - Respond to negative reviews with a support path (e.g., "We're sorry you're experiencing this. Please contact support@meadow.app so we can help.").
  - Track Play Store crash rate and ANR (Application Not Responding) rate.
  - Monitor in-app feedback channels (e.g., Zendesk, Intercom) for regression reports.

- **Server Monitoring**:
  - Monitor API error rates (5xx responses) and average response times.
  - Monitor for unusual traffic patterns that may indicate a bug causing retries/loops.
  - Verify CDN cache hit rates for static assets.

- **Checklist for Monitoring Dashboard**:
  - [ ] Sentry: crash-free rate, top 3 issues, regression alerts.
  - [ ] DataDog/NewRelic: API latency, error rate, throughput.
  - [ ] App Store Connect: ratings, reviews, crash data.
  - [ ] Play Console: ANR rate, crash rate, ratings.
