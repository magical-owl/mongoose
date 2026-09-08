import { createRef } from 'react';
import { fireEvent } from '@testing-library/react-native';
import { EntryEditBodyForm } from '@/features/diary/components/EntryEditBodyForm';
import type { PlacedSticker } from '@/features/diary/domain/Sticker';
import type { RichTextEditorHandle } from '@shared/components/RichTextEditor';
import { renderWithProviders } from '@tests/helpers';

jest.mock('@shared/components/RichTextEditor', () => {
  const React = jest.requireActual<typeof import('react')>('react');
  const { Text, TouchableOpacity } = jest.requireActual<typeof import('react-native')>('react-native');
  const MockRichTextEditor = React.forwardRef((props: {
    readonly onChangeText: (text: string) => void;
    readonly onHeightChange?: (height: number) => void;
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

    fireEvent.changeText(getByPlaceholderText('Entry title...'), 'Changed title');
    fireEvent.press(getByTestId('mock-entry-edit-rich-text-editor'));

    expect(onChangeTitle).toHaveBeenCalledWith('Changed title');
    expect(onChangeContent).toHaveBeenCalledWith('<p>Updated body.</p>');
    expect(onChangeBodyContentHeight).toHaveBeenCalledWith(240);
    expect(getByTestId('entry-edit-body-sticker-canvas')).toBeTruthy();
    expect(getByTestId('entry-edit-sticker-22222222-2222-4222-8222-222222222222')).toBeTruthy();
    expect(getByTestId('entry-edit-sticker-33333333-3333-4333-8333-333333333333')).toBeTruthy();
  });
});
