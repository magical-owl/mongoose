import { useState } from 'react';
import { View } from 'react-native';
import { IconCircleButton } from '@shared/components/IconCircleButton';
import { useTheme } from '@/providers/ThemeProvider';
import { useTranslation } from '@/localization/i18n';
import { EntryEditToolMenuModal } from '@/features/diary/components/EntryEditToolMenuModal';
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
  readonly onOpenStylePresetPicker: () => void;
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
  onOpenStylePresetPicker,
  onOpenPaperBackgroundPicker,
  onAddPhotoSticker,
  onAddTextSticker,
  onOpenStickerPicker,
  onDismissKeyboard,
}: EntryEditFooterToolsProps) {
  const theme = useTheme();
  const t = useTranslation();
  const [showCustomizeTools, setShowCustomizeTools] = useState(false);
  const [showInsertTools, setShowInsertTools] = useState(false);

  return (
    <>
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
        <IconCircleButton
          icon="fountain-pen-tip"
          size="sm"
          active={showFormattingTools}
          surface="transparent"
          onPress={onOpenFormatting}
          accessibilityLabel={showFormattingTools ? t('entryHideFormattingA11y') : t('entryShowFormattingA11y')}
        />
        <View style={[diaryEntryEditorChromeStyles.toolbarDivider, { backgroundColor: theme.colors.border }]} />
        <IconCircleButton
          icon="palette-outline"
          size="sm"
          surface="transparent"
          onPress={() => setShowCustomizeTools(true)}
          accessibilityLabel={t('entryCustomizeToolsA11y')}
          testID="entry-edit-customize-tools-button"
        />
        <IconCircleButton
          icon="plus-box-outline"
          size="sm"
          surface="transparent"
          onPress={() => setShowInsertTools(true)}
          accessibilityLabel={t('entryInsertToolsA11y')}
          testID="entry-edit-insert-tools-button"
        />
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
      <EntryEditToolMenuModal
        visible={showCustomizeTools}
        title={t('entryCustomizeToolsTitle')}
        accessibilityLabel={t('entryCustomizeToolsA11y')}
        onDismiss={() => setShowCustomizeTools(false)}
        actions={[
          {
            id: 'template',
            icon: 'notebook-edit-outline',
            label: t('entryToolTemplateLabel'),
            description: t('entryToolTemplateDescription'),
            onPress: onOpenTemplatePicker,
            testID: 'entry-edit-template-menu-action',
          },
          {
            id: 'style',
            icon: 'palette-outline',
            label: t('entryToolStyleLabel'),
            description: t('entryToolStyleDescription'),
            onPress: onOpenStylePresetPicker,
            testID: 'entry-edit-style-preset-button',
          },
          {
            id: 'paper',
            icon: 'brush-variant',
            label: t('entryToolPaperLabel'),
            description: t('entryToolPaperDescription'),
            onPress: onOpenPaperBackgroundPicker,
            testID: 'entry-edit-paper-background-button',
          },
        ]}
      />
      <EntryEditToolMenuModal
        visible={showInsertTools}
        title={t('entryInsertToolsTitle')}
        accessibilityLabel={t('entryInsertToolsA11y')}
        onDismiss={() => setShowInsertTools(false)}
        actions={[
          {
            id: 'photo-sticker',
            icon: 'image-plus',
            label: t('entryToolPhotoStickerLabel'),
            description: t('entryToolPhotoStickerDescription'),
            onPress: onAddPhotoSticker,
            testID: 'entry-edit-add-photo-sticker-button',
          },
          {
            id: 'text-sticker',
            icon: 'card-text-outline',
            label: t('entryToolTextStickerLabel'),
            description: t('entryToolTextStickerDescription'),
            onPress: onAddTextSticker,
          },
          {
            id: 'sticker',
            icon: 'sticker-plus-outline',
            label: t('entryToolStickerLabel'),
            description: `${t('entryToolStickerDescription')} ${stickerCount} ${t('entryStickerPlacedA11y')}`,
            onPress: onOpenStickerPicker,
          },
        ]}
      />
    </>
  );
}
