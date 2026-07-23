# AI Agent Feature Development Instructions

> **See also:** `docs/CreatingAnApp.md` for the complete human-readable guide with code examples for every layer.

## Overview

Building a feature in Meadow follows a **9-step process** that mirrors the layered architecture. Every step produces artifacts (code, tests, documentation) that build on the previous step. Do not skip steps. Do not parallelize — each layer depends on the layer below it.

## Step 1: Define the Feature Scope

**Before writing any code, answer these questions:**

1. **What is the user goal?** (e.g., "User can log in with email and password")
2. **What are the acceptance criteria?** List 3-5 concrete, testable statements.
3. **What existing features does this depend on?** (e.g., auth, profile, notifications)
4. **What data does this feature need?** Define the domain models.
5. **What are the error states?** List every way this can fail from the user's perspective.
6. **Does this fit the existing architecture?** If not, create an ADR first.

### Deliverable

A brief scope document (either in the issue/PR description or a `docs/guides/<feature>-scope.md` file) containing:

- Feature name and description.
- Acceptance criteria checklist.
- Domain model sketch (types/interfaces).
- Dependencies on other features.
- Key user flows (happy path + error paths).

## Step 2: Define Types and Domain Models

Create `src/features/<feature>/types/index.ts`.

1. Define all domain models as TypeScript interfaces.
2. Define all input types (what the service layer accepts).
3. Define all response types (what the service layer returns).
4. Define the feature-specific error codes/extensions.
5. Export everything from a barrel index.

### Rules

- Use branded types for IDs: `type UserId = string & { __brand: 'UserId' }`.
- Use `z.infer<typeof Schema>` for input types that correspond to Zod schemas.
- Keep types pure — no React types, no UI types. UI-specific types go in the component files.
- Reuse shared types from `@shared/types/` where possible — don't redefine.

### Example

```typescript
// src/features/entries/types/index.ts

export type EntryId = string & { __brand: 'EntryId' };

export interface Entry {
  id: EntryId;
  title: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  tags: string[];
}

export interface CreateEntryInput {
  title: string;
  content: string;
  tags?: string[];
}

export interface UpdateEntryInput {
  title?: string;
  content?: string;
  tags?: string[];
}

export type EntryErrorCode =
  | 'NOT_FOUND'
  | 'VALIDATION_ERROR'
  | 'NETWORK_ERROR'
  | 'UNAUTHORIZED';

export interface EntryError {
  code: EntryErrorCode;
  message: string;
  details?: unknown;
}
```

## Step 3: Define the Repository Interface

Create `src/features/<feature>/repositories/I<Feature>Repository.ts`.

1. Define the repository interface extending `IRepository<T>` or defining feature-specific methods.
2. Method signatures use domain types from Step 2 — never raw API or DB types.
3. Methods return `Promise<T | null>` or `Promise<T[]>` for data access, not `Result<T>` — error handling is the repository's job internally.

### Example

```typescript
// src/features/entries/repositories/IEntryRepository.ts

import type { Entry, CreateEntryInput, UpdateEntryInput } from '../types';

export interface IEntryRepository {
  getById(id: string): Promise<Entry | null>;
  getAll(options?: { tags?: string[]; limit?: number; offset?: number }): Promise<Entry[]>;
  create(input: CreateEntryInput): Promise<Entry>;
  update(id: string, input: UpdateEntryInput): Promise<Entry>;
  delete(id: string): Promise<void>;
  search(query: string): Promise<Entry[]>;
}
```

## Step 4: Implement the Repository

Create `src/features/<feature>/repositories/<Feature>Repository.ts`.

1. Implement the interface from Step 3.
2. Compose data sources (API client + local cache) according to offline-first strategy.
3. Handle connectivity detection and offline queueing.
4. Map raw data source responses to domain models.
5. Handle errors internally — catch, log, and re-throw or return null.

### Example Structure

