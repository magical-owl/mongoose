import { createRef } from 'react';
import { act, fireEvent } from '@testing-library/react-native';
import { EntryEditBodyForm } from '@/features/diary/components/EntryEditBodyForm';
import type { PlacedSticker } from '@/features/diary/domain/Sticker';
import type { RichTextEditorHandle } from '@shared/components/RichTextEditor';
import { useAppStore } from '@/stores/useAppStore';
import { renderWithProviders } from '@tests/helpers';

jest.mock('@shared/components/RichTextEditor', () => {
  const React = jest.requireActual<typeof import('react')>('react');
  const { Text, TouchableOpacity } = jest.requireActual<typeof import('react-native')>('react-native');
  const MockRichTextEditor = React.forwardRef((props: {
    readonly onChangeText: (text: string) => void;
    readonly onHeightChange?: (height: number) => void;
    readonly placeholderColor?: string;
  }, ref: React.Ref<unknown>) => {
    React.useImperativeHandle(ref, () => ({
      applyFormat: jest.fn(),
      dismissKeyboard: jest.fn(),
      insertHTML: jest.fn(),
      prepareFormat: jest.fn(),
      setBodyStyle: jest.fn(),
      setContentHTML: jest.fn(),
    }));

    return (
      <TouchableOpacity
        testID="mock-entry-edit-rich-text-editor"
        accessibilityValue={{ text: props.placeholderColor }}
        onPress={() => {
          props.onChangeText('<p>Updated body.</p>');
          props.onHeightChange?.(240);
        }}
      >
        <Text>Editor</Text>
      </TouchableOpacity>
    );
  });
  MockRichTextEditor.displayName = 'MockRichTextEditor';

  return {
    RichTextEditor: MockRichTextEditor,
  };
});

jest.mock('@/features/diary/components/StickerCanvasItem', () => {
  const { Text, View } = jest.requireActual<typeof import('react-native')>('react-native');

  return {
    StickerCanvasItem: ({ sticker, testID }: { readonly sticker: PlacedSticker; readonly testID?: string }) => (
      <View testID={testID}>
        <Text>{sticker.id}</Text>
      </View>
    ),
  };
});

jest.mock('@/features/diary/components/DiaryDatePicker', () => {
  const { Text, TouchableOpacity } = jest.requireActual<typeof import('react-native')>('react-native');

  return {
    DiaryDatePicker: () => (
      <TouchableOpacity testID="mock-entry-edit-date-picker">
        <Text>Date</Text>
      </TouchableOpacity>
    ),
  };
});

function createSticker(overrides: Partial<PlacedSticker> = {}): PlacedSticker {
  return {
    id: '11111111-1111-4111-8111-111111111111',
    stickerId: 'text-sticker',
    category: 'text',
    x: 12,
    y: 18,
    scale: 1,
    rotation: 0,
    zIndex: 1,
    behindText: false,
    text: 'note',
    ...overrides,
  };
}

