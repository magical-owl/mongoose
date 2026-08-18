import { z } from 'zod';

export const ChapterSchema = z.object({
  id: z.string().uuid(), title: z.string().min(1).max(80), description: z.string().max(280).default(''),
  cover: z.string().default('📖'), color: z.string().default('#1E90FF'), startDate: z.string(), endDate: z.string().optional(), entryIds: z.array(z.string().uuid()).default([]),
});
export type Chapter = z.infer<typeof ChapterSchema>;

export const RitualSchema = z.object({
  id: z.string().uuid(), title: z.string().min(1).max(80), frequency: z.enum(['daily', 'weekly', 'monthly']).default('weekly'), prompt: z.string().max(280).default(''), completedDates: z.array(z.string()).default([]),
});
export type Ritual = z.infer<typeof RitualSchema>;

export const CollectionSchema = z.object({
  id: z.string().uuid(), title: z.string().min(1).max(80), description: z.string().max(280).default(''), color: z.string().default('#4ECDC4'), entryIds: z.array(z.string().uuid()).default([]),
});
export type Collection = z.infer<typeof CollectionSchema>;

export const MilestoneSchema = z.object({
  id: z.string().uuid(), title: z.string().min(1).max(100), date: z.string(), note: z.string().max(280).default(''), color: z.string().default('#E5A72D'),
});
export type Milestone = z.infer<typeof MilestoneSchema>;

export const ReflectionCardSchema = z.object({
  id: z.string().uuid(), text: z.string().min(1).max(500), sourceEntryId: z.string().uuid(), createdAt: z.string().datetime(),
});
export type ReflectionCard = z.infer<typeof ReflectionCardSchema>;

export const EntryConnectionSchema = z.object({
  id: z.string().uuid(), fromEntryId: z.string().uuid(), toEntryId: z.string().uuid(), label: z.enum(['before', 'after', 'related', 'same-trip']).default('related'),
});
export type EntryConnection = z.infer<typeof EntryConnectionSchema>;

export const JournalExtrasSchema = z.object({
  version: z.number().default(1), chapters: z.array(ChapterSchema).default([]), rituals: z.array(RitualSchema).default([]), collections: z.array(CollectionSchema).default([]), milestones: z.array(MilestoneSchema).default([]), reflectionCards: z.array(ReflectionCardSchema).default([]), connections: z.array(EntryConnectionSchema).default([]),
});
export type JournalExtras = z.infer<typeof JournalExtrasSchema>;

export const EMPTY_JOURNAL_EXTRAS: JournalExtras = { version: 1, chapters: [], rituals: [], collections: [], milestones: [], reflectionCards: [], connections: [] };
