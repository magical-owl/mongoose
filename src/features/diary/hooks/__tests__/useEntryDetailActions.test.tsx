import { Alert, Text, TouchableOpacity } from 'react-native';
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import type { DiaryEntry, DiaryPhoto } from '@/features/diary/domain/DiaryEntry';
import { useEntryDetailActions } from '@/features/diary/hooks/useEntryDetailActions';
import type { useDiary } from '@/features/diary/hooks/useDiary';
import type { useTranslation } from '@/localization/i18n';

type DiaryActions = Pick<
  ReturnType<typeof useDiary>,
  'saveDiaryEntry' | 'deleteDiaryEntry' | 'addReflection' | 'deleteReflection' | 'toggleMemoryReaction'
>;

const t = ((key: string) => key) as ReturnType<typeof useTranslation>;

function createEntry(overrides: Partial<DiaryEntry> = {}): DiaryEntry {
  const entry: DiaryEntry = {
    id: '11111111-1111-4111-8111-111111111111',
    title: 'Original title',
    content: '<p>Original body.</p>',
    date: '2026-08-29',
    paperBackgroundId: 'lined-paper',
    bodyFontFamily: 'system',
    stickers: [],
    companion: 'cat',
    isFavorite: false,
    memoryReactions: [],
    tags: [],
    createdAt: '2026-08-29T01:00:00.000Z',
    updatedAt: '2026-08-29T01:00:00.000Z',
    manualMoodWeather: 'neutral',
    manualMoods: ['neutral'],
    writingMode: 'free-write',
    sensory: {
      locationLabel: '',
      sounds: '',
      smells: '',
      energyLevel: 5,
      bodyState: '',
    },
    isLockbox: false,
    collectionIds: [],
    journalIds: [],
    photos: [],
    reflections: [],
  };
  Object.assign(entry, overrides);
  return entry;
}

const reflectionPhoto: DiaryPhoto = {
  id: '33333333-3333-4333-8333-333333333333',
  uri: 'file:///reflection.jpg',
  width: 1200,
  height: 800,
  createdAt: '2026-08-29T01:00:00.000Z',
};

function ActionsHarness({
  initialEntry = createEntry(),
  editTitle = 'Updated title',
  saveDiaryEntry = jest.fn<ReturnType<DiaryActions['saveDiaryEntry']>, Parameters<DiaryActions['saveDiaryEntry']>>(),
  deleteDiaryEntry = jest.fn<ReturnType<DiaryActions['deleteDiaryEntry']>, Parameters<DiaryActions['deleteDiaryEntry']>>(),
  addReflection = jest.fn<ReturnType<DiaryActions['addReflection']>, Parameters<DiaryActions['addReflection']>>(),
  deleteReflection = jest.fn<ReturnType<DiaryActions['deleteReflection']>, Parameters<DiaryActions['deleteReflection']>>(),
  toggleMemoryReaction = jest.fn<ReturnType<DiaryActions['toggleMemoryReaction']>, Parameters<DiaryActions['toggleMemoryReaction']>>(),
  setShowPremiumModal = jest.fn(),
  navigateBack = jest.fn(),
}: {
  readonly initialEntry?: DiaryEntry | null;
  readonly editTitle?: string;
  readonly saveDiaryEntry?: DiaryActions['saveDiaryEntry'];
  readonly deleteDiaryEntry?: DiaryActions['deleteDiaryEntry'];
  readonly addReflection?: DiaryActions['addReflection'];
  readonly deleteReflection?: DiaryActions['deleteReflection'];
  readonly toggleMemoryReaction?: DiaryActions['toggleMemoryReaction'];
  readonly setShowPremiumModal?: (isVisible: boolean) => void;
  readonly navigateBack?: () => void;
}) {
  const setEntry = jest.fn();
  const setIsEditing = jest.fn();
  const setIsSaving = jest.fn();
  const setShowFormattingTools = jest.fn();
  const setShowReflections = jest.fn();
  const setShowMemoryReactionPicker = jest.fn();
  const dismissEntryKeyboard = jest.fn();
  const updatedEntry = createEntry({ title: editTitle.trim() });
  const actions = useEntryDetailActions({
    entry: initialEntry,
    editTitle,
    buildUpdatedEntry: () => updatedEntry,
    setEntry,
    setIsEditing,
    setIsSaving,
    setShowPremiumModal,
    setShowFormattingTools,
    setShowReflections,
    setShowMemoryReactionPicker,
    dismissEntryKeyboard,
    navigateBack,
    saveDiaryEntry,
    deleteDiaryEntry,
    addReflection,
    deleteReflection,
    toggleMemoryReaction,
    t,
  });

  return (
    <>
      <TouchableOpacity testID="save-entry" onPress={actions.handleSaveEdit}>
        <Text>Save</Text>
      </TouchableOpacity>
      <TouchableOpacity testID="delete-entry" onPress={actions.handleDelete}>
        <Text>Delete</Text>
      </TouchableOpacity>
      <TouchableOpacity testID="add-reflection" onPress={() => void actions.handleAddReflection(initialEntry?.id ?? 'missing', '  A thought.  ', reflectionPhoto)}>
        <Text>Add reflection</Text>
      </TouchableOpacity>
      <TouchableOpacity testID="toggle-reaction" onPress={() => void actions.handleToggleMemoryReaction('cherish')}>
        <Text>React</Text>
      </TouchableOpacity>
      <Text testID="entry-id">{initialEntry?.id ?? 'none'}</Text>
    </>
  );
}

