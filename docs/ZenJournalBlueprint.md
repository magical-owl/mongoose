# ZenJournal — Technical Blueprint & Architecture Specification

This document serves as the authoritative, end-to-end technical specification for **ZenJournal** — an offline-first, AES-256 encrypted, AI-assisted private daily journaling & scrapbook application built on top of the Meadow platform.

---

## 1. System Overview & Identifiers

| Parameter | Configuration |
| :--- | :--- |
| **App Name** | ZenJournal |
| **Slug & Deep Link Scheme** | `zenjournal` |
| **iOS Bundle Identifier** | `com.meadow.zenjournal` |
| **Android Package** | `com.meadow.zenjournal` |
| **Framework Base** | Expo SDK 57 + Expo Router v4 + React 19 + React Native 0.86 |
| **Language** | TypeScript 6 (strict mode) |
| **Core Architecture** | Feature-First Clean Architecture (`Presentation ➔ Hooks ➔ Services ➔ Repositories ➔ Storage`) |

---

## 2. Domain Schemas & Contracts (`src/features/journal/domain/JournalEntry.ts`)

```ts
import { z } from 'zod';

export const MoodSchema = z.enum(['ecstatic', 'happy', 'calm', 'low', 'anxious']);
export type Mood = z.infer<typeof MoodSchema>;

export const PlacedStickerSchema = z.object({
  id: z.string().uuid(),
  stickerId: z.string(),       // Asset identifier (e.g. "birthday-cake", "halloween-pumpkin")
  category: z.string(),        // Pack category (e.g. "birthday", "halloween", "summer")
  x: z.number(),               // Canvas X coordinate
  y: z.number(),               // Canvas Y coordinate
  scale: z.number().default(1),// Pinch scale multiplier
  rotation: z.number().default(0), // Rotation in degrees (-180 to 180)
  zIndex: z.number().default(1),  // Stacking layer index
});

export type PlacedSticker = z.infer<typeof PlacedStickerSchema>;

### 2.1 Canvas State Persistence & Restoration Protocol
- **Save Flow (`JournalRepository.save()`)**:
  - `paperBackgroundId` (e.g. `"halloween-midnight"`, `"christmas-festive"`) and every `PlacedSticker` in the `stickers` array (storing exact `x`, `y`, `scale`, `rotation`, and `zIndex` transform values) are serialized and encrypted with AES-256 before disk persistence.
- **Restoration Flow (`app/entry/[id].tsx`)**:
  - When opening or editing an entry, the payload is decrypted.
  - The canvas applies `PAPER_TEXTURES[paperBackgroundId]` as the paper background.
  - Each sticker is reconstructed on top of the paper with its exact saved position, scale, rotation, and layer order (`transform: [{ translateX: x }, { translateY: y }, { scale }, { rotate: '${rotation}deg' }]`, `zIndex`).


export const JournalEntrySchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1, 'Title is required').max(100),
  content: z.string().min(1, 'Content cannot be empty'),
  templateId: z.string().optional(),
  paperBackgroundId: z.string().default('vintage-parchment'),
  stickers: z.array(PlacedStickerSchema).default([]),
  mood: MoodSchema,
  tags: z.array(z.string()).default([]),
  isFavorite: z.boolean().default(false),
  aiSummary: z.string().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type JournalEntry = z.infer<typeof JournalEntrySchema>;
```

---

## 3. Storage Encryption & Security Architecture

### 3.1 AES-256 Storage Implementation (`src/features/journal/repositories/JournalRepository.ts`)
- **Key Generation & Persistence**: On initial app launch, `JournalRepository` checks `expo-secure-store` for an existing 256-bit encryption key (`ZENJOURNAL_MASTER_KEY`). If absent, it generates a cryptographically secure random key and stores it in iOS Keychain / Android Keystore.
- **MMKV Instance**: Initializes an encrypted `MMKV` instance using the master key.
- **Data Serialization**:
  ```ts
  // Serializing & Encrypting
  const encryptedPayload = AES256.encrypt(JSON.stringify(journalEntry), masterKey);
  mmkvStorage.set(entry.id, encryptedPayload);

  // Decrypting
  const rawPayload = mmkvStorage.getString(entry.id);
  const journalEntry = JournalEntrySchema.parse(JSON.parse(AES256.decrypt(rawPayload, masterKey)));
  ```

### 3.2 Biometric Lock Protocol (`src/providers/BiometricGuardProvider.tsx`)
- Enforces local biometric authentication (`expo-local-authentication`) on app launch and when returning from background after 30 seconds of inactivity.
- Provides fallback to 4-digit PIN stored in `Expo SecureStore`.

