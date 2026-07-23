# Release Checklist

## Pre-Release Phase

### Code Freeze

- [ ] Announce code freeze to the team (Slack, email).
- [ ] Merge all approved feature branches into `main`.
- [ ] Create release branch (`release/X.Y.Z`) from `main`.
- [ ] Lock the release branch: no direct commits, only cherry-picked hotfixes.
- [ ] Verify all CI/CD pipelines pass on the release branch.
- [ ] Ensure all feature flags for incomplete work are disabled or defaulted to off.
- [ ] Confirm no in-progress migrations or experimental code paths are active.

### QA Testing

- [ ] Deploy the release branch to staging environment.
- [ ] Run full regression test suite:
  - [ ] Authentication flows (login, signup, password reset, logout).
  - [ ] Core user journeys (onboarding, primary feature usage).
  - [ ] Payment and checkout flows (if applicable).
  - [ ] Push notification delivery and deep linking.
  - [ ] Offline mode and data sync.
- [ ] Test on physical devices (minimum: latest iPhone, latest Android, one older device per platform).
- [ ] Test on different OS versions (latest OS, OS-2 versions back).
- [ ] Verify all critical and high-priority bugs are fixed or have approved workarounds.
- [ ] Perform edge case testing (empty states, network errors, rapid tapping, back navigation).
- [ ] Execute accessibility audit (VoiceOver/TalkBack, Dynamic Type, color contrast).
- [ ] Performance testing:
  - [ ] App cold start time < 2 seconds.
  - [ ] Scroll performance (60 FPS on target devices).
  - [ ] Memory usage under threshold.
  - [ ] Network request latency and error handling.
- [ ] QA sign-off obtained.

### Beta Testing

- [ ] Build preview binary via EAS Build.
- [ ] Distribute to beta testers via TestFlight (iOS) and Firebase App Distribution (Android).
- [ ] Collect beta feedback for minimum 3-5 business days.
- [ ] Monitor beta crash reports (Sentry/Crashlytics).
- [ ] Address critical beta feedback or document decisions to defer.
- [ ] Beta testing sign-off obtained.

## App Store / Play Store Preparation

### Metadata and Assets

- [ ] Update app version and release notes in App Store Connect and Play Console.
- [ ] Capture screenshots for all required device sizes:
  - iOS: 6.7-inch, 6.5-inch, 5.5-inch iPhones; 12.9-inch iPad.
  - Android: Phone (various DPIs), 7-inch and 10-inch tablets.
- [ ] Create or update app preview videos (if applicable).
- [ ] Verify screenshots reflect the current UI (no outdated designs).
- [ ] Update app description, keywords, and promotional text.
- [ ] Verify support URL and marketing URL are current.
- [ ] Update category and content ratings if the release changes app functionality.

### Privacy and Compliance

- [ ] Review privacy policy for accuracy and completeness.
- [ ] Update privacy policy URL in app stores if changed.
- [ ] Verify data collection disclosure matches actual app behavior:
  - [ ] Check Expo Secure Store usage for sensitive data.
  - [ ] Confirm analytics and crash reporting disclosures.
  - [ ] Review third-party SDK data collection disclosures.
- [ ] Update App Store Privacy Nutrition Labels (if iOS).
- [ ] Complete or update Play Console Data Safety section (if Android).
- [ ] Verify compliance with:
  - [ ] GDPR (if EU users).
  - [ ] CCPA (if California users).
  - [ ] COPPA (if applicable, under 13 users).
  - [ ] HIPAA (if health-related data, applicable safeguards in place).
- [ ] Export compliance documentation prepared for App Store review (ITSAppUsesNonExemptEncryption).

### Legal and Compliance Review

- [ ] Legal team review of updated privacy policy (if applicable).
- [ ] Terms of service review for any feature changes.
- [ ] Trademark and branding compliance check.
- [ ] Accessibility compliance review (WCAG 2.1 AA standards).
- [ ] Security review for new features or data flows.

