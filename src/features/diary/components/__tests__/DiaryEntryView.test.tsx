import { StyleSheet } from 'react-native';
import { DiaryEntryView } from '@/features/diary/components/DiaryEntryView';
import type { DiaryEntry } from '@/features/diary/domain/DiaryEntry';
import { renderWithProviders } from '@tests/helpers';
import { accentColors } from '@theme/accents';
import { palette } from '@theme/colors';

const baseEntry: DiaryEntry = {
  id: '11111111-1111-4111-8111-111111111111',
  title: 'Morning notes',
  content: '<p>A short entry for today.</p>',
  date: '2026-08-29',
  paperBackgroundId: 'vintage-parchment',
  stickers: [],
  companion: 'cat',
  isFavorite: false,
  tags: ['daily'],
  createdAt: '2026-08-29T01:58:00.000Z',
  updatedAt: '2026-08-29T01:58:00.000Z',
  manualMoodWeather: 'neutral',
  manualMood: 'calm',
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

describe('DiaryEntryView', () => {
  it('renders card view as a separated tappable surface', async () => {
    const { getByTestId } = await renderWithProviders(
      <DiaryEntryView entry={baseEntry} mode="detailed" onPress={jest.fn()} />,
      { wrapperOptions: { initialThemeMode: 'dark' } },
    );

    const style = StyleSheet.flatten(getByTestId('entry-card').props.style);
    const moodStyle = StyleSheet.flatten(getByTestId('entry-card-mood').props.style);

    expect(style.borderRadius).toBe(8);
    expect(style.marginBottom).toBe(14);
    expect(style.backgroundColor).toBe(palette.gray800);
    expect(moodStyle.flexDirection).toBe('row');
    expect(moodStyle.gap).toBe(5);
  });

  it('renders timeline view with a spine and threaded reflections', async () => {
    const entryWithReflection: DiaryEntry = {
      ...baseEntry,
      reflections: [
        {
          id: '22222222-2222-4222-8222-222222222222',
          text: 'A follow-up reflection.',
          createdAt: '2026-08-29T02:12:00.000Z',
          updatedAt: '2026-08-29T02:12:00.000Z',
        },
      ],
    };

    const { getByTestId } = await renderWithProviders(
      <DiaryEntryView entry={entryWithReflection} mode="timeline" onPress={jest.fn()} />,
      { wrapperOptions: { initialThemeMode: 'dark' } },
    );

    const spineStyle = StyleSheet.flatten(getByTestId('entry-timeline-spine').props.style);
    const moodStyle = StyleSheet.flatten(getByTestId('entry-timeline-mood').props.style);
    const reflectionsStyle = StyleSheet.flatten(getByTestId('entry-timeline-reflections').props.style);
    const reflectionItemStyle = StyleSheet.flatten(getByTestId('entry-timeline-reflection-item').props.style);

    expect(spineStyle.width).toBe(1);
    expect(moodStyle.flexDirection).toBe('row');
    expect(moodStyle.gap).toBe(5);
    expect(reflectionsStyle.borderLeftWidth).toBe(1);
    expect(reflectionsStyle.borderLeftColor).toBe(`${accentColors.blue.dark}88`);
    expect(reflectionItemStyle.borderRadius).toBe(8);
  });

  it('renders feed view without cover using the shared mood indicator', async () => {
    const { getByTestId } = await renderWithProviders(
      <DiaryEntryView entry={baseEntry} mode="feed" onPress={jest.fn()} />,
      { wrapperOptions: { initialThemeMode: 'dark' } },
    );

    const moodStyle = StyleSheet.flatten(getByTestId('entry-feed-mood').props.style);

    expect(moodStyle.flexDirection).toBe('row');
    expect(moodStyle.gap).toBe(5);
  });

  it('renders feed view with stronger cover and reflection structure', async () => {
    const entryWithCoverAndReflection: DiaryEntry = {
      ...baseEntry,
      coverPhoto: {
        id: '33333333-3333-4333-8333-333333333333',
        uri: 'file:///cover.jpg',
        width: 1200,
        height: 800,
        createdAt: '2026-08-29T01:50:00.000Z',
      },
      reflections: [
        {
          id: '44444444-4444-4444-8444-444444444444',
          text: 'A feed reflection.',
          createdAt: '2026-08-29T02:12:00.000Z',
          updatedAt: '2026-08-29T02:12:00.000Z',
        },
      ],
    };

    const { getByTestId } = await renderWithProviders(
      <DiaryEntryView
        entry={entryWithCoverAndReflection}
        mode="feed"
        onPress={jest.fn()}
        onAddReflection={jest.fn().mockResolvedValue(true)}
      />,
      { wrapperOptions: { initialThemeMode: 'dark' } },
    );

    const contentPanelStyle = StyleSheet.flatten(getByTestId('entry-feed-content-panel').props.style);
    const reflectionPanelStyle = StyleSheet.flatten(getByTestId('entry-feed-reflection-panel').props.style);
    const reflectionInputStyle = StyleSheet.flatten(getByTestId('entry-feed-reflection-input').props.style);
    const bottomScrimStyle = StyleSheet.flatten(getByTestId('entry-feed-cover-bottom-scrim').props.style);

    const coverMoodStyle = StyleSheet.flatten(getByTestId('entry-feed-cover-mood').props.style);

    expect(coverMoodStyle.flexDirection).toBe('row');
    expect(coverMoodStyle.gap).toBe(5);
    expect(contentPanelStyle.borderRadius).toBe(8);
    expect(contentPanelStyle.backgroundColor).toBe(palette.gray800);
    expect(reflectionPanelStyle.borderRadius).toBe(8);
    expect(reflectionPanelStyle.backgroundColor).toBe(palette.gray800);
    expect(reflectionInputStyle.marginLeft).toBe(0);
    expect(bottomScrimStyle.opacity).toBe(0.56);
  });
});
