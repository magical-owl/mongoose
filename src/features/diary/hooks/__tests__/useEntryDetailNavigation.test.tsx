import { Animated, Image, Text, TouchableOpacity } from 'react-native';
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import { useRef, useState } from 'react';
import type { DiaryEntry } from '@/features/diary/domain/DiaryEntry';
import { useEntryDetailNavigation } from '@/features/diary/hooks/useEntryDetailNavigation';
import { buildDiaryEntry } from '@tests/fixtures/domain';

jest.mock('@/features/diary/services/DiaryPhotoService', () => ({
  getDiaryPhotoImageSource: (uri: string) => ({ uri }),
}));

jest.spyOn(Animated, 'timing').mockImplementation((value, config) => ({
  start: (callback?: Animated.EndCallback) => {
    const numericToValue = typeof config.toValue === 'number' ? config.toValue : 0;
    (value as Animated.Value).setValue(numericToValue);
    callback?.({ finished: true });
  },
  stop: jest.fn(),
  reset: jest.fn(),
}));

function createEntry(id: string, isLockbox = false): DiaryEntry {
  return buildDiaryEntry({
    id,
    title: id,
    isLockbox,
  });
}

function NavigationHarness({
  initialEntry,
  entries,
  isEditing = false,
  canOpenLockbox = true,
  onRouteEntryChange,
}: {
  readonly initialEntry: DiaryEntry;
  readonly entries: readonly DiaryEntry[];
  readonly isEditing?: boolean;
  readonly canOpenLockbox?: boolean;
  readonly onRouteEntryChange: (entryId: string) => void;
}) {
  const [entry, setEntry] = useState<DiaryEntry | null>(initialEntry);
  const scrollRef = useRef(null);
  const navigation = useEntryDetailNavigation({
    entries,
    entry,
    isEditing,
    scrollRef,
    hydrateEntryState: setEntry,
    resetScrollCollapse: jest.fn(),
    onScroll: jest.fn(),
    onRouteEntryChange,
    onRequireLockboxAccess: () => Promise.resolve(canOpenLockbox),
    onResetTransientUi: jest.fn(),
  });

  return (
    <>
      <Text testID="current-entry">{entry?.id}</Text>
      <Text testID="loading-entry-direction">{navigation.loadingEntryDirection ?? 'none'}</Text>
      <TouchableOpacity testID="previous-entry" onPress={navigation.handleLoadPreviousEntry}>
        <Text>Previous</Text>
      </TouchableOpacity>
      <TouchableOpacity testID="next-entry" onPress={navigation.handleLoadNextEntry}>
        <Text>Next</Text>
      </TouchableOpacity>
      <TouchableOpacity
        testID="bottom-scroll"
        onPress={() => {
          navigation.markViewScrollStarted();
          navigation.handleViewScroll({
            nativeEvent: {
              contentOffset: { y: 664 },
              contentSize: { height: 1200, width: 390 },
              layoutMeasurement: { height: 500, width: 390 },
            },
          } as never);
        }}
      >
        <Text>Scroll</Text>
      </TouchableOpacity>
    </>
  );
}

describe('useEntryDetailNavigation', () => {
  beforeAll(() => {
    jest.spyOn(Image, 'prefetch').mockResolvedValue(true);
  });

  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.clearAllMocks();
    jest.useRealTimers();
  });

  it('loads the next entry from bottom scroll', async () => {
    const first = createEntry('first');
    const second = createEntry('second');
    const onRouteEntryChange = jest.fn();
    const { getByTestId } = await render(
      <NavigationHarness
        initialEntry={first}
        entries={[first, second]}
        onRouteEntryChange={onRouteEntryChange}
      />,
    );

    await act(async () => {
      await fireEvent.press(getByTestId('bottom-scroll'));
      await Promise.resolve();
      await jest.runOnlyPendingTimersAsync();
    });

    await waitFor(() => expect(getByTestId('current-entry').props.children).toBe('second'));
    expect(onRouteEntryChange).toHaveBeenCalledWith('second');
  });

  it('wraps previous entry from first to last', async () => {
    const first = createEntry('first');
    const second = createEntry('second');
    const third = createEntry('third');
    const onRouteEntryChange = jest.fn();
    const { getByTestId } = await render(
      <NavigationHarness
        initialEntry={first}
        entries={[first, second, third]}
        onRouteEntryChange={onRouteEntryChange}
      />,
    );

    await act(async () => {
      await fireEvent.press(getByTestId('previous-entry'));
      await Promise.resolve();
      await jest.runOnlyPendingTimersAsync();
    });

    await waitFor(() => expect(getByTestId('current-entry').props.children).toBe('third'));
    expect(onRouteEntryChange).toHaveBeenCalledWith('third');
  });

  it('does not change entries when lockbox access is denied', async () => {
    const first = createEntry('first');
    const second = createEntry('second', true);
    const onRouteEntryChange = jest.fn();
    const { getByTestId } = await render(
      <NavigationHarness
        initialEntry={first}
        entries={[first, second]}
        canOpenLockbox={false}
        onRouteEntryChange={onRouteEntryChange}
      />,
    );

    await act(async () => {
      await fireEvent.press(getByTestId('next-entry'));
      await Promise.resolve();
      await jest.runOnlyPendingTimersAsync();
    });

    expect(getByTestId('current-entry').props.children).toBe('first');
    expect(onRouteEntryChange).not.toHaveBeenCalled();
  });
});