## Build and Submission

### Build Preparation

- [ ] Verify all environment variables are set correctly for production.
- [ ] Confirm Sentry/Crashlytics source maps upload is configured.
- [ ] Run final production build:
  ```bash
  eas build --platform all --profile production
  ```
- [ ] Verify build artifact is signed with the correct distribution certificates.
- [ ] Run internal smoke test on the production build artifact.
- [ ] Tag the release commit in Git:
  ```bash
  git tag vX.Y.Z
  git push origin vX.Y.Z
  ```

### App Store Submission

- [ ] Submit to App Store Connect for review:
  ```bash
  eas submit --platform ios --profile production
  ```
- [ ] Provide demo account credentials for the reviewer.
- [ ] Include any special instructions for reviewer access.
- [ ] Monitor review status (typically 1-3 business days).
- [ ] If rejected, address concerns and resubmit promptly.
- [ ] On approval, schedule release date/time or release immediately.

### Play Store Submission

- [ ] Submit to Google Play Console:
  ```bash
  eas submit --platform android --profile production
  ```
- [ ] Roll out to production track (start with staged rollout: 10% for 24 hours).
- [ ] Monitor crash-free rate and user feedback.
- [ ] Gradually increase rollout percentage (25%, 50%, 100%) if stable.
- [ ] Full release to 100% after 48 hours with no issues.

## Post-Release

### Monitoring

- [ ] Monitor crash reports for first 48 hours post-release:
  - [ ] Crash-free session rate > 99.5%.
  - [ ] No new critical or high-severity issues.
- [ ] Monitor error rates on critical API endpoints.
- [ ] Monitor app store ratings and reviews for early feedback.
- [ ] Monitor server load and response times.
- [ ] Monitor OTA update adoption rate (if applicable).

### Post-Release Tasks

- [ ] Merge release branch back into `main` (if hotfixes were applied).
- [ ] Update version number for next development cycle.
- [ ] Notify the team of successful release.
- [ ] Post-release retrospective scheduled (within 1 week).
- [ ] Update project roadmap and issue tracker.
- [ ] Archive release branch.

## Rollback Plan

### Triggers for Rollback

- Critical crash affecting > 1% of users.
- Security vulnerability discovered post-release.
- Data integrity issues (incorrect calculations, data loss, sync failures).
- App Store or Play Store policy violation discovered.
- Major feature regression blocking core user journey.

### OTA Rollback (JavaScript/CSS-only changes)

1. Identify the last known-good update group ID:
   ```bash
   eas update:list --branch production
   ```
2. Rollback via EAS:
   ```bash
   eas update --branch production --rollback --group <last-good-group-id>
   ```
3. Alternatively, republish the previous update:
   ```bash
   eas update:republish --branch production --group <last-good-group-id>
   ```
4. Monitor crash rates for 30 minutes post-rollback.
5. Communicate rollback to the team.

### Binary Rollback (native code changes)

1. Trigger full rollout reversal in Play Console (immediate 100% rollback to previous version).
2. Remove the build from TestFlight / App Store:
   - App Store: Remove build from review or pause release.
   - TestFlight: Expire the build.
3. Re-submit previous known-good binary if needed:
   ```bash
   eas build --platform all --profile production --no-auto-increment
   ```
4. Update App Store / Play Store listing to previous version metadata.
5. Communicate rollback to users via push notification / in-app banner (if appropriate).
6. Post-mortem within 24 hours of rollback.

### Communication Plan

| Stakeholder | Channel | Timing |
|-------------|---------|--------|
| Internal team | Slack #engineering, #product | Immediately |
| Beta testers | TestFlight / Firebase + email | Within 1 hour |
| External users (if critical) | In-app banner, push notification, blog | Within 4 hours |
| App Store / Play Store | Update listing notes | Within 24 hours |
