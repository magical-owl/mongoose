# Mongoose

Mongoose is the current app codename for an offline-first private diary app for writing, reflecting, and reviewing personal memories on-device. It focuses on core journaling workflows: diary entries, moods, stickers, reflections, calendar review, and personal insights.

The app is built with Expo, React Native, and TypeScript. It is designed for private local use first, with biometric protection, encrypted backups, and no account requirement for the main diary experience.

## Features

- Create and edit diary entries with rich text.
- Track mood and day-feeling context for each entry.
- Add free and premium sticker packs to entries.
- Add reflections after writing.
- Browse entries through timeline, card, feed, and calendar views.
- Review insights for entries, words, stickers, writing rhythm, moods, and most-used stickers.
- Protect the app with device biometrics.
- Export data as JSON or encrypted backup files.
- Use the diary offline-first.

## Product Status

Mongoose is in active pre-release development.

The app name is centralized in [`src/config/appIdentity.ts`](src/config/appIdentity.ts) so the codename can be changed later for TestFlight or release without searching through screens and services.

Core offline diary features are implemented. Release work still includes production in-app purchase integration, final App Store / Google Play metadata, privacy-policy hosting, and final policy review.

Premium infrastructure is present behind a payment gateway abstraction. Development builds can exercise local Premium behavior, while production builds fail closed until native App Store and Google Play billing is wired.

## Tech Stack

| Area | Technology |
|---|---|
| Framework | Expo SDK 57 |
| Navigation | Expo Router |
| UI | React 19, React Native 0.86 |
| Language | TypeScript 6 |
| State | Zustand |
| Validation | Zod |
| Secure storage | Expo Secure Store |
| Local storage | MMKV |
| Biometrics | Expo Local Authentication |
| Backups | Expo File System, Sharing, Document Picker, Crypto |
| Testing | Jest |

## Project Structure

```text
app/                      Expo Router screens
src/features/diary/       Diary domain, services, repositories, and UI
src/features/subscription Free/Premium plan infrastructure
src/features/profile/     Local profile data
src/features/journal/     Journal extras and archive data
src/shared/               Reusable components and utilities
src/services/             Backup, app lock, deletion, logging, and other services
src/stores/               Zustand stores
src/theme/                Theme tokens and color themes
COMPLIANCE/               Privacy, app store, and data protection documents
docs/                     Architecture and release documentation
```

## Development

Install dependencies:

```bash
npm install
```

Start the app:

```bash
npm start
```

Run checks:

```bash
npm run lint
npm run typecheck
npm test -- --runInBand
npm run doctor
```

Build with EAS:

```bash
npm run eas:build
```

## Release Checklist

Before App Store / Google Play submission:

- Integrate real native in-app purchases for Mongoose Premium.
- Confirm final product IDs in App Store Connect and Google Play Console.
- Remove or justify unused native permission strings.
- Finalize public Privacy Policy and Support URLs.
- Verify privacy manifest and data safety disclosures.
- Run `npm run lint`, `npm run typecheck`, `npm test -- --runInBand`, and `npm run doctor`.

## Privacy Notes

Mongoose is designed around local-first diary storage. Diary entries, profile data, backup metadata, and plan state are stored on-device. Remote AI functionality is disabled unless explicitly configured and consented to.

## License

See [LICENSE](LICENSE).
