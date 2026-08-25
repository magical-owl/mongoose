const MAX_TAG_LENGTH = 32;

export function normalizeDiaryTag(value: string): string {
  return value
    .trim()
    .replace(/^#+/, '')
    .replace(/\s+/g, ' ')
    .slice(0, MAX_TAG_LENGTH)
    .trim()
    .toLowerCase();
}

export function normalizeDiaryTags(values: readonly string[]): string[] {
  const tags: string[] = [];
  const seen = new Set<string>();

  for (const value of values) {
    const tag = normalizeDiaryTag(value);
    if (!tag || seen.has(tag)) continue;
    seen.add(tag);
    tags.push(tag);
  }

  return tags;
}

export function toggleDiaryTagSelection(selectedTags: readonly string[], tagValue: string): string[] {
  const tag = normalizeDiaryTag(tagValue);
  if (!tag) return normalizeDiaryTags(selectedTags);

  const normalizedTags = normalizeDiaryTags(selectedTags);
  return normalizedTags.includes(tag)
    ? normalizedTags.filter((item) => item !== tag)
    : [...normalizedTags, tag];
}
