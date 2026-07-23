# Creating an App from Meadow

This document describes the step-by-step process for building a new application (e.g., Diary, Journal, Finance, Habit Tracker, AI Companion, Notes) on top of the Meadow platform.

> **For AI agents:** See `/agents/feature-development.md` for the AI-specific version of this process.

---

## Overview

Building an app on Meadow follows a strict layer-by-layer approach:

```
1. Fork & Configure
2. Define the Feature (types, constants, schemas)
3. Build the Data Layer (storage → API → repository)
4. Build the Service Layer (business rules)
5. Build the UI Layer (hooks → screens → navigation)
6. Polish & Test
```

**Rules:**
- Never skip layers
- Never bypass the service layer from UI
- Never access storage directly from components
- Never hardcode colors, spacing, or prompts
- Always write tests for business logic
- Always update documentation

---

## Phase 1: Fork & Configure

```bash
# Clone for a new app
git clone https://github.com/magical-owl/meadow.git my-new-app
cd my-new-app

# Install dependencies
npm install

# Configure for your app
# Edit app.json: name, slug, scheme, bundleIdentifier, package
# Edit eas.json: point to your EAS project
# Copy .env.example to .env.local and configure

# Verify it runs
npx expo start
```

### Files to modify:
| File | What to change |
|---|---|
| `app.json` | `name`, `slug`, `scheme`, `bundleIdentifier`, `package` |
| `eas.json` | EAS project configuration |
| `.env.local` | API endpoints, feature flags |
| `assets/` | App icon, splash screen, favicon |

### Files to keep (do not modify):
All shared components, services, theme, providers, hooks, documentation, CI/CD, compliance — these are the platform foundation.

---

## Phase 2: Define the Feature

Create a new feature directory under `src/features/`:

```
src/features/yourappname/
├── types.ts              ← Data models extending BaseEntity
├── constants.ts          ← Feature-specific constants
├── yourappname.storage.ts ← Local persistence (MMKV)
├── yourappname.api.ts    ← API endpoints with Zod schemas
├── yourappname.repository.ts ← Repository (implements IRepository)
├── yourappname.service.ts ← Business rules
├── hooks/
│   ├── useFeatureData.ts
│   └── useCreateFeature.ts
├── components/
│   └── ...feature-specific components
├── __tests__/
│   └── ...tests for each layer
└── README.md
```

### Types Example (Diary app)

```typescript
// src/features/diary/types.ts
import type { BaseEntity } from '@/shared/types/architecture';

export type Mood = 'happy' | 'neutral' | 'sad' | 'angry' | 'grateful';

export interface DiaryEntry extends BaseEntity {
  title: string;
  content: string;
  mood: Mood;
  tags: string[];
  isFavorite: boolean;
}

export type CreateDiaryEntry = Omit<DiaryEntry, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateDiaryEntry = Partial<CreateDiaryEntry>;
```

### Zod Schema Example

```typescript
// src/features/diary/schemas.ts
import { z } from 'zod';

export const diaryEntrySchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  content: z.string().min(1, 'Content is required').max(10000),
  mood: z.enum(['happy', 'neutral', 'sad', 'angry', 'grateful']),
  tags: z.array(z.string()).max(10),
  isFavorite: z.boolean().default(false),
});
```

---

## Phase 3: Build the Data Layer

### 3a. Storage Data Source

Uses the existing MMKV `database` singleton for local persistence.

```typescript
// src/features/diary/diary.storage.ts
import { database } from '@/database/DatabaseService';
import type { DiaryEntry } from './types';

const COLLECTION = 'diary_entries';

export const DiaryStorage = {
  getAll: (): DiaryEntry[] => database.getAll<DiaryEntry>(COLLECTION, { sort: { createdAt: 'desc' } }),
  getById: (id: string): DiaryEntry | null => database.get<DiaryEntry>(COLLECTION, id),
  create: (data: Omit<DiaryEntry, 'id' | 'createdAt' | 'updatedAt'>): DiaryEntry =>
    database.create<DiaryEntry>(COLLECTION, data),
  update: (id: string, data: Partial<Omit<DiaryEntry, 'id' | 'createdAt' | 'updatedAt'>>): DiaryEntry | null =>
    database.update<DiaryEntry>(COLLECTION, id, data),
  delete: (id: string): boolean => database.delete(COLLECTION, id),
};
```

### 3b. API Data Source

Uses `ApiClient` with typed endpoints and Zod validation.

