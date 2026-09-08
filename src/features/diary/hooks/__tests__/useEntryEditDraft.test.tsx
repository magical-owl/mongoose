import { Text, TouchableOpacity } from 'react-native';
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import type { DiaryEntry } from '@/features/diary/domain/DiaryEntry';
import { appendTemplateToEntryContent, useEntryEditDraft } from '@/features/diary/hooks/useEntryEditDraft';

jest.mock('@/features/diary/services/DiaryPhotoService', () => ({
  createPlacedPhotoSticker: (photo: { id: string }, index: number) => ({
    id: `photo-sticker-${photo.id}`,
    stickerId: photo.id,
    category: 'photo',
    x: 12 + index,
    y: 18 + index,
    scale: 1,
    rotation: 0,
    zIndex: index + 1,
    behindText: false,
    photo,
  }),
}));

function createEntry(): DiaryEntry {
  return {
    id: '11111111-1111-4111-8111-111111111111',
    title: 'Original title',
    content: '<p>Original body.</p>',
    date: '2026-08-29',
    paperBackgroundId: 'lined-paper',
    bodyFontFamily: 'lora',
    bodyTextColor: '#FFF7E6',
    stickers: [],
    companion: 'cat',
    isFavorite: true,
    memoryReactions: [],
    tags: ['Daily', 'daily', 'Weekend'],
    createdAt: '2026-08-29T01:00:00.000Z',
    updatedAt: '2026-08-29T01:00:00.000Z',
    manualMoodWeather: 'calm',
    manualMood: 'happy',
    manualMoods: ['happy', 'grateful'],
    writingMode: 'gratitude',
    isLockbox: true,
    sensory: {
      locationLabel: 'Desk',
      sounds: 'Rain',
      smells: 'Coffee',
      energyLevel: 7,
      bodyState: 'Rested',
    },
    collectionIds: [],
    journalIds: ['22222222-2222-4222-8222-222222222222'],
    coverPhoto: {
      id: '33333333-3333-4333-8333-333333333333',
      uri: 'file:///cover.jpg',
      width: 1200,
      height: 800,
      createdAt: '2026-08-29T01:00:00.000Z',
    },
    photos: [
      {
        id: '44444444-4444-4444-8444-444444444444',
        uri: 'file:///photo.jpg',
        width: 1200,
        height: 800,
        createdAt: '2026-08-29T01:00:00.000Z',
      },
    ],
    reflections: [],
  };
}

function DraftHarness({ sourceEntry }: { readonly sourceEntry: DiaryEntry }) {
  const draft = useEntryEditDraft();

  return (
    <>
      <Text testID="draft-title">{draft.editTitle}</Text>
      <Text testID="draft-tags">{draft.editTags.join(',')}</Text>
      <Text testID="draft-sticker-count">{draft.editStickers.length}</Text>
      <TouchableOpacity testID="hydrate-draft" onPress={() => draft.hydrateEditDraft(sourceEntry)}>
        <Text>Hydrate</Text>
      </TouchableOpacity>
      <TouchableOpacity
        testID="edit-and-build"
        onPress={() => {
          draft.setEditTitle('  Updated title  ');
          draft.setEditContent('  <p>Updated body.</p>  ');
          draft.setEditEnergy('17');
        }}
      >
        <Text>Edit</Text>
      </TouchableOpacity>
      <TouchableOpacity
        testID="build-entry"
        onPress={() => {
          const updated = draft.buildUpdatedEntry(sourceEntry);
          draft.setEditTitle(`${updated.title}|${updated.content}|${updated.sensory.energyLevel}|${updated.photos.length}`);
        }}
      >
        <Text>Build</Text>
      </TouchableOpacity>
    </>
  );
}

describe('appendTemplateToEntryContent', () => {
  it('appends template content without trailing blank html clutter', () => {
    expect(appendTemplateToEntryContent('<p>Start</p><br><br>', '<p>Prompt</p>')).toBe('<p>Start</p><br><br><p>Prompt</p>');
    expect(appendTemplateToEntryContent('', '<p>Prompt</p>')).toBe('<p>Prompt</p>');
  });
});

describe('useEntryEditDraft', () => {
  it('hydrates draft fields and builds a normalized updated entry', async () => {
    const sourceEntry = createEntry();
    const { getByTestId } = await render(<DraftHarness sourceEntry={sourceEntry} />);

    fireEvent.press(getByTestId('hydrate-draft'));

    await waitFor(() => {
      expect(getByTestId('draft-title').props.children).toBe('Original title');
    });
    expect(getByTestId('draft-tags').props.children).toBe('daily,weekend');
    expect(getByTestId('draft-sticker-count').props.children).toBe(1);

    await act(async () => {
      fireEvent.press(getByTestId('edit-and-build'));
    });
    await act(async () => {
      fireEvent.press(getByTestId('build-entry'));
    });

    await waitFor(() => {
      expect(getByTestId('draft-title').props.children).toBe('Updated title|<p>Updated body.</p>|10|0');
    });
  });
});
