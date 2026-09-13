# Privacy and Critical Flow Readiness

This is the focused readiness audit for the current app while the final app name is still undecided. It covers only:

- Privacy and data-safety readiness.
- Critical feature sanity before TestFlight, Play internal testing, or production release.

It does not replace legal review. Treat unresolved high-risk items as release blockers until they are fixed or explicitly accepted by the app owner.

## Current Decision

**Production release: No-go.**

The app is close enough for controlled TestFlight or Play internal testing after the checklist below is exercised, but it is not ready for a public store release until privacy disclosures, data deletion behavior, media storage, permissions, and critical flows are verified on real devices.

## Privacy Inventory

| Data area | Examples | Current handling | Sharing | Release risk |
| --- | --- | --- | --- | --- |
| Diary text | Titles, body HTML, templates, prompts, moods, tags, reactions, reflections, view history | Stored through the diary repository and secure storage path. Export and encrypted backup flows exist. | Local-only by default. Export is user-initiated. | Medium: verify encrypted storage and restore/delete behavior on physical iOS and Android release builds. |
| Diary media | Entry cover photos, inline photos, photo stickers, reflection images | Imported media is written as encrypted app-owned files with a transient render cache for display. Cleanup service exists. | Local-only by default. Export/share is user-initiated. | Medium: verify encrypted media display and deletion behavior on physical iOS and Android release builds. |
| Profile media | Profile photo | Imported media is written as encrypted app-owned files with a transient render cache for display. Cleanup service exists. | Local-only by default. | Medium: verify deletion and backup behavior on device. |
| Journals | Journal names, descriptions, cover images, archived state, system journals | Stored locally through journal repositories and caches. | Local-only by default. | Medium: verify system journal defaults, deletion, and export consistency. |
| App preferences | Theme, background theme, diary paper, display options, settings | Stored locally as app preferences. | Not shared. | Low: still include in export/reset checks. |
| App lock | Biometric lock setting, passcode lock state, lockbox access state | Uses local authentication and secure storage services. | Not shared. | High: verify passcode, biometric unavailable, cancelled auth, failed auth, app background relock, and app switcher privacy. |
| Backup/export | JSON export, encrypted backup, restore file | User-created files may leave app storage. Encrypted backup uses password-based encryption. | User controls destination. | High: plain JSON export is intentionally portable but not private once shared; user warning and documentation must be clear. |
| Remote processing | Diary text or media if future network features are enabled | Disabled for the current release candidate. | None for this release path. | Low while disabled; reassess before adding network processing. |
| Monetization | Future paid access state | Native payment infrastructure exists behind a disabled release flag. | None while disabled. | Low while disabled; reassess before enabling paid access. |
| Logs/telemetry | Errors, diagnostics, analytics | No third-party crash/analytics pipeline is release-ready. Sensitive logging is prohibited. | None expected. | Medium: if crash reporting is added, prove diary content, photos, identifiers, and tokens are redacted. |

## Privacy Blockers

- [x] Encrypt imported diary/profile/reflection images at rest before public release.
- [ ] Verify `DataDeletionService.deleteAll()` removes diary data, journal data, imported diary photos, reflection photos, profile photos, managed secure-storage keys, and in-memory caches on physical iOS and Android release builds.
- [ ] Verify user-created export and backup files are clearly outside app-controlled deletion after the user saves/shares them.
- [ ] Verify app switcher snapshots do not expose diary content while app lock is enabled.
- [ ] Verify camera and photo-library denied, limited, cancelled, and success states on iOS and Android.
- [ ] Verify App Store privacy manifest and Google Play Data Safety answers match actual behavior.
- [x] Keep remote processing disabled for this release candidate.
- [x] Keep paid access disabled for this release candidate.
- [ ] Replace placeholder privacy/support contact details in `compliance/PRIVACY.md` before public release.

## Critical Feature Sanity

Run these manually on at least one iOS device/simulator and one Android device/emulator before external testing. Repeat the high-risk rows on physical devices before production.

| Flow | Must verify | Status |
| --- | --- | --- |
| Fresh install | Onboarding completes, first journal flow works, first diary entry redirects correctly, background/theme defaults are sane. | Not run |
| Journal management | Create journal, edit title/description/cover, switch layout, open system journals, delete/archive behavior, journal suggestions footer. | Not run |
| Entry creation | Create title/body, select journal, moods, tags, date, paper background, cover photo, stickers, album photo stickers, save. | Not run |
| Entry editing | Edit all creation fields, remove cover photo, change paper background, move/resize/stack stickers, save and immediately see updated previews. | Not run |
| Entry viewing | Cover image loads without flicker, body formatting renders, next/previous circular scroll works, reactions, comments, view count, delete/edit buttons work. | Not run |
| Entry list modes | Timeline, card, feed render only active mode, paginate cleanly, show loader once, switch modes while loader is visible without runaway loading. | Not run |
| Filters/search | Search, year, month, date, tag, mood, favorites-only, clear filters, empty states. | Not run |
| Reflections | Add reflection, attach one image, preview attached image, delete/close flows, react to reflection, inline reflection expansion animation. | Not run |
| Calendar | Open entries for a date, empty state, reactions and view counters display correctly. | Not run |
| Rediscover | Sparse-data state hides empty categories, most viewed section, read-only reactions, view counters, open entry. | Not run |
| Insights | Month numbers, pluralization, reaction stats, empty-data states, large-data rendering. | Not run |
| App lock | Enable/disable passcode and biometric lock, failed/cancelled auth, app background relock, lockbox access, app switcher privacy. | Not run |
| Export/backup/restore | Plain JSON warning, encrypted backup creation, wrong password, corrupted file, large backup, restore merge behavior. | Not run |
| Reset/delete | Reset app deletes local entries, journals, imported photos, profile photo, secure keys, and caches without leaving stale UI. | Not run |
| Permissions/offline | Camera denied, photo library denied/limited, no network, low storage, interrupted save/restore. | Not run |
| Devices/accessibility | Small phone, large phone, tablet, landscape where supported, Dynamic Type, VoiceOver/TalkBack, light/dark contrast. | Not run |

## Automated Gates

Run these before every external test build:

```bash
npm run typecheck
npm run lint
npm test
npm run validate:production-config
npm run doctor
```

The automated gates do not replace the critical flow sanity pass above. They catch code regressions; they do not prove camera permissions, app-switcher privacy, physical device storage behavior, or store disclosure correctness.

## Store Review Notes

- Apple expects apps to be complete, stable, and accurately described before submission, including working backend/configuration and complete review information.
- Apple and Google both require accurate privacy disclosures for data collection, sharing, permissions, and user control.
- Google Play technical quality review includes stability, performance, compatibility, and user experience expectations.

Reference sources:

- Apple App Review Guidelines: https://developer.apple.com/app-store/review/guidelines/
- Apple User Privacy and Data Use: https://developer.apple.com/app-store/user-privacy-and-data-use/
- Google Play app quality guidance: https://support.google.com/googleplay/android-developer/answer/17492799