```typescript
// src/features/diary/diary.api.ts
import { apiClient, ApiClient } from '@/api/ApiClient';
import { diaryEntrySchema } from './schemas';
import type { DiaryEntry, CreateDiaryEntry } from './types';

const BASE_PATH = '/diary';

export const DiaryApi = {
  getAll: () => apiClient.request(ApiClient.get(`${BASE_PATH}`, z.array(diaryEntrySchema))),
  create: (data: CreateDiaryEntry) =>
    apiClient.request(ApiClient.post(`${BASE_PATH}`, diaryEntrySchema, diaryEntrySchema), { data }),
  update: (id: string, data: Partial<CreateDiaryEntry>) =>
    apiClient.request(ApiClient.patch(`${BASE_PATH}/${id}`, diaryEntrySchema, diaryEntrySchema.partial()), { data }),
  delete: (id: string) =>
    apiClient.request(ApiClient.delete(`${BASE_PATH}/${id}`, z.object({ success: z.boolean() }))),
};
```

### 3c. Repository

Implements `IRepository<DiaryEntry>` composing storage + API + offline support.

```typescript
// src/features/diary/diary.repository.ts
import type { IRepository } from '@/repositories/interfaces/IRepository';
import type { DiaryEntry, CreateDiaryEntry, UpdateDiaryEntry } from './types';
import type { Result, ArchitectureError } from '@/shared/types/architecture';
import { DiaryStorage } from './diary.storage';
import { DiaryApi } from './diary.api';
import { offlineService } from '@/services/OfflineService';
import { success, failure } from '@/shared/utils/result';
import { NotFoundError } from '@/shared/errors/AppError';

export class DiaryRepository implements IRepository<DiaryEntry> {
  async findById(id: string): Promise<Result<DiaryEntry, ArchitectureError>> {
    const entry = DiaryStorage.getById(id);
    if (!entry) return failure(new NotFoundError('DiaryEntry', id).toArchitectureError());
    return success(entry);
  }

  async findAll(): Promise<Result<DiaryEntry[], ArchitectureError>> {
    return success(DiaryStorage.getAll());
  }

  async create(data: CreateDiaryEntry): Promise<Result<DiaryEntry, ArchitectureError>> {
    // Try API first, fall back to local + offline queue
    const apiResult = await DiaryApi.create(data);
    if (apiResult.success) {
      DiaryStorage.create({ ...data, ...apiResult.data });
      return apiResult;
    }
    // Offline: save locally and queue
    const local = DiaryStorage.create(data);
    await offlineService.queueOperation('create', 'diary_entries', data);
    return success(local);
  }

  async update(id: string, data: UpdateDiaryEntry): Promise<Result<DiaryEntry, ArchitectureError>> {
    const existing = DiaryStorage.getById(id);
    if (!existing) return failure(new NotFoundError('DiaryEntry', id).toArchitectureError());
    const updated = DiaryStorage.update(id, data) as DiaryEntry;
    await offlineService.queueOperation('update', 'diary_entries', { id, ...data });
    return success(updated);
  }

  async delete(id: string): Promise<Result<void, ArchitectureError>> {
    DiaryStorage.delete(id);
    await offlineService.queueOperation('delete', 'diary_entries', {}, id);
    return success(undefined);
  }

  // ... findPaginated, exists, count as needed
}
```

---

## Phase 4: Build the Service Layer

Services own business rules. They sit between hooks (UI) and repositories (data).

```typescript
// src/features/diary/diary.service.ts
import type { IService } from '@/services/interfaces/IService';
import type { DiaryEntry, CreateDiaryEntry } from './types';
import type { Result, ArchitectureError, ServiceResult } from '@/shared/types/architecture';
import { DiaryRepository } from './diary.repository';
import { success } from '@/shared/utils/result';
import { logger } from '@/services/LoggingService';

const TAG = 'DiaryService';

export class DiaryService implements IService<DiaryEntry> {
  private repository = new DiaryRepository();

  async getAll(): Promise<Result<ServiceResult<DiaryEntry[]>, ArchitectureError>> {
    const result = await this.repository.findAll();
    if (!result.success) return result;
    // Business rule: sort by createdAt desc, filter out empty entries
    const filtered = result.data.filter((e) => e.content.trim().length > 0);
    logger.debug(TAG, `Retrieved ${filtered.length} diary entries`);
    return success({ data: filtered, metadata: { total: filtered.length } });
  }

  async create(data: CreateDiaryEntry): Promise<Result<ServiceResult<DiaryEntry>, ArchitectureError>> {
    // Business rule: trim title and content
    const cleaned = { ...data, title: data.title.trim(), content: data.content.trim() };
    const result = await this.repository.create(cleaned);
    if (!result.success) return result;
    logger.info(TAG, `Created diary entry: ${result.data.id}`);
    return success({ data: result.data });
  }

  // ... getById, update, delete
}
```

---

## Phase 5: Build the UI Layer

