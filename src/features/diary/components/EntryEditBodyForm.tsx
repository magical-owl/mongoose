import type { Dispatch, RefObject, SetStateAction } from 'react';
import { StyleSheet, TextInput as NativeTextInput, View } from 'react-native';
import { useTheme } from '@providers/ThemeProvider';
import { DiaryDatePicker } from '@/features/diary/components/DiaryDatePicker';
import { StickerCanvasItem } from '@/features/diary/components/StickerCanvasItem';
import type { PlacedSticker } from '@/features/diary/domain/Sticker';
import type { DiaryBodyFontFamily, DiaryBodyTextColor } from '@/features/diary/domain/DiaryBodyStyle';
import type { StickerCanvasLayout } from '@/features/diary/hooks/useEntryStickerEditing';
import { RichTextEditor, type RichTextEditorHandle } from '@shared/components/RichTextEditor';
import { useTranslation } from '@/localization/i18n';
import { resolveAppFontFamilyForWebContent } from '@/theme/fonts';
import {
  ENTRY_EDITOR_BODY_FONT_SIZE,
  ENTRY_EDITOR_BODY_LINE_HEIGHT,
  ENTRY_EDITOR_BODY_MIN_HEIGHT,
} from '@/features/diary/components/DiaryEntryEditorChrome';
import { ENTRY_DETAIL_EDITABLE_STICKER_HORIZONTAL_EDGE_ALLOWANCE_RATIO } from '@/features/diary/components/EntryDetailLayout';

interface EntryEditBodyFormProps {
  readonly editorRef: RefObject<RichTextEditorHandle | null>;
  readonly editDate: Date;
  readonly onChangeDate: (date: Date) => void;
  readonly editTitle: string;
  readonly onChangeTitle: (title: string) => void;
  readonly editContent: string;
  readonly onChangeContent: (content: string) => void;
  readonly editBodyFontFamily: DiaryBodyFontFamily;
  readonly editBodyTextColor: DiaryBodyTextColor | undefined;
  readonly bodyCanvasHeight: number;
  readonly showBodyStickerBounds: boolean;
  readonly bodyLayout: StickerCanvasLayout;
  readonly onChangeBodyLayout: Dispatch<SetStateAction<StickerCanvasLayout>>;
  readonly onChangeBodyContentHeight: (height: number) => void;
  readonly behindStickers: readonly PlacedSticker[];
  readonly foregroundStickers: readonly PlacedSticker[];
  readonly onUpdateSticker: (sticker: PlacedSticker) => void;
  readonly onDeleteSticker: (stickerId: string) => void;
  readonly onStickerDragStateChange: (isDragging: boolean) => void;
}

export function EntryEditBodyForm({
  editorRef,
  editDate,
  onChangeDate,
  editTitle,
  onChangeTitle,
  editContent,
  onChangeContent,
  editBodyFontFamily,
  editBodyTextColor,
  bodyCanvasHeight,
  showBodyStickerBounds,
  bodyLayout,
  onChangeBodyLayout,
  onChangeBodyContentHeight,
  behindStickers,
  foregroundStickers,
  onUpdateSticker,
  onDeleteSticker,
  onStickerDragStateChange,
}: EntryEditBodyFormProps) {
  const theme = useTheme();
  const t = useTranslation();
  const placeholderColor = theme.colors.stickerControlText;

  return (
    <>
      <DiaryDatePicker value={editDate} onChange={onChangeDate} maximumDate={new Date()} variant="entryHero" />
      <NativeTextInput
        value={editTitle}
        onChangeText={onChangeTitle}
        placeholder={t('entryTitlePlaceholder')}
        placeholderTextColor={placeholderColor}
        style={[styles.titleInput, { color: theme.colors.text }]}
        multiline
        returnKeyType="next"
        accessibilityLabel={t('entryTitleA11y')}
      />
      <View style={[styles.divider, { backgroundColor: theme.colors.borderLight }]} />
      <View
        testID="entry-edit-body-sticker-canvas"
        style={[
          styles.bodyStickerCanvas,
          { minHeight: bodyCanvasHeight },
          showBodyStickerBounds && [
            styles.bodyStickerCanvasOutlined,
            { borderColor: theme.colors.tint + '99', backgroundColor: theme.colors.tint + '08' },
          ],
        ]}
        onLayout={(event) => {
          const { y, width, height } = event.nativeEvent.layout;
          onChangeBodyLayout((current) => (
            current.y === y && current.width === width && current.height === height
              ? current
              : { y, width, height }
          ));
        }}
      >
        {behindStickers.map((sticker) => (
          <StickerCanvasItem
            key={sticker.id}
            sticker={sticker}
            onUpdate={onUpdateSticker}
            onDelete={onDeleteSticker}
            isEditable
            onDragStateChange={onStickerDragStateChange}
            bounds={bodyLayout}
            allowBottomOverflow
            horizontalEdgeAllowanceRatio={ENTRY_DETAIL_EDITABLE_STICKER_HORIZONTAL_EDGE_ALLOWANCE_RATIO}
            testID={`entry-edit-sticker-${sticker.id}`}
          />
        ))}
        <View style={styles.entryBodyLayer}>
          <RichTextEditor
            ref={editorRef}
            value={editContent}
            onChangeText={onChangeContent}
            onHeightChange={(height) => onChangeBodyContentHeight(Math.max(ENTRY_EDITOR_BODY_MIN_HEIGHT, height))}
            placeholder={t('entryEditContentPlaceholder')}
            placeholderColor={placeholderColor}
            textColor={editBodyTextColor}
            fontFamily={resolveAppFontFamilyForWebContent(editBodyFontFamily)}
            fontSize={ENTRY_EDITOR_BODY_FONT_SIZE}
            lineHeight={ENTRY_EDITOR_BODY_LINE_HEIGHT}
            fontWeight="600"
            minHeight={bodyCanvasHeight}
            showToolbar={false}
            accessibilityLabel={t('entryContentA11y')}
          />
        </View>
        {foregroundStickers.map((sticker) => (
          <StickerCanvasItem
            key={sticker.id}
            sticker={sticker}
            onUpdate={onUpdateSticker}
            onDelete={onDeleteSticker}
            isEditable
            onDragStateChange={onStickerDragStateChange}
            bounds={bodyLayout}
            allowBottomOverflow
            horizontalEdgeAllowanceRatio={ENTRY_DETAIL_EDITABLE_STICKER_HORIZONTAL_EDGE_ALLOWANCE_RATIO}
            testID={`entry-edit-sticker-${sticker.id}`}
          />
        ))}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  bodyStickerCanvas: {
    minHeight: ENTRY_EDITOR_BODY_MIN_HEIGHT,
    position: 'relative',
    overflow: 'hidden',
  },
  bodyStickerCanvasOutlined: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 8,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginBottom: 18,
  },
  entryBodyLayer: {
    position: 'relative',
    zIndex: 2,
    elevation: 2,
  },
  titleInput: {
    fontSize: 30,
    fontStyle: 'italic',
    fontWeight: '600',
    lineHeight: 40,
    padding: 0,
    marginBottom: 2,
  },
});
