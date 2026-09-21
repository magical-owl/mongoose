import { useCallback, useMemo, useState, type Dispatch, type RefObject, type SetStateAction } from 'react';
import { Pressable, StyleSheet, TextInput as NativeTextInput, View, type GestureResponderEvent } from 'react-native';
import { useTheme } from '@providers/ThemeProvider';
import { DiaryDatePicker } from '@/features/diary/components/DiaryDatePicker';
import { StickerCanvasItem } from '@/features/diary/components/StickerCanvasItem';
import { MomentPhotoGrid } from '@/features/diary/components/MomentPhotoGrid';
import type { PlacedSticker } from '@/features/diary/domain/Sticker';
import type { DiaryEntryType, DiaryPhoto, MomentPhotoLayout } from '@/features/diary/domain/DiaryEntry';
import type { DiaryBodyFontFamily, DiaryBodyTextColor } from '@/features/diary/domain/DiaryBodyStyle';
import type { StickerCanvasLayout } from '@/features/diary/hooks/useEntryStickerEditing';
import { RichTextEditor, type RichTextEditorHandle } from '@shared/components/RichTextEditor';
import { Text } from '@/shared/components/Text';
import { useTranslation } from '@/localization/i18n';
import { resolveAppFontFamilyForWebContent } from '@/theme/fonts';
import {
  ENTRY_EDITOR_BODY_FONT_SIZE,
  ENTRY_EDITOR_BODY_LINE_HEIGHT,
  ENTRY_EDITOR_BODY_MIN_HEIGHT,
} from '@/features/diary/components/DiaryEntryEditorChrome';
import { ENTRY_DETAIL_EDITABLE_STICKER_HORIZONTAL_EDGE_ALLOWANCE_RATIO } from '@/features/diary/components/EntryDetailLayout';
import { getStickerTextAvoidanceInsets } from '@/features/diary/domain/StickerLayout';

interface EntryEditBodyFormProps {
  readonly editorRef: RefObject<RichTextEditorHandle | null>;
  readonly editDate: Date;
  readonly onChangeDate: (date: Date) => void;
  readonly editTitle: string;
  readonly onChangeTitle: (title: string) => void;
  readonly editEntryType: DiaryEntryType;
  readonly onChangeEntryType: (entryType: DiaryEntryType) => void;
  readonly editPhotos: readonly DiaryPhoto[];
  readonly editMomentPhotoLayout: MomentPhotoLayout;
  readonly onChangeMomentPhotoLayout: (layout: MomentPhotoLayout) => void;
  readonly onAddMomentPhotos: () => void;
  readonly onRemoveMomentPhoto: (photoId: string) => void;
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
  editEntryType,
  onChangeEntryType,
  editPhotos,
  editMomentPhotoLayout,
  onChangeMomentPhotoLayout,
  onAddMomentPhotos,
  onRemoveMomentPhoto,
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
  const [selectedStickerId, setSelectedStickerId] = useState<string | undefined>(undefined);
  const clearSelectedStickerFromCanvas = useCallback((event: GestureResponderEvent) => {
    if (event.target === event.currentTarget) {
      setSelectedStickerId(undefined);
    }
    return false;
  }, []);
  const handleDeleteSticker = useCallback((stickerId: string) => {
    setSelectedStickerId((current) => (current === stickerId ? undefined : current));
    onDeleteSticker(stickerId);
  }, [onDeleteSticker]);
  const stickers = useMemo(() => [...behindStickers, ...foregroundStickers], [behindStickers, foregroundStickers]);
  const textAvoidanceInsets = useMemo(
    () => {
      const insets = getStickerTextAvoidanceInsets(stickers, bodyLayout);
      return { paddingLeft: insets.paddingLeft, paddingRight: insets.paddingRight };
    },
    [bodyLayout, stickers],
  );

