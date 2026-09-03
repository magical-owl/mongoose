import { DiaryEntryBodyView } from '@/features/diary/components/DiaryEntryBodyView';
import type { DiaryEntry } from '@/features/diary/domain/DiaryEntry';
import { renderWithProviders } from '@tests/helpers';
import { StyleSheet } from 'react-native';

const entry: DiaryEntry = {
  id: '11111111-1111-4111-8111-111111111111',
  title: 'Morning notes',
  content: '<p>A <strong>bold</strong> <span style="color: rgb(243, 198, 193);">thought</span>.</p><a href="https://example.com">link</a><script>alert("x")</script>',
  date: '2026-08-29',
  paperBackgroundId: 'vintage-parchment',
  bodyFontFamily: 'lora',
  bodyTextColor: '#F3C6C1',
  stickers: [],
  companion: 'cat',
  isFavorite: false,
  tags: ['daily'],
  createdAt: '2026-08-29T01:58:00.000Z',
  updatedAt: '2026-08-29T01:58:00.000Z',
  manualMoodWeather: 'neutral',
  manualMood: 'calm',
  manualMoods: ['calm'],
  writingMode: 'free-write',
  isLockbox: false,
  sensory: {
    locationLabel: '',
    sounds: '',
    smells: '',
    energyLevel: 5,
    bodyState: '',
  },
  collectionIds: [],
  journalIds: [],
  photos: [],
  reflections: [],
};

describe('DiaryEntryBodyView', () => {
  it('renders saved rich body formatting in read-only view mode', async () => {
    const { getByTestId, getByText, queryByText } = await renderWithProviders(
      <DiaryEntryBodyView
        entry={entry}
        bodyCanvasHeight={160}
        bodyFontSize={20}
        bodyLineHeight={31}
        stickers={[]}
        onBodyLayout={jest.fn()}
        onUpdateSticker={jest.fn()}
        onDeleteSticker={jest.fn()}
      />,
      { wrapperOptions: { initialThemeMode: 'dark' } },
    );

    expect(getByTestId('diary-entry-body-view')).toBeTruthy();
    expect(getByText('bold')).toBeTruthy();
    expect(getByText(/thought/)).toBeTruthy();
    expect(getByText('link')).toBeTruthy();
    expect(queryByText('alert("x")')).toBeNull();
  });

  it('renders saved h2 blocks larger than normal body text', async () => {
    const h2Entry = {
      ...entry,
      content: '<h2><span>Section heading</span></h2><p>Normal body.</p>',
    };
    const { getByText } = await renderWithProviders(
      <DiaryEntryBodyView
        entry={h2Entry}
        bodyCanvasHeight={160}
        bodyFontSize={20}
        bodyLineHeight={31}
        stickers={[]}
        onBodyLayout={jest.fn()}
      />,
      { wrapperOptions: { initialThemeMode: 'dark' } },
    );

    const headingStyle = StyleSheet.flatten(getByText('Section heading').props.style);
    expect(headingStyle?.fontSize).toBeGreaterThan(20);
    expect(getByText('Normal body.')).toBeTruthy();
  });
});