```typescript
// src/features/entries/repositories/EntryRepository.ts

import { apiClient } from '@api/client';
import { db } from '@database/client';
import { NetInfo } from '@utils/net-info';
import type { Entry, CreateEntryInput, UpdateEntryInput } from '../types';
import type { IEntryRepository } from './IEntryRepository';

export class EntryRepository implements IEntryRepository {
  async getById(id: string): Promise<Entry | null> {
    try {
      const isOnline = await NetInfo.isConnected();
      if (isOnline) {
        const response = await apiClient.get(`/entries/${id}`);
        return this.toDomain(response.data);
      }
      return await db.entries.get(id);
    } catch (error) {
      logger.error(error, { context: 'EntryRepository.getById', entryId: id });
      throw error;
    }
  }

  // ... other methods

  private toDomain(raw: Record<string, unknown>): Entry {
    // Transform raw API response to domain model
    return {
      id: raw.id as EntryId,
      title: raw.title as string,
      content: raw.content as string,
      createdAt: new Date(raw.created_at as string),
      updatedAt: new Date(raw.updated_at as string),
      tags: (raw.tags as string[]) ?? [],
    };
  }
}
```

## Step 5: Implement the Service

Create `src/features/<feature>/services/<Feature>Service.ts`.

1. Define Zod schemas for every public method's input validation.
2. Inject repository dependencies via constructor.
3. Implement business logic — every `if/else`, calculation, or rule belongs here.
4. Return typed `Result<T>` for every public method.
5. Translate repository errors to domain-meaningful service errors.
6. Write the service as pure TypeScript — no React imports.

### Example

```typescript
// src/features/entries/services/EntryService.ts

import { z } from 'zod';
import type { IEntryRepository } from '../repositories/IEntryRepository';
import type { Entry, CreateEntryInput, UpdateEntryInput, EntryError } from '../types';

const CreateEntrySchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().min(1).max(10000),
  tags: z.array(z.string().max(50)).max(10).optional(),
});

type CreateEntryInputValidated = z.infer<typeof CreateEntrySchema>;

type ServiceResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: EntryError };

export class EntryService {
  constructor(private readonly entryRepo: IEntryRepository) {}

  async create(input: unknown): Promise<ServiceResult<Entry>> {
    const parsed = CreateEntrySchema.safeParse(input);
    if (!parsed.success) {
      return {
        ok: false,
        error: { code: 'VALIDATION_ERROR', message: 'Invalid entry data', details: parsed.error },
      };
    }

    try {
      const entry = await this.entryRepo.create(parsed.data);
      return { ok: true, data: entry };
    } catch (error) {
      return {
        ok: false,
        error: { code: 'NETWORK_ERROR', message: 'Failed to create entry. Please try again.' },
      };
    }
  }

  async getById(id: string): Promise<ServiceResult<Entry>> {
    try {
      const entry = await this.entryRepo.getById(id);
      if (!entry) {
        return { ok: false, error: { code: 'NOT_FOUND', message: 'Entry not found.' } };
      }
      return { ok: true, data: entry };
    } catch (error) {
      return { ok: false, error: { code: 'NETWORK_ERROR', message: 'Failed to load entry.' } };
    }
  }

  // ... other methods
}
```

## Step 6: Implement the Hook

Create `src/features/<feature>/hooks/use<Feature>.ts`.

1. Call service methods — never call repositories directly.
2. Manage React state (loading, error, data) using `useState`/`useReducer` or TanStack Query.
3. Handle component lifecycle — cancel requests on unmount, refetch on dependency changes.
4. Return plain data and callbacks — never return service or repository instances.
5. Keep hooks thin — no business logic, no validation.

### Example

```typescript
// src/features/entries/hooks/useEntries.ts

import { useState, useEffect, useCallback } from 'react';
import type { EntryService } from '../services/EntryService';
import type { Entry, EntryError } from '../types';

interface UseEntriesResult {
  entries: Entry[];
  isLoading: boolean;
  error: EntryError | null;
  refetch: () => void;
}

export function useEntries(service: EntryService): UseEntriesResult {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<EntryError | null>(null);

  const fetchEntries = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    const result = await service.getAll();
    if (result.ok) {
      setEntries(result.data);
    } else {
      setError(result.error);
    }

    setIsLoading(false);
  }, [service]);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  return { entries, isLoading, error, refetch: fetchEntries };
}
```

### Using TanStack Query (preferred for server state)

