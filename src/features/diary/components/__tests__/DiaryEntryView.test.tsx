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

const profile = {
  displayName: 'Sarah Meadow',
  avatarUri: undefined,
};

describe('DiaryEntryView', () => {
  it('renders card view as a separated tappable surface', async () => {
    const entryWithMultipleMeta: DiaryEntry = {
      ...baseEntry,
      tags: ['daily', 'work'],
      manualMoods: ['calm', 'happy', 'sad'],
      reflections: [
        {
          id: '22222222-2222-4222-8222-222222222222',
          text: 'A follow-up reflection.',
          createdAt: '2026-08-29T02:12:00.000Z',
          updatedAt: '2026-08-29T02:12:00.000Z',
        },
        {
          id: '33333333-3333-4333-8333-333333333333',
          text: 'Another reflection.',
          createdAt: '2026-08-29T02:20:00.000Z',
          updatedAt: '2026-08-29T02:20:00.000Z',
        },
      ],
    };
    const { getByTestId, getByText, queryByText } = await renderWithProviders(
      <DiaryEntryView
        entry={entryWithMultipleMeta}
        mode="detailed"
        profile={profile}
        onPress={jest.fn()}
        onReflectionSummaryPress={jest.fn()}
      />,
      { wrapperOptions: { initialThemeMode: 'dark' } },
    );

    const style = StyleSheet.flatten(getByTestId('entry-card').props.style);
    const avatarStyle = StyleSheet.flatten(getByTestId('entry-card-avatar').props.style);
    const moodStyle = StyleSheet.flatten(getByTestId('entry-card-mood').props.style);
    const reflectionButtonStyle = StyleSheet.flatten(getByTestId('entry-card-reflection-button').props.style);

    expect(getByTestId('entry-card-date-column')).toBeTruthy();
    expect(style.borderRadius).toBe(0);
    expect(style.marginBottom).toBe(0);
    expect(style.marginHorizontal).toBe(-20);
    expect(typeof style.width).toBe('number');
    expect(style.backgroundColor).toBe(palette.gray800);
    expect(avatarStyle.width).toBe(22);
    expect(moodStyle.flexDirection).toBe('row');
    expect(moodStyle.gap).toBe(4);
    expect(getByTestId('entry-card-mood-calm')).toBeTruthy();
    expect(getByTestId('entry-card-mood-overflow')).toBeTruthy();
    expect(getByTestId('entry-card-tags-daily')).toBeTruthy();
    expect(getByTestId('entry-card-tags-overflow')).toBeTruthy();
    expect(reflectionButtonStyle.minWidth).toBe(44);
    expect(reflectionButtonStyle.height).toBe(28);
    expect(getByText('2')).toBeTruthy();
    expect(queryByText('Reflect on this')).toBeNull();
  });

  it('can hide the card date column when a visible date group already labels the entries', async () => {
    const { queryByTestId } = await renderWithProviders(
      <DiaryEntryView entry={baseEntry} mode="detailed" profile={profile} showDateColumn={false} onPress={jest.fn()} />,
      { wrapperOptions: { initialThemeMode: 'dark' } },
    );

    expect(queryByTestId('entry-card-date-column')).toBeNull();
  });

  it('renders timeline view with a spine and threaded reflections', async () => {
    const entryWithReflection: DiaryEntry = {
      ...baseEntry,
      tags: ['daily', 'work', 'family'],
      manualMoods: ['calm', 'happy', 'sad'],
      coverPhoto: {
        id: '33333333-3333-4333-8333-333333333333',
        uri: 'file:///timeline-cover.jpg',
        width: 1200,
        height: 800,
        createdAt: '2026-08-29T01:50:00.000Z',
      },
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
      <DiaryEntryView
        entry={entryWithReflection}
        mode="timeline"
        profile={profile}
        onPress={jest.fn()}
        onAddReflection={jest.fn().mockResolvedValue(true)}
      />,
      { wrapperOptions: { initialThemeMode: 'dark' } },
    );

    const spineStyle = StyleSheet.flatten(getByTestId('entry-timeline-spine').props.style);
    const timelineStyle = StyleSheet.flatten(getByTestId('entry-timeline').props.style);
    const avatarStyle = StyleSheet.flatten(getByTestId('entry-timeline-avatar').props.style);
    const reflectionAvatarStyle = StyleSheet.flatten(getByTestId('entry-reflection-avatar').props.style);
    const moodStyle = StyleSheet.flatten(getByTestId('entry-timeline-mood').props.style);
    const metaRowStyle = StyleSheet.flatten(getByTestId('entry-timeline-meta-row').props.style);
    const reflectionsStyle = StyleSheet.flatten(getByTestId('entry-timeline-reflections').props.style);
    const reflectionSectionStyle = StyleSheet.flatten(getByTestId('entry-timeline-reflection-section').props.style);
    const reflectionInputStyle = StyleSheet.flatten(getByTestId('entry-timeline-reflection-input').props.style);
    const reflectionItemStyle = StyleSheet.flatten(getByTestId('entry-timeline-reflection-item').props.style);
    const coverStyle = StyleSheet.flatten(getByTestId('entry-timeline-cover-photo').props.style);
    const coverScrimStyle = StyleSheet.flatten(getByTestId('entry-timeline-cover-photo-scrim').props.style);

    expect(spineStyle.width).toBe(1);
    expect(spineStyle.left).toBe(26);
    expect(timelineStyle.marginHorizontal).toBe(-20);
    expect(typeof timelineStyle.width).toBe('number');
    expect(avatarStyle.width).toBe(22);
    expect(reflectionAvatarStyle.width).toBe(24);
    expect(moodStyle.flexDirection).toBe('row');
    expect(moodStyle.gap).toBe(4);
    expect(getByTestId('entry-timeline-mood-calm')).toBeTruthy();
    expect(getByTestId('entry-timeline-mood-overflow')).toBeTruthy();
    expect(getByTestId('entry-timeline-tags-daily')).toBeTruthy();
    expect(getByTestId('entry-timeline-tags-overflow')).toBeTruthy();
    expect(metaRowStyle.marginBottom).toBe(8);
    expect(reflectionsStyle.borderLeftWidth).toBe(1);
    expect(reflectionsStyle.marginTop).toBe(0);
    expect(reflectionsStyle.borderLeftColor).toBe(`${accentColors.blue.dark}88`);
    expect(reflectionSectionStyle.marginRight).toBe(0);
    expect(reflectionInputStyle.marginTop).toBe(10);
    expect(reflectionItemStyle.borderRadius).toBe(8);
    expect(coverStyle.width).toBe('100%');
    expect(coverStyle.borderRadius).toBe(0);
    expect(coverScrimStyle.opacity).toBe(0.28);
  });

  it('renders feed view without cover using the entry-detail mood and width pattern', async () => {
    const entryWithMultipleMeta: DiaryEntry = {
      ...baseEntry,
      tags: ['daily', 'work', 'family'],
      manualMoods: ['calm', 'happy', 'sad'],
    };
    const { getByTestId, queryByTestId } = await renderWithProviders(
      <DiaryEntryView
        entry={entryWithMultipleMeta}
        mode="feed"
        profile={profile}
        onPress={jest.fn()}
      />,
      { wrapperOptions: { initialThemeMode: 'dark' } },
    );

    const moodChipStyle = StyleSheet.flatten(getByTestId('entry-feed-mood-calm').props.style);
    const feedCardStyle = StyleSheet.flatten(getByTestId('entry-feed-card').props.style);

    expect(getByTestId('entry-feed-paper-canvas-image')).toBeTruthy();
    expect(queryByTestId('entry-feed-author-row')).toBeNull();
    expect(queryByTestId('entry-feed-author-avatar')).toBeNull();
    expect(getByTestId('entry-feed-mood-overflow')).toBeTruthy();
    expect(getByTestId('entry-feed-tags-daily')).toBeTruthy();
    expect(getByTestId('entry-feed-tags-overflow')).toBeTruthy();
    expect(queryByTestId('entry-feed-tags-work')).toBeNull();
    expect(moodChipStyle.borderRadius).toBe(13);
    expect(moodChipStyle.borderWidth).toBe(1);
    expect(feedCardStyle.paddingVertical).toBe(0);
    expect(feedCardStyle.marginBottom).toBe(0);
    expect(feedCardStyle.marginHorizontal).toBe(-20);
    expect(typeof feedCardStyle.width).toBe('number');
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
      tags: ['daily', 'travel', 'family'],
      manualMoods: ['calm', 'happy', 'sad'],
      reflections: [
        {
          id: '44444444-4444-4444-8444-444444444444',
          text: 'A feed reflection.',
          createdAt: '2026-08-29T02:12:00.000Z',
          updatedAt: '2026-08-29T02:12:00.000Z',
        },
      ],
    };

    const { getByTestId, queryByTestId } = await renderWithProviders(
      <DiaryEntryView
        entry={entryWithCoverAndReflection}
        mode="feed"
        profile={profile}
        onPress={jest.fn()}
        onAddReflection={jest.fn().mockResolvedValue(true)}
      />,
      { wrapperOptions: { initialThemeMode: 'dark' } },
    );

    const contentPanelStyle = StyleSheet.flatten(getByTestId('entry-feed-content-panel').props.style);
    const reflectionPanelStyle = StyleSheet.flatten(getByTestId('entry-feed-reflection-panel').props.style);
    const feedReflectionsStyle = StyleSheet.flatten(getByTestId('entry-timeline-reflections').props.style);
    const reflectionInputStyle = StyleSheet.flatten(getByTestId('entry-feed-reflection-input').props.style);
    const feedCardStyle = StyleSheet.flatten(getByTestId('entry-feed-card').props.style);

    const coverMoodStyle = StyleSheet.flatten(getByTestId('entry-feed-cover-mood-calm').props.style);

    expect(getByTestId('entry-feed-paper-canvas-image')).toBeTruthy();
    expect(coverMoodStyle.borderRadius).toBe(13);
    expect(coverMoodStyle.borderWidth).toBe(1);
    expect(getByTestId('entry-feed-cover-mood-overflow')).toBeTruthy();
    expect(getByTestId('entry-feed-cover-tags-daily')).toBeTruthy();
    expect(getByTestId('entry-feed-cover-tags-overflow')).toBeTruthy();
    expect(queryByTestId('entry-feed-cover-tags-travel')).toBeNull();
    expect(contentPanelStyle.borderRadius).toBe(0);
    expect(contentPanelStyle.borderWidth).toBe(0);
    expect(contentPanelStyle.backgroundColor).toBe('transparent');
    expect(contentPanelStyle.paddingHorizontal).toBe(20);
    expect(contentPanelStyle.paddingTop).toBe(10);
    expect(contentPanelStyle.paddingBottom).toBe(10);
    expect(reflectionPanelStyle.borderRadius).toBe(0);
    expect(reflectionPanelStyle.marginTop).toBe(0);
    expect(reflectionPanelStyle.marginHorizontal).toBe(0);
    expect(reflectionPanelStyle.backgroundColor).toBe(palette.gray800);
    expect(feedReflectionsStyle.borderLeftWidth).toBe(0);
    expect(feedReflectionsStyle.paddingLeft).toBe(0);
    expect(reflectionInputStyle.marginLeft).toBe(0);
    expect(reflectionInputStyle.marginTop).toBe(10);
    expect(queryByTestId('entry-feed-author-row')).toBeNull();
    expect(queryByTestId('entry-feed-author-avatar')).toBeNull();
    expect(feedCardStyle.paddingVertical).toBe(0);
    expect(feedCardStyle.marginBottom).toBe(0);
    expect(feedCardStyle.marginHorizontal).toBe(-20);
    expect(typeof feedCardStyle.width).toBe('number');
  });
});
