import { Text, TouchableOpacity } from 'react-native';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { createRef } from 'react';
import type { RichEditor } from 'react-native-pell-rich-editor';
import type { RichTextEditorHandle } from '@shared/components/RichTextEditor';
import { useEntryDetailUiState } from '@/features/diary/hooks/useEntryDetailUiState';

function UiStateHarness() {
  const editorRef = createRef<RichTextEditorHandle>();
  editorRef.current = {
    applyFormat: jest.fn(),
    dismissKeyboard: jest.fn(),
    insertHTML: jest.fn(),
    prepareFormat: jest.fn(),
    restoreSelection: jest.fn(),
    setBodyStyle: jest.fn(),
    setContentHTML: jest.fn(),
    togglePreview: jest.fn(),
    richTextRef: createRef<RichEditor>(),
  };
  const ui = useEntryDetailUiState({ editorRef });

  return (
    <>
      <Text testID="formatting-state">{ui.showFormattingTools ? 'open' : 'closed'}</Text>
      <Text testID="reflections-state">{ui.showReflections ? 'open' : 'closed'}</Text>
      <Text testID="reaction-state">{ui.showMemoryReactionPicker ? 'open' : 'closed'}</Text>
      <TouchableOpacity testID="open-formatting" onPress={ui.openFormattingTools}>
        <Text>Open formatting</Text>
      </TouchableOpacity>
      <TouchableOpacity testID="open-transient" onPress={() => {
        ui.setShowReflections(true);
        ui.setShowMemoryReactionPicker(true);
      }}>
        <Text>Open transient</Text>
      </TouchableOpacity>
      <TouchableOpacity testID="reset-transient" onPress={ui.resetTransientUi}>
        <Text>Reset transient</Text>
      </TouchableOpacity>
      <TouchableOpacity testID="dismiss-keyboard" onPress={ui.dismissEntryKeyboard}>
        <Text>Dismiss keyboard</Text>
      </TouchableOpacity>
    </>
  );
}

describe('useEntryDetailUiState', () => {
  it('groups transient entry detail UI state controls', async () => {
    const { getByTestId } = await render(<UiStateHarness />);

    await fireEvent.press(getByTestId('open-formatting'));
    await waitFor(() => {
      expect(getByTestId('formatting-state').props.children).toBe('open');
    });

    await fireEvent.press(getByTestId('open-transient'));
    await waitFor(() => {
      expect(getByTestId('reflections-state').props.children).toBe('open');
      expect(getByTestId('reaction-state').props.children).toBe('open');
    });

    await fireEvent.press(getByTestId('reset-transient'));
    await waitFor(() => {
      expect(getByTestId('formatting-state').props.children).toBe('closed');
      expect(getByTestId('reflections-state').props.children).toBe('closed');
      expect(getByTestId('reaction-state').props.children).toBe('closed');
    });

    await fireEvent.press(getByTestId('dismiss-keyboard'));
  });
});