describe('useEntryDetailActions', () => {
  beforeEach(() => {
    jest.spyOn(Alert, 'alert').mockImplementation(jest.fn());
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('saves a valid edit and exits edit mode', async () => {
    const saveDiaryEntry = jest.fn<ReturnType<DiaryActions['saveDiaryEntry']>, Parameters<DiaryActions['saveDiaryEntry']>>();
    saveDiaryEntry.mockResolvedValue({ success: true, data: createEntry({ title: 'Updated title' }) });
    const { getByTestId } = await render(<ActionsHarness saveDiaryEntry={saveDiaryEntry} />);

    await act(async () => {
      fireEvent.press(getByTestId('save-entry'));
    });

    expect(saveDiaryEntry).toHaveBeenCalledWith(expect.objectContaining({ title: 'Updated title' }));
  });

  it('prompts for a title before saving', async () => {
    const saveDiaryEntry = jest.fn<ReturnType<DiaryActions['saveDiaryEntry']>, Parameters<DiaryActions['saveDiaryEntry']>>();
    const { getByTestId } = await render(<ActionsHarness editTitle="  " saveDiaryEntry={saveDiaryEntry} />);

    await act(async () => {
      fireEvent.press(getByTestId('save-entry'));
    });

    expect(saveDiaryEntry).not.toHaveBeenCalled();
    expect(Alert.alert).toHaveBeenCalledWith('entryTitleRequiredTitle', 'entryEditTitleRequiredMessage');
  });

  it('adds a trimmed reflection with the selected photo', async () => {
    const updatedEntry = createEntry({ reflections: [{ id: '22222222-2222-4222-8222-222222222222', text: 'A thought.', createdAt: '2026-08-29T01:00:00.000Z', updatedAt: '2026-08-29T01:00:00.000Z', photo: reflectionPhoto }] });
    const addReflection = jest.fn<ReturnType<DiaryActions['addReflection']>, Parameters<DiaryActions['addReflection']>>();
    addReflection.mockResolvedValue({ success: true, data: updatedEntry });
    const { getByTestId } = await render(<ActionsHarness addReflection={addReflection} />);

    await act(async () => {
      fireEvent.press(getByTestId('add-reflection'));
    });

    expect(addReflection).toHaveBeenCalledWith('11111111-1111-4111-8111-111111111111', 'A thought.', reflectionPhoto);
  });

  it('replaces the entry after selecting a memory reaction', async () => {
    const updatedEntry = createEntry({ memoryReactions: ['cherish'] });
    const toggleMemoryReaction = jest.fn<ReturnType<DiaryActions['toggleMemoryReaction']>, Parameters<DiaryActions['toggleMemoryReaction']>>();
    toggleMemoryReaction.mockResolvedValue({ success: true, data: updatedEntry });
    const { getByTestId } = await render(<ActionsHarness toggleMemoryReaction={toggleMemoryReaction} />);

    await act(async () => {
      fireEvent.press(getByTestId('toggle-reaction'));
    });

    expect(toggleMemoryReaction).toHaveBeenCalledWith('11111111-1111-4111-8111-111111111111', 'cherish');
  });

  it('confirms before deleting an entry', async () => {
    const deleteDiaryEntry = jest.fn<ReturnType<DiaryActions['deleteDiaryEntry']>, Parameters<DiaryActions['deleteDiaryEntry']>>();
    deleteDiaryEntry.mockResolvedValue({ success: true, data: true });
    const navigateBack = jest.fn();
    const { getByTestId } = await render(<ActionsHarness deleteDiaryEntry={deleteDiaryEntry} navigateBack={navigateBack} />);

    await act(async () => {
      fireEvent.press(getByTestId('delete-entry'));
    });

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        'entryDeleteTitle',
        'entryDeleteMessage',
        expect.any(Array),
      );
    });

    await act(async () => {
      const alertButtons = (Alert.alert as jest.Mock).mock.calls[0][2];
      await alertButtons[1].onPress();
    });

    await waitFor(() => {
      expect(deleteDiaryEntry).toHaveBeenCalledWith('11111111-1111-4111-8111-111111111111');
    });
    expect(navigateBack).toHaveBeenCalled();
  });
});