---

## 4. Theme System & Paper Background Textures

### 4.1 Base Palette (`src/theme/colors.ts`)
```ts
export const colors = {
  background: '#0F172A',         // Deep Slate
  surface: 'rgba(30, 41, 59, 0.8)',// Indigo Glass
  primary: '#10B981',            // Emerald Green
  secondary: '#8B5CF6',          // Violet Glow
  textPrimary: '#F8FAFC',        // Crisp White
  textSecondary: '#94A3B8',      // Muted Slate
  border: 'rgba(255, 255, 255, 0.08)',
};
```

### 4.2 Paper Background Catalog
```ts
export interface PaperTexture {
  id: string;
  name: string;
  backgroundColor: string;
  linePattern?: 'ruled' | 'grid' | 'parchment' | 'festive';
  borderColor?: string;
  accentIcon?: string;
}

export const PAPER_TEXTURES: Record<string, PaperTexture> = {
  'vintage-parchment': { id: 'vintage-parchment', name: '📜 Classic Vintage Scroll', backgroundColor: '#FDF6E3', linePattern: 'parchment' },
  'ruled-notebook': { id: 'ruled-notebook', name: '📝 Ruled Line Notebook', backgroundColor: '#F8FAF9', linePattern: 'ruled', borderColor: '#EF4444' },
  'minimal-grid': { id: 'minimal-grid', name: '📐 Dot Grid Journal', backgroundColor: '#F1F5F9', linePattern: 'grid' },
  'halloween-midnight': { id: 'halloween-midnight', name: '🎃 Halloween Midnight', backgroundColor: '#1E1B4B', linePattern: 'festive', borderColor: '#8B5CF6' },
  'christmas-festive': { id: 'christmas-festive', name: '🎄 Festive Christmas', backgroundColor: '#7F1D1D', linePattern: 'festive', borderColor: '#F59E0B' },
  'summer-golden': { id: 'summer-golden', name: '☀️ Golden Summer Beach', backgroundColor: '#FEF3C7', linePattern: 'parchment', borderColor: '#0284C7' },
  'birthday-party': { id: 'birthday-party', name: '🎉 Birthday Confetti', backgroundColor: '#FDF2F8', linePattern: 'festive', borderColor: '#EC4899' },
  'spring-blossom': { id: 'spring-blossom', name: '🌸 Cherry Blossom', backgroundColor: '#FCE7F3', linePattern: 'parchment', borderColor: '#F472B6' },
  'autumn-harvest': { id: 'autumn-harvest', name: '🍂 Autumn Kraft', backgroundColor: '#78350F', linePattern: 'parchment', borderColor: '#D97706' },
};
```

---

## 5. Sticker Canvas & Gesture Specifications

### 5.1 Sticker Catalog Packs (`src/constants/stickers.ts`)
Packs include:
- `birthday`: `['cake', 'party-hat', 'balloon', 'confetti', 'gift']`
- `summer`: `['sun', 'sunglasses', 'palm-tree', 'ice-cream', 'waves']`
- `halloween`: `['pumpkin', 'ghost', 'bat', 'leaves', 'witch-hat', 'candy']`
- `christmas`: `['christmas-tree', 'santa-hat', 'snowman', 'snowflake', 'gingerbread']`
- `spring`: `['cherry-blossom', 'tulip', 'butterfly', 'rainbow']`
- `romance`: `['heart', 'love-letter', 'rose', 'chocolate']`
- `travel`: `['airplane', 'suitcase', 'passport-stamp', 'compass', 'camera']`
- `everyday`: `['happy-face', 'coffee-cup', 'headphones', 'star', 'tape-strip']`

### 5.2 Gesture Handler Component (`src/features/journal/components/StickerCanvasItem.tsx`)
Uses `react-native-gesture-handler` + `react-native-reanimated`:
- `PanGestureHandler`: Updates `(x, y)` position relative to paper container bounds.
- `PinchGestureHandler`: Modifies `scale` clamp value between `0.5` and `3.0`.
- `RotationGestureHandler`: Updates `rotation` angle in degrees.
- `TapGestureHandler`: Taps selected sticker to reveal delete icon (`🗑️`) or bring to front (reorder array index).

---

## 6. Guided Q&A Template Catalog (`src/constants/templates.ts`)

