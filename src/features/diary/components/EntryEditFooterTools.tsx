import { View } from 'react-native';
import { IconCircleButton } from '@shared/components/IconCircleButton';
import { useTheme } from '@/providers/ThemeProvider';
import { useTranslation } from '@/localization/i18n';
import {
  DiaryEntryEditorFooter,
  diaryEntryEditorChromeStyles,
} from '@/features/diary/components/DiaryEntryEditorChrome';

interface EntryEditFooterToolsProps {
  readonly bottom: number;
  readonly wordCount: number;
  readonly stickerCount: number;
  readonly showFormattingTools: boolean;
  readonly showKeyboardDismiss: boolean;
  readonly onOpenMetadata: () => void;
  readonly onOpenFormatting: () => void;
  readonly onOpenTemplatePicker: () => void;
  readonly onOpenPaperBackgroundPicker: () => void;
  readonly onAddPhotoSticker: () => void;
  readonly onAddTextSticker: () => void;
  readonly onOpenStickerPicker: () => void;
  readonly onDismissKeyboard: () => void;
}

export function EntryEditFooterTools({
  bottom,
  wordCount,
  stickerCount,
  showFormattingTools,
  showKeyboardDismiss,
  onOpenMetadata,
  onOpenFormatting,
  onOpenTemplatePicker,
  onOpenPaperBackgroundPicker,
  onAddPhotoSticker,
  onAddTextSticker,
  onOpenStickerPicker,
  onDismissKeyboard,
}: EntryEditFooterToolsProps) {
  const theme = useTheme();
  const t = useTranslation();

  return (
    <DiaryEntryEditorFooter
      bottom={bottom}
      wordCount={wordCount}
      trailing={(
        <IconCircleButton
          icon="tune-variant"
          size="sm"
          surface="transparent"
          onPress={onOpenMetadata}
          accessibilityLabel={t('entryDetailsA11y')}
          testID="entry-edit-metadata-button"
        />
      )}
    >
      <View>
        <IconCircleButton
          icon="format-text"
          size="sm"
          active={showFormattingTools}
          surface="transparent"
          onPress={onOpenFormatting}
          accessibilityLabel={showFormattingTools ? t('entryHideFormattingA11y') : t('entryShowFormattingA11y')}
        />
      </View>
      <View style={[diaryEntryEditorChromeStyles.toolbarDivider, { backgroundColor: theme.colors.border }]} />
      <IconCircleButton
        icon="file-document-edit-outline"
        size="sm"
        surface="transparent"
        onPress={onOpenTemplatePicker}
        accessibilityLabel={t('entryChooseTemplateA11y')}
      />
      <IconCircleButton
        icon="palette-outline"
        size="sm"
        surface="transparent"
        onPress={onOpenPaperBackgroundPicker}
        accessibilityLabel={t('entryPaperBackgroundPickerA11y')}
        testID="entry-edit-paper-background-button"
      />
      <View style={diaryEntryEditorChromeStyles.toolbarPlainGroup}>
        <IconCircleButton
          icon="image-outline"
          size="sm"
          surface="transparent"
          onPress={onAddPhotoSticker}
          accessibilityLabel={t('entryChoosePhotoA11y')}
          testID="entry-edit-add-photo-sticker-button"
        />
        <IconCircleButton
          icon="format-textbox"
          size="sm"
          surface="transparent"
          onPress={onAddTextSticker}
          accessibilityLabel={t('entryAddTextStickerA11y')}
        />
        <IconCircleButton
          icon="sticker-outline"
          size="sm"
          surface="transparent"
          onPress={onOpenStickerPicker}
          accessibilityLabel={`${t('entryAddStickerA11y')} ${stickerCount} ${t('entryStickerPlacedA11y')}`}
        />
      </View>
      {showKeyboardDismiss ? (
        <IconCircleButton
          icon="keyboard-close"
          size="sm"
          surface="transparent"
          onPress={onDismissKeyboard}
          accessibilityLabel={t('entryDismissKeyboardA11y')}
        />
      ) : null}
    </DiaryEntryEditorFooter>
  );
}