describe('EntryEditBodyForm', () => {
  beforeEach(() => {
    useAppStore.getState().reset();
  });

  it('renders editable entry fields and routes body changes upward', async () => {
    const editorRef = createRef<RichTextEditorHandle>();
    const onChangeTitle = jest.fn();
    const onChangeContent = jest.fn();
    const onChangeBodyContentHeight = jest.fn();

    const { getByPlaceholderText, getByTestId } = await renderWithProviders(
      <EntryEditBodyForm
        editorRef={editorRef}
        editDate={new Date(2026, 7, 29)}
        onChangeDate={jest.fn()}
        editTitle="Original title"
        onChangeTitle={onChangeTitle}
        editEntryType="diary"
        onChangeEntryType={jest.fn()}
        editPhotos={[]}
        editMomentPhotoLayout="auto"
        onChangeMomentPhotoLayout={jest.fn()}
        onAddMomentPhotos={jest.fn()}
        onRemoveMomentPhoto={jest.fn()}
        editContent="<p>Original body.</p>"
        onChangeContent={onChangeContent}
        editBodyFontFamily="system"
        editBodyTextColor={undefined}
        bodyCanvasHeight={260}
        showBodyStickerBounds
        bodyLayout={{ y: 0, width: 390, height: 260 }}
        onChangeBodyLayout={jest.fn()}
        onChangeBodyContentHeight={onChangeBodyContentHeight}
        behindStickers={[createSticker({ id: '22222222-2222-4222-8222-222222222222', behindText: true })]}
        foregroundStickers={[createSticker({ id: '33333333-3333-4333-8333-333333333333' })]}
        onUpdateSticker={jest.fn()}
        onDeleteSticker={jest.fn()}
        onStickerDragStateChange={jest.fn()}
      />,
      { wrapperOptions: { initialThemeMode: 'dark' } },
    );

    await fireEvent.changeText(getByPlaceholderText('Entry title...'), 'Changed title');
    await fireEvent.press(getByTestId('mock-entry-edit-rich-text-editor'));

    expect(onChangeTitle).toHaveBeenCalledWith('Changed title');
    expect(onChangeContent).toHaveBeenCalledWith('<p>Updated body.</p>');
    expect(onChangeBodyContentHeight).toHaveBeenCalledWith(240);
    expect(getByTestId('entry-edit-body-sticker-canvas')).toBeTruthy();
    expect(getByTestId('entry-edit-sticker-22222222-2222-4222-8222-222222222222')).toBeTruthy();
    expect(getByTestId('entry-edit-sticker-33333333-3333-4333-8333-333333333333')).toBeTruthy();
  });

  it('uses a diary-readable placeholder color instead of theme tertiary text', async () => {
    const editorRef = createRef<RichTextEditorHandle>();
    const { getByPlaceholderText, getByTestId } = await renderWithProviders(
      <EntryEditBodyForm
        editorRef={editorRef}
        editDate={new Date(2026, 7, 29)}
        onChangeDate={jest.fn()}
        editTitle=""
        onChangeTitle={jest.fn()}
        editEntryType="diary"
        onChangeEntryType={jest.fn()}
        editPhotos={[]}
        editMomentPhotoLayout="auto"
        onChangeMomentPhotoLayout={jest.fn()}
        onAddMomentPhotos={jest.fn()}
        onRemoveMomentPhoto={jest.fn()}
        editContent=""
        onChangeContent={jest.fn()}
        editBodyFontFamily="system"
        editBodyTextColor={undefined}
        bodyCanvasHeight={260}
        showBodyStickerBounds={false}
        bodyLayout={{ y: 0, width: 390, height: 260 }}
        onChangeBodyLayout={jest.fn()}
        onChangeBodyContentHeight={jest.fn()}
        behindStickers={[]}
        foregroundStickers={[]}
        onUpdateSticker={jest.fn()}
        onDeleteSticker={jest.fn()}
        onStickerDragStateChange={jest.fn()}
      />,
      { wrapperOptions: { initialThemeMode: 'dark' } },
    );

    expect(getByPlaceholderText('Entry title...').props.placeholderTextColor).toBe('#6B4E3D');
    expect(getByTestId('mock-entry-edit-rich-text-editor').props.accessibilityValue.text).toBe('#6B4E3D');
  });

  it('shows the cover-photo hint for moment entries only', async () => {
    const editorRef = createRef<RichTextEditorHandle>();
    const props = {
      editorRef,
      editDate: new Date(2026, 7, 29),
      onChangeDate: jest.fn(),
      editTitle: 'Original title',
      onChangeTitle: jest.fn(),
      editEntryType: 'moment' as const,
      onChangeEntryType: jest.fn(),
      editPhotos: [],
      editMomentPhotoLayout: 'auto' as const,
      onChangeMomentPhotoLayout: jest.fn(),
      onAddMomentPhotos: jest.fn(),
      onRemoveMomentPhoto: jest.fn(),
      editContent: '<p>Original body.</p>',
      onChangeContent: jest.fn(),
      editBodyFontFamily: 'system' as const,
      editBodyTextColor: undefined,
      bodyCanvasHeight: 260,
      showBodyStickerBounds: false,
      bodyLayout: { y: 0, width: 390, height: 260 },
      onChangeBodyLayout: jest.fn(),
      onChangeBodyContentHeight: jest.fn(),
      behindStickers: [],
      foregroundStickers: [],
      onUpdateSticker: jest.fn(),
      onDeleteSticker: jest.fn(),
      onStickerDragStateChange: jest.fn(),
    };

    const { getByTestId, queryByTestId, rerender } = await renderWithProviders(
      <EntryEditBodyForm {...props} />,
      { wrapperOptions: { initialThemeMode: 'dark' } },
    );

    expect(getByTestId('entry-edit-moment-cover-hint')).toBeTruthy();
    expect(getByTestId('entry-edit-moment-cover-hint').props.children).toBeTruthy();

    await rerender(<EntryEditBodyForm {...props} editEntryType="diary" />);

    expect(queryByTestId('entry-edit-moment-cover-hint')).toBeNull();
  });

  it('re-shows the moment cover hint when tips are enabled again', async () => {
    const editorRef = createRef<RichTextEditorHandle>();

    useAppStore.getState().setShowTips(false);

    const props = {
      editorRef,
      editDate: new Date(2026, 7, 29),
      onChangeDate: jest.fn(),
      editTitle: 'Original title',
      onChangeTitle: jest.fn(),
      editEntryType: 'moment' as const,
      onChangeEntryType: jest.fn(),
      editPhotos: [],
      editMomentPhotoLayout: 'auto' as const,
      onChangeMomentPhotoLayout: jest.fn(),
      onAddMomentPhotos: jest.fn(),
      onRemoveMomentPhoto: jest.fn(),
      editContent: '<p>Original body.</p>',
      onChangeContent: jest.fn(),
      editBodyFontFamily: 'system' as const,
      editBodyTextColor: undefined,
      bodyCanvasHeight: 260,
      showBodyStickerBounds: false,
      bodyLayout: { y: 0, width: 390, height: 260 },
      onChangeBodyLayout: jest.fn(),
      onChangeBodyContentHeight: jest.fn(),
      behindStickers: [],
      foregroundStickers: [],
      onUpdateSticker: jest.fn(),
      onDeleteSticker: jest.fn(),
      onStickerDragStateChange: jest.fn(),
    };

    const { getByTestId, queryByTestId } = await renderWithProviders(
      <EntryEditBodyForm {...props} />,
      { wrapperOptions: { initialThemeMode: 'dark' } },
    );

    expect(queryByTestId('entry-edit-moment-cover-hint')).toBeNull();

    await act(async () => {
      useAppStore.getState().setShowTips(true);
    });

    expect(getByTestId('entry-edit-moment-cover-hint')).toBeTruthy();
  });
});