```typescript
import { useQuery } from '@tanstack/react-query';
import type { EntryService } from '../services/EntryService';

export function useEntries(service: EntryService) {
  return useQuery({
    queryKey: ['entries'],
    queryFn: async () => {
      const result = await service.getAll();
      if (!result.ok) throw result.error;
      return result.data;
    },
  });
}
```

## Step 7: Build the UI

Create screens and components in `src/features/<feature>/screens/` and `src/features/<feature>/components/`.

1. Screens compose components and pass data/handlers via props.
2. Components are presentational — they receive data and callbacks, they do not fetch data.
3. Call hooks from screens, not from individual components (unless the component is a complex widget with its own state).
4. Handle all states: loading, error, empty, and success.
5. Use theme tokens for all styling — no hardcoded colors, spacing, or fonts.
6. Add accessibility attributes to all interactive elements.
7. Add `testID` attributes for test targeting.

### Example Screen

```typescript
// src/features/entries/screens/EntriesScreen.tsx

import React from 'react';
import { View, FlatList, Text, ActivityIndicator, Button } from 'react-native';
import { useEntries } from '../hooks/useEntries';
import { EntryCard } from '../components/EntryCard';
import { entryService } from '../services/EntryService'; // or injected via context
import { colors } from '@theme/colors';
import { spacing } from '@theme/spacing';

export function EntriesScreen() {
  const { entries, isLoading, error, refetch } = useEntries(entryService);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }} testID="entries-loading">
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.md }} testID="entries-error">
        <Text>{error.message}</Text>
        <Button title="Retry" onPress={refetch} />
      </View>
    );
  }

  if (entries.length === 0) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }} testID="entries-empty">
        <Text>No entries yet. Create your first one!</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={entries}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => <EntryCard entry={item} />}
      contentContainerStyle={{ padding: spacing.md }}
      testID="entries-list"
    />
  );
}
```

## Step 8: Write Tests

Tests are written **bottom-up**, mirroring the dependency hierarchy: Repository → Service → Hook → UI.

### Test Each Layer in Order

1. **Repository tests** — mock data sources, test CRUD, test offline behavior.
2. **Service tests** — mock the repository, test business logic, validation, error translation.
3. **Hook tests** — mock the service, test state transitions, lifecycle, error handling.
4. **Screen/Component tests** — mock hooks, test rendering, interactions, accessibility.

### Test Writing Checklist

- [ ] Happy path: valid input → expected output.
- [ ] Validation errors: invalid input → error returned.
- [ ] Error translation: repository error → service error.
- [ ] Edge cases: empty data, null/undefined, boundary values.
- [ ] Loading states: UI shows loading indicator.
- [ ] Error states: UI shows error message + retry.
- [ ] Empty states: UI shows empty state message.
- [ ] Accessibility: interactive elements have labels and roles.

## Step 9: Document

1. **JSDoc** every public function, method, and type.
2. **Feature README** (`src/features/<feature>/README.md`) using the template in `documentation.md`.
3. **Changelog entry** if the feature is user-facing.
4. **ADR** if any architectural decision was made during development.

### Documentation Checklist

- [ ] JSDoc on all public APIs.
- [ ] Feature README created with overview, architecture, error states, testing instructions.
- [ ] Changelog entry added (if user-facing).
- [ ] ADR created (if architectural change was made).

## Process Summary

```
Step 1: Define Scope      → Scope document / Issue description
Step 2: Types             → src/features/<feature>/types/index.ts
Step 3: Repository I/F    → src/features/<feature>/repositories/I<Feature>Repository.ts
Step 4: Repository Impl   → src/features/<feature>/repositories/<Feature>Repository.ts
Step 5: Service           → src/features/<feature>/services/<Feature>Service.ts
Step 6: Hook              → src/features/<feature>/hooks/use<Feature>.ts
Step 7: UI                → src/features/<feature>/screens/ + components/
Step 8: Tests             → __tests__/ alongside each layer
Step 9: Documentation     → README, JSDoc, changelog, ADR
```

Each step depends on the previous step being complete. Do not skip steps. Do not reorder them. The types must exist before the repository, the repository before the service, the service before the hook, the hook before the UI, and everything must be tested before documentation is considered final.
