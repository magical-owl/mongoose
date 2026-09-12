import {
  clearDiaryEntryPreviewTextCache,
  getDiaryEntryPreviewText,
} from '@/features/diary/services/DiaryEntryPreviewText';
import { buildDiaryEntry } from '@tests/fixtures/domain';

describe('DiaryEntryPreviewText', () => {
  afterEach(() => {
    clearDiaryEntryPreviewTextCache();
  });

  it('returns a plain text preview for rich diary content', () => {
    const entry = buildDiaryEntry({
      content: '<h2>Morning</h2><p>Felt &amp; stayed calm.</p>',
    });

    expect(getDiaryEntryPreviewText(entry)).toBe('Morning Felt & stayed calm.');
  });

  it('invalidates cached preview text when content changes', () => {
    const entry = buildDiaryEntry({
      id: '11111111-1111-4111-8111-111111111111',
      content: '<p>Before edit.</p>',
      updatedAt: '2026-08-29T01:00:00.000Z',
    });

    expect(getDiaryEntryPreviewText(entry)).toBe('Before edit.');
    expect(getDiaryEntryPreviewText({
      ...entry,
      content: '<p>After edit.</p>',
      updatedAt: '2026-08-29T01:05:00.000Z',
    })).toBe('After edit.');
  });

  it('invalidates cached preview text when content changes without an updated timestamp change', () => {
    const entry = buildDiaryEntry({
      content: '<p>Original body.</p>',
      updatedAt: '2026-08-29T01:00:00.000Z',
    });

    expect(getDiaryEntryPreviewText(entry)).toBe('Original body.');
    expect(getDiaryEntryPreviewText({
      ...entry,
      content: '<p>Same timestamp body.</p>',
    })).toBe('Same timestamp body.');
  });
});
