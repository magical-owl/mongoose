import { shouldPromptForEntryMetadataBeforeSave } from '@/features/diary/services/EntryMetadataSavePrompt';

describe('shouldPromptForEntryMetadataBeforeSave', () => {
  it('prompts when the mood is neutral', () => {
    expect(shouldPromptForEntryMetadataBeforeSave({
      moods: ['neutral'],
      tags: ['weekend'],
    })).toBe(true);
  });

  it('prompts when there are no tags', () => {
    expect(shouldPromptForEntryMetadataBeforeSave({
      moods: ['happy'],
      tags: [],
    })).toBe(true);
  });

  it('does not prompt when the entry has a non-neutral mood and tags', () => {
    expect(shouldPromptForEntryMetadataBeforeSave({
      moods: ['happy', 'grateful'],
      tags: ['weekend'],
    })).toBe(false);
  });
});
