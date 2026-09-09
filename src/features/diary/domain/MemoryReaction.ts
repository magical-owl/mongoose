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

interface MemoryReactionStatsSource {
  readonly memoryReactions?: readonly MemoryReaction[];
  readonly reflections?: readonly {
    readonly memoryReactions?: readonly MemoryReaction[];
  }[];
}

export interface MemoryReactionStat {
  readonly reaction: MemoryReaction;
  readonly entryCount: number;
  readonly reflectionCount: number;
  readonly total: number;
}

export function normalizeMemoryReactions(reactions?: readonly MemoryReaction[]): MemoryReaction[] {
  if (!reactions) return [];
  const validReactions = reactions.filter((reaction) => MemoryReactionSchema.safeParse(reaction).success);
  const firstReaction = validReactions[0];
  return firstReaction ? [firstReaction] : [];
}

export function toggleMemoryReactionSelection(
  selectedReactions: readonly MemoryReaction[],
  reaction: MemoryReaction,
): MemoryReaction[] {
  const normalized = normalizeMemoryReactions(selectedReactions);
  if (normalized.includes(reaction)) {
    return [];
  }
  return [reaction];
}

export function getMemoryReactionStats(entries: readonly MemoryReactionStatsSource[]): MemoryReactionStat[] {
  const counts = new Map<MemoryReaction, { entryCount: number; reflectionCount: number }>(
    MEMORY_REACTION_OPTIONS.map((reaction) => [reaction, { entryCount: 0, reflectionCount: 0 }]),
  );

  entries.forEach((entry) => {
    normalizeMemoryReactions(entry.memoryReactions).forEach((reaction) => {
      const current = counts.get(reaction);
      if (current) current.entryCount += 1;
    });

    entry.reflections?.forEach((reflection) => {
      normalizeMemoryReactions(reflection.memoryReactions).forEach((reaction) => {
        const current = counts.get(reaction);
        if (current) current.reflectionCount += 1;
      });
    });
  });

  return MEMORY_REACTION_OPTIONS.map((reaction) => {
    const current = counts.get(reaction) ?? { entryCount: 0, reflectionCount: 0 };
    return {
      reaction,
      entryCount: current.entryCount,
      reflectionCount: current.reflectionCount,
      total: current.entryCount + current.reflectionCount,
    };
  }).filter((stat) => stat.total > 0)
    .sort((a, b) => b.total - a.total);
}
