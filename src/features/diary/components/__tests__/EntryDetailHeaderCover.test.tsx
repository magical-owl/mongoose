import { Animated } from 'react-native';
import { fireEvent } from '@testing-library/react-native';
import { EntryDetailHeaderCover } from '@/features/diary/components/EntryDetailHeaderCover';
import type { DiaryPhoto } from '@/features/diary/domain/DiaryEntry';
import { renderWithProviders } from '@tests/helpers';

jest.mock('@/features/diary/components/DiaryCoverPhotoPicker', () => ({
  DiaryCoverPhotoPicker: ({
    photo,
    children,
    onChoosePhoto,
  }: {
    readonly photo?: DiaryPhoto;
    readonly children?: React.ReactNode;
    readonly onChoosePhoto?: () => void;
  }) => {
    const React = jest.requireActual<typeof import('react')>('react');
    const { Text, View } = jest.requireActual<typeof import('react-native')>('react-native');

    return React.createElement(
      View,
      { testID: 'mock-diary-cover-photo-picker' },
      React.createElement(Text, null, photo ? 'has-cover-photo' : 'no-cover-photo'),
      React.createElement(Text, { onPress: onChoosePhoto }, 'Choose cover'),
      children,
    );
  },
}));

const coverPhoto: DiaryPhoto = {
  id: '33333333-3333-4333-8333-333333333333',
  uri: 'file:///cover.jpg',
  width: 1200,
  height: 800,
  createdAt: '2026-08-29T01:00:00.000Z',
};

function renderHeaderCover(
  props: Partial<React.ComponentProps<typeof EntryDetailHeaderCover>> = {},
) {
  return renderWithProviders(
    <EntryDetailHeaderCover
      isEditing={false}
      topInset={47}
      entryHorizontalPadding={20}
      hasEditCoverPhoto={false}
      hasViewCoverPhoto
      editCoverPhoto={undefined}
      viewCoverPhoto={coverPhoto}
      editCoverExpandedHeight={270}
      coverTopOffset={120}
      headerOnlyHeight={113}
      coverScrollY={new Animated.Value(0)}
      viewEntryOpacity={new Animated.Value(1)}
      viewCoverOverlayOpacity={new Animated.Value(1).interpolate({
        inputRange: [0, 1],
        outputRange: [0, 1],
      })}
      entryTitle="A quiet morning"
      viewDateTime="Yesterday at 08:33"
      viewCount={7}
      canBringStickersForward={false}
      isFavorite={false}
      isSaving={false}
      onCancelEdit={jest.fn()}
      onBringStickersForward={jest.fn()}
      onToggleFavorite={jest.fn()}
      onSaveEdit={jest.fn()}
      onBack={jest.fn()}
      onStartEdit={jest.fn()}
      onDelete={jest.fn()}
      onTakeCoverPhoto={jest.fn()}
      onChooseCoverPhoto={jest.fn()}
      onRemoveCoverPhoto={jest.fn()}
      {...props}
    />,
    { wrapperOptions: { initialThemeMode: 'dark' } },
  );
}

describe('EntryDetailHeaderCover', () => {
  it('renders the view cover overlay with title, timestamp, and view count', async () => {
    const { getByText, getByTestId } = await renderHeaderCover();

    expect(getByTestId('mock-diary-cover-photo-picker')).toBeTruthy();
    expect(getByText('A quiet morning')).toBeTruthy();
    expect(getByText('Yesterday at 08:33')).toBeTruthy();
    expect(getByTestId('entry-view-count')).toBeTruthy();
  });

  it('renders edit header controls and cover picker', async () => {
    const onSaveEdit = jest.fn();
    const onChooseCoverPhoto = jest.fn();
    const { getByText, queryByTestId } = await renderHeaderCover({
      isEditing: true,
      hasEditCoverPhoto: false,
      hasViewCoverPhoto: false,
      editCoverPhoto: undefined,
      viewCoverPhoto: undefined,
      isSaving: false,
      onSaveEdit,
      onChooseCoverPhoto,
    });

    await fireEvent.press(getByText('Save'));
    await fireEvent.press(getByText('Choose cover'));

    expect(onSaveEdit).toHaveBeenCalled();
    expect(onChooseCoverPhoto).toHaveBeenCalled();
    expect(queryByTestId('entry-view-count')).toBeNull();
  });
});
