import { useCallback, useEffect, useState, type RefObject } from 'react';
import { Keyboard, Platform } from 'react-native';
import type { RichTextEditorHandle } from '@shared/components/RichTextEditor';

interface UseEntryDetailUiStateOptions {
  readonly editorRef: RefObject<RichTextEditorHandle | null>;
}

export function useEntryDetailUiState({
  editorRef,
}: UseEntryDetailUiStateOptions) {
  const [showEntryMetadata, setShowEntryMetadata] = useState(false);
  const [showStickerPicker, setShowStickerPicker] = useState(false);
  const [showTemplatePicker, setShowTemplatePicker] = useState(false);
  const [showPaperBackgroundPicker, setShowPaperBackgroundPicker] = useState(false);
  const [showFormattingTools, setShowFormattingTools] = useState(false);
  const [showReflections, setShowReflections] = useState(false);
  const [showMemoryReactionPicker, setShowMemoryReactionPicker] = useState(false);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    const show = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (event) => setKeyboardHeight(event.endCoordinates.height),
    );
    const hide = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => setKeyboardHeight(0),
    );

    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  const dismissEntryKeyboard = useCallback(() => {
    editorRef.current?.dismissKeyboard();
    Keyboard.dismiss();
  }, [editorRef]);

  const closeFormattingTools = useCallback(() => {
    setShowFormattingTools(false);
  }, []);

  const openFormattingTools = useCallback(() => {
    editorRef.current?.prepareFormat();
    setShowFormattingTools(true);
  }, [editorRef]);

  const resetTransientUi = useCallback(() => {
    setShowFormattingTools(false);
    setShowReflections(false);
    setShowMemoryReactionPicker(false);
  }, []);

  return {
    showEntryMetadata,
    setShowEntryMetadata,
    showStickerPicker,
    setShowStickerPicker,
    showTemplatePicker,
    setShowTemplatePicker,
    showPaperBackgroundPicker,
    setShowPaperBackgroundPicker,
    showFormattingTools,
    setShowFormattingTools,
    showReflections,
    setShowReflections,
    showMemoryReactionPicker,
    setShowMemoryReactionPicker,
    showPremiumModal,
    setShowPremiumModal,
    keyboardHeight,
    dismissEntryKeyboard,
    closeFormattingTools,
    openFormattingTools,
    resetTransientUi,
  };
}