### 5a. Hooks

Hooks consume services and expose data + loading/error states to screens.

```typescript
// src/features/diary/hooks/useDiaryEntries.ts
import { useState, useEffect } from 'react';
import { DiaryService } from '../diary.service';
import type { DiaryEntry } from '../types';

const diaryService = new DiaryService();

export function useDiaryEntries() {
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadEntries();
  }, []);

  const loadEntries = async () => {
    setLoading(true);
    const result = await diaryService.getAll();
    if (result.success) {
      setEntries(result.data.data);
      setError(null);
    } else {
      setError(result.error.message);
    }
    setLoading(false);
  };

  return { entries, loading, error, refresh: loadEntries };
}
```

### 5b. Screens

Screens use shared components + feature hooks. No direct service/repository calls.

```typescript
// app/(tabs)/index.tsx
import { useState } from 'react';
import { View } from 'react-native';
import { ScreenContainer } from '@/shared/components/ScreenContainer';
import { Card } from '@/shared/components/Card';
import { Text } from '@/shared/components/Text';
import { Button } from '@/shared/components/Button';
import { useDiaryEntries } from '@/features/diary/hooks/useDiaryEntries';
import { spacing } from '@/theme';
import { useTheme } from '@/providers/ThemeProvider';

export default function DiaryHomeScreen() {
  const { entries, loading, error, refresh } = useDiaryEntries();
  const { colors } = useTheme();

  return (
    <ScreenContainer scrollable loading={loading} error={error ? { title: 'Error', message: error, onRetry: refresh } : null}>
      {entries.map((entry) => (
        <Card key={entry.id} padding="md" style={{ marginBottom: spacing.sm }}>
          <Text preset="h3">{entry.title}</Text>
          <Text preset="body" color="textSecondary" numberOfLines={3}>{entry.content}</Text>
        </Card>
      ))}
      <Button label="New Entry" variant="primary" onPress={() => {}} />
    </ScreenContainer>
  );
}
```

---

## Phase 6: Polish & Test

### Testing by Layer

| Layer | Test Framework | What to Test |
|---|---|---|
| **Types/Schemas** | Jest | Zod schema validation, type guards |
| **Storage** | Jest + mocks | CRUD operations, edge cases |
| **Repository** | Jest + mocks | Data composition, offline queue |
| **Service** | Jest | Business rules, transformations |
| **Hooks** | Jest + RNTL | State transitions, error handling |
| **Components** | Jest + RNTL | Rendering, interactions, accessibility |

### Example Service Test

```typescript
// src/features/diary/__tests__/diary.service.test.ts
import { DiaryService } from '../diary.service';

describe('DiaryService', () => {
  const service = new DiaryService();

  it('should trim whitespace from title and content on create', async () => {
    const result = await service.create({
      title: '  My Entry  ',
      content: '  Hello World  ',
      mood: 'happy',
      tags: [],
      isFavorite: false,
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.data.title).toBe('My Entry');
      expect(result.data.data.content).toBe('Hello World');
    }
  });
});
```

---

## What You Don't Need to Touch

| Area | Status |
|---|---|
| Theme system (colors, spacing, typography) | Ready — use from `@theme` |
| Shared components (22 total) | Ready — Button, Text, Card, TextInput, Avatar, Badge, Chip, Divider, Icon, ListItem, EmptyState, Toast, LoadingOverlay, ScreenContainer, SearchBar, Switch, Checkbox, RadioButton, ProgressBar, SegmentedControl, FAB, Modal | Ready |
| Services (Logging, ErrorHandler, Network, Config, Analytics, Offline) | Ready |
| Providers (ThemeProvider, QueryProvider, AppProviders) | Ready |
| Storage (MMKV DatabaseService) | Ready |
| API client (Axios + Zod validation) | Ready |
| CI/CD (GitHub Actions) | Ready |
| Testing setup (Jest + RNTL) | Ready |
| Documentation (18 docs files) | Ready |
| Compliance (10 docs, Apple/Google/GDPR/CCPA) | Ready |

## What You Need to Build

| Area | What to create |
|---|---|
| Feature directory | `src/features/yourapp/` |
| Data models | Types extending `BaseEntity` |
| Zod schemas | Validation for your data |
| Storage + API | Data sources |
| Repository | `IRepository` implementation |
| Service | Business rules |
| Hooks | Data + state for screens |
| Screens | Your app's UI |
| Tests | For each layer |

---

## Quick Reference

```bash
# Start development
npx expo start

# Run tests
npm test

# TypeScript check
npm run typecheck

# Build for production
npx eas build --platform all --profile production

# Submit to stores
npx eas submit --platform ios
npx eas submit --platform android