  return (
    <>
      <DiaryDatePicker value={editDate} onChange={onChangeDate} maximumDate={new Date()} variant="entryHero" />
      <View style={styles.entryTypeSelector} testID="entry-edit-type-selector">
        {(['diary', 'moment'] as const).map((type) => {
          const selected = editEntryType === type;
          return (
            <Pressable
              key={type}
              onPress={() => onChangeEntryType(type)}
              style={[
                styles.entryTypeButton,
                {
                  backgroundColor: selected ? theme.colors.tint : theme.colors.card,
                  borderColor: selected ? theme.colors.tint : theme.colors.border,
                },
              ]}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              testID={`entry-edit-type-${type}`}
            >
              <Text style={[styles.entryTypeButtonText, { color: selected ? theme.colors.background : theme.colors.text }]}>
                {type === 'diary' ? t('entryTypeDiary') : t('entryTypeMoment')}
              </Text>
            </Pressable>
          );
        })}
      </View>
      {editEntryType === 'moment' ? (
        <>
          <View
            style={[
              styles.momentPhotoHint,
              {
                backgroundColor: theme.colors.card + 'CC',
                borderColor: theme.colors.tint + '66',
              },
            ]}
            testID="entry-edit-moment-cover-hint"
          >
            <Text style={[styles.momentPhotoHintKicker, { color: theme.colors.tint }]}>
              {t('commonTip')}
            </Text>
            <Text style={[styles.momentPhotoHintText, { color: theme.colors.text }]}>
              {t('entryMomentCoverPhotoHint')}
            </Text>
          </View>
          <MomentPhotoGrid
            photos={editPhotos}
            editable
            layout={editMomentPhotoLayout}
            onChangeLayout={onChangeMomentPhotoLayout}
            onAddPhoto={onAddMomentPhotos}
            onRemovePhoto={onRemoveMomentPhoto}
            testID="entry-edit-moment-photo-grid"
          />
        </>
      ) : null}
      {editEntryType === 'diary' ? (
        <>
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
          <View style={styles.titleBodyGap} />
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
            onStartShouldSetResponder={clearSelectedStickerFromCanvas}
          >
            {behindStickers.map((sticker) => (
              <StickerCanvasItem
                key={sticker.id}
                sticker={sticker}
                onUpdate={onUpdateSticker}
                onDelete={handleDeleteSticker}
                isEditable
                isSelected={selectedStickerId === sticker.id}
                onSelect={setSelectedStickerId}
                onDeselect={() => setSelectedStickerId(undefined)}
                onDragStateChange={onStickerDragStateChange}
                bounds={bodyLayout}
                allowBottomOverflow
                horizontalEdgeAllowanceRatio={ENTRY_DETAIL_EDITABLE_STICKER_HORIZONTAL_EDGE_ALLOWANCE_RATIO}
                testID={`entry-edit-sticker-${sticker.id}`}
              />
            ))}
            <View style={[styles.entryBodyLayer, textAvoidanceInsets]}>
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
                onDelete={handleDeleteSticker}
                isEditable
                isSelected={selectedStickerId === sticker.id}
                onSelect={setSelectedStickerId}
                onDeselect={() => setSelectedStickerId(undefined)}
                onDragStateChange={onStickerDragStateChange}
                bounds={bodyLayout}
                allowBottomOverflow
                horizontalEdgeAllowanceRatio={ENTRY_DETAIL_EDITABLE_STICKER_HORIZONTAL_EDGE_ALLOWANCE_RATIO}
                testID={`entry-edit-sticker-${sticker.id}`}
              />
            ))}
          </View>
        </>
      ) : null}
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
  entryTypeSelector: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  entryTypeButton: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  entryTypeButtonText: {
    fontSize: 13,
    fontWeight: '800',
  },
  momentPhotoHint: {
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  momentPhotoHintKicker: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  momentPhotoHintText: {
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 18,
  },
  titleBodyGap: {
    height: StyleSheet.hairlineWidth,
    marginBottom: 18,
  },
});
