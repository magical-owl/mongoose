import { createRef } from 'react';
import { renderWithProviders } from '@tests/helpers';
import { RichTextEditor, type RichTextEditorHandle } from '@/shared/components/RichTextEditor';

const mockSendAction = jest.fn();
const mockCommandDOM = jest.fn();
const mockSetContentHTML = jest.fn();
const mockInsertHTML = jest.fn();
const mockDismissKeyboard = jest.fn();

jest.mock('react-native-pell-rich-editor', () => {
  const React = jest.requireActual<typeof import('react')>('react');
  const { View } = jest.requireActual<typeof import('react-native')>('react-native');
  const MockRichEditor = React.forwardRef((_props: unknown, ref: React.Ref<unknown>) => {
    React.useImperativeHandle(ref, () => ({
      sendAction: mockSendAction,
      commandDOM: mockCommandDOM,
      setContentHTML: mockSetContentHTML,
      insertHTML: mockInsertHTML,
      dismissKeyboard: mockDismissKeyboard,
    }));

    return React.createElement(View, { testID: 'mock-rich-editor' });
  });
  MockRichEditor.displayName = 'MockRichEditor';

  return {
    actions: {
      content: 'content',
      setBold: 'bold',
      setItalic: 'italic',
      heading2: 'heading2',
      insertBulletsList: 'insertBulletsList',
      blockquote: 'blockquote',
      code: 'code',
      alignLeft: 'justifyLeft',
      alignCenter: 'justifyCenter',
      alignRight: 'justifyRight',
      alignFull: 'justifyFull',
    },
    RichEditor: MockRichEditor,
    RichToolbar: () => React.createElement(View, { testID: 'mock-rich-toolbar' }),
  };
});

describe('RichTextEditor', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('saves and restores the selected range before applying inline formatting', async () => {
    const ref = createRef<RichTextEditorHandle>();

    await renderWithProviders(
      <RichTextEditor
        ref={ref}
        value="<p>Hello world</p>"
        onChangeText={jest.fn()}
      />,
      { wrapperOptions: { initialThemeMode: 'dark' } },
    );

    mockCommandDOM.mockClear();
    ref.current?.prepareFormat();
    ref.current?.applyFormat('bold');

    expect(mockCommandDOM).toHaveBeenNthCalledWith(1, expect.stringContaining('cloneRange'));
    expect(mockCommandDOM).toHaveBeenNthCalledWith(2, expect.stringContaining('__mongooseSavedSelectionRange'));
    expect(mockSendAction).toHaveBeenCalledWith('bold', 'result');
  });

  it('shows a loading indicator while the native editor initializes', async () => {
    const { getByTestId, queryByText } = await renderWithProviders(
      <RichTextEditor
        value={'<p>A <strong>visible</strong> draft.</p><script>alert("x")</script>'}
        onChangeText={jest.fn()}
      />,
      { wrapperOptions: { initialThemeMode: 'dark' } },
    );

    expect(getByTestId('rich-text-editor-loading-indicator')).toBeTruthy();
    expect(queryByText('visible')).toBeNull();
    expect(queryByText('alert("x")')).toBeNull();
  });
});