```ts
export interface JournalTemplate {
  id: string;
  name: string;
  icon: string;
  description: string;
  questions: string[];
}

export const JOURNAL_TEMPLATES: JournalTemplate[] = [
  {
    id: 'gratitude',
    name: 'Daily Gratitude',
    icon: '🙏',
    description: 'Focus on 3 positive moments from today.',
    questions: [
      '1. What are 3 things you are grateful for today?',
      '2. Who made a positive impact on your day?',
      '3. What is a small win you experienced?'
    ]
  },
  {
    id: 'evening-reflection',
    name: 'Evening Reflection',
    icon: '🌙',
    description: 'Unwind and process your day before sleep.',
    questions: [
      '1. What was the best part of your day?',
      '2. What was challenging, and how did you handle it?',
      '3. What can you let go of before sleeping tonight?'
    ]
  },
  {
    id: 'morning-intention',
    name: 'Morning Intention',
    icon: '☀️',
    description: 'Set your focus and mindset for the day ahead.',
    questions: [
      '1. What is your #1 priority for today?',
      '2. How do you want to feel today?',
      '3. What is one kind thing you will do for yourself?'
    ]
  },
  {
    id: 'anxiety-reset',
    name: 'Anxiety & Reset',
    icon: '🧘',
    description: 'Calm racing thoughts and regain grounding.',
    questions: [
      '1. What is currently causing you stress?',
      '2. What is within your control right now?',
      '3. Take 3 deep breaths — what does your body feel like?'
    ]
  },
  {
    id: 'dream-log',
    name: 'Dream Journal',
    icon: '💭',
    description: 'Record your dreams right after waking up.',
    questions: [
      '1. What happened in your dream?',
      '2. How did the dream make you feel?',
      '3. What symbols or emotions stood out?'
    ]
  },
  {
    id: 'weekly-review',
    name: 'Weekly Review',
    icon: '🎯',
    description: 'Review achievements and lessons from the week.',
    questions: [
      '1. What was your biggest achievement this week?',
      '2. What lesson did you learn?',
      '3. What is your focus for next week?'
    ]
  }
];
```

---

## 7. Timeline View Modes (Feed vs. Calendar)

### 7.1 View Mode State (`app/(tabs)/index.tsx`)
- State variable: `const [viewMode, setViewMode] = useState<'feed' | 'calendar'>('feed');`

### 7.2 Calendar View Matrix Generation
- Computes monthly grid array for current year/month.
- Maps entries by `createdAt` ISO string date (`YYYY-MM-DD`).
- Renders colored mood dots on dates with entries (Ecstatic = 🌟, Happy = 😄, Calm = 🌿, Low = 🌧️, Anxious = ⚡).
- Tapping a date opens a bottom sheet showing entries created on that day or a `+ Add Entry for [Date]` button.

---

## 8. AI Service Architecture & Zero Data Retention

### 8.1 API Client (`src/features/journal/services/JournalAIService.ts`)
- Configured with `X-Zero-Data-Retention: true` headers.
- **PII Sanitizer**: Strips emails, phone numbers, and addresses via regex before transmission.

### 8.2 AI Service Functions
1. **`generateEntrySummary(content: string)`**: Returns a 2-sentence key takeaway and sentiment insight.
2. **`generateWeeklyReflection(entries: JournalEntry[])`**: Returns 3 structured bullet points (Key Themes, Emotional Trend, Mindful Encouragement).
3. **`generateSparkPrompt(timeOfDay: 'morning' | 'evening')`**: Returns an inspiring journaling prompt string.

---

## 9. Screen Specs & Navigation Rules (`app/`)

```
app/
├── _layout.tsx                     # Root Layout: Theme + Biometric Guard
├── (tabs)/
│   ├── _layout.tsx                 # Bottom Tabs: Timeline, Insights, Settings + FAB
│   ├── index.tsx                   # Screen 1: Timeline (Feed / Calendar Toggle)
│   ├── insights.tsx                # Screen 2: Mood & Sticker Analytics + AI Summary
│   └── settings.tsx                # Screen 3: Biometrics, AI Opt-In, GDPR Export & Purge
├── entry/
│   ├── new.tsx                     # Modal: Paper Canvas Editor + Template Picker + Sticker Drawer
│   └── [id].tsx                    # Screen: View / Edit Entry & AI Summary Card
```

---

## 10. Automated Quality & Verification Pipeline

```bash
# 1. Typecheck strict mode
npm run typecheck

# 2. Linting audit
npm run lint

# 3. Jest Test Suite
npm test

# 4. Expo SDK Compatibility Check
npm run doctor
```
