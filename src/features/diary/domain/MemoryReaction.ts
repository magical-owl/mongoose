import { z } from 'zod';

export const MemoryReactionSchema = z.enum(['cherish', 'treasure', 'smile', 'heavy', 'tender', 'stormy', 'wonder']);
export type MemoryReaction = z.infer<typeof MemoryReactionSchema>;

export const MEMORY_REACTION_OPTIONS: readonly MemoryReaction[] = [
  'cherish',
  'treasure',
  'smile',
  'heavy',
  'tender',
  'stormy',
  'wonder',
];

export function normalizeMemoryReactions(reactions?: readonly MemoryReaction[]): MemoryReaction[] {
  if (!reactions) return [];
  const validReactions = reactions.filter((reaction) => MemoryReactionSchema.safeParse(reaction).success);
  return Array.from(new Set(validReactions));
}

export function toggleMemoryReactionSelection(
  selectedReactions: readonly MemoryReaction[],
  reaction: MemoryReaction,
): MemoryReaction[] {
  const normalized = normalizeMemoryReactions(selectedReactions);
  if (normalized.includes(reaction)) {
    return normalized.filter((selected) => selected !== reaction);
  }
  return [...normalized, reaction];
}
