# Production Readiness

This checklist is the release gate for Meadow. A feature is not considered complete until its local implementation, tests, privacy review, and release configuration are complete.

## 1. Data Protection

- [x] Diary data is persisted through the secure storage data source.
- [x] Sensitive fields are excluded from logs by the logging redaction layer.
- [x] Production console logging is disabled by default.
- [ ] Verify storage behavior on physical iOS and Android release builds.
- [ ] Complete an independent privacy and threat-model review.

## 2. Backup and Recovery

- [x] Full JSON export includes entries, profile, and journal extras.
- [x] Encrypted backups use AES-256-GCM with a per-backup salt.
- [x] Encrypted backups use a user-supplied password and can be restored on another device.
- [x] Restore merges entries by ID instead of blindly duplicating them.
- [x] Backup format validates algorithm, key derivation, salt, and schema.
- [ ] Add automated round-trip tests using a mocked file picker and file system.
- [ ] Test large exports and corrupted backup files on physical devices.

## 3. Authentication and Locking

- [x] Biometric app lock is available in Security & Privacy settings.
- [x] Lockbox entry access requires authentication.
- [x] App lock re-locks when the app leaves the active state.
- [ ] Verify app-switcher snapshots do not expose diary content.
- [ ] Verify lock behavior on enrolled, unenrolled, cancelled, and failed biometric states.

## 4. Subscription Safety

- [x] Purchase and restore methods fail closed when native billing is unavailable.
- [ ] Integrate StoreKit or RevenueCat before enabling paid access.
- [ ] Validate entitlements with the store/provider, not local state.
- [ ] Test purchase, renewal, expiration, refund, restore, and offline states.
- [ ] Remove or disable paywall entry points until billing is configured.

## 5. AI Privacy

- [x] Remote AI requires explicit consent.
- [x] Remote AI requires HTTPS and ZDR configuration.
- [x] Remote AI responses are labeled as AI-generated.
- [x] Automated mood inference has been removed.
- [ ] Add a user-facing confirmation immediately before sending diary text remotely.
- [ ] Verify the production endpoint contract and retention policy.
- [ ] Test that consent removal blocks every remote AI call.

## 6. Testing

- [x] Domain, repository, migration, service, and utility tests exist.
- [ ] Add UI tests for create, edit, delete, favorite, tags, filters, calendar, and lockbox flows.
- [ ] Add backup export/import round-trip tests.
- [ ] Add data deletion integration tests.
- [ ] Add accessibility assertions for icon-only controls.
- [ ] Fix the date-sensitive streak test before release.
- [ ] Run tests in CI on every pull request.

## 7. Offline and Error Handling

- [x] Local diary access works without a network connection.
- [x] Network/offline service abstractions exist for future remote operations.
- [ ] Add visible retry states for failed loads and saves.
- [ ] Test app termination during autosave and persistence.
- [ ] Test corrupted storage, low storage, and interrupted restore operations.
- [ ] Add production crash reporting with diary content and PII excluded.

## 8. Accessibility and Device Coverage

- [x] Major icon-only actions have accessibility labels.
- [ ] Test Dynamic Type at the largest supported sizes.
- [ ] Test VoiceOver and TalkBack on primary flows.
- [ ] Test light mode, dark mode, and every accent color for contrast.
- [ ] Test small phones, large phones, tablets, and landscape behavior where supported.
- [ ] Test a development build and release build on physical iOS and Android devices.

## 9. Store and Legal Release

- [ ] Publish and configure Privacy Policy and Terms of Use URLs.
- [ ] Complete App Store privacy disclosures.
- [ ] Complete Google Play Data Safety disclosures.
- [ ] Configure production bundle identifiers, signing, icons, screenshots, and versioning.
- [ ] Configure native subscription products, if monetization is enabled.
- [ ] Complete TestFlight and Play internal testing.
- [ ] Verify account/data deletion instructions are available to users.

## Release Decision

The app should remain a local-first beta until sections 1 through 9 have no unresolved release blockers. Features such as cloud sync, widgets, voice entry, and advanced archive workflows are post-launch enhancements, not prerequisites for the first production release.
