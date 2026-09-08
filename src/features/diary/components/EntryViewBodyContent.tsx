import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { Text } from '@shared/components/Text';
import { useTheme } from '@/providers/ThemeProvider';
import type { DiaryEntry } from '@/features/diary/domain/DiaryEntry';
import type { PlacedSticker } from '@/features/diary/domain/Sticker';
import type { StickerCanvasLayout } from '@/features/diary/hooks/useEntryStickerEditing';
import { DiaryEntryBodyView } from '@/features/diary/components/DiaryEntryBodyView';
import {
  ENTRY_EDITOR_BODY_FONT_SIZE,
  ENTRY_EDITOR_BODY_LINE_HEIGHT,
} from '@/features/diary/components/DiaryEntryEditorChrome';

interface EntryViewBodyContentProps {
  readonly entry: DiaryEntry;
  readonly hasCoverPhoto: boolean;
  readonly timestamp: string;
  readonly loadingEntryDirection: 'previous' | 'next' | null;
  readonly bodyCanvasHeight: number;
  readonly stickers: readonly PlacedSticker[];
  readonly onChangeBodyLayout: React.Dispatch<React.SetStateAction<StickerCanvasLayout>>;
  readonly onUpdateSticker: (sticker: PlacedSticker) => void;
  readonly onDeleteSticker: (stickerId: string) => void;
  readonly onStickerDragStateChange: (isDragging: boolean) => void;
}

export function EntryViewBodyContent({
  entry,
  hasCoverPhoto,
  timestamp,
  loadingEntryDirection,
  bodyCanvasHeight,
  stickers,
  onChangeBodyLayout,
  onUpdateSticker,
  onDeleteSticker,
  onStickerDragStateChange,
}: EntryViewBodyContentProps) {
  const theme = useTheme();

  return (
    <>
      {loadingEntryDirection === 'previous' ? (
        <View style={styles.entryLoader} testID="entry-view-previous-loader">
          <ActivityIndicator color={theme.colors.tint} />
        </View>
      ) : null}
      {hasCoverPhoto ? null : (
        <View style={styles.noCoverHeader} testID="entry-view-no-cover-header">
          <Text
            preset="h2"
            style={[styles.coverTitle, { color: theme.colors.stickerControlText }]}
            numberOfLines={2}
          >
            {entry.title}
          </Text>
          <Text
            preset="caption"
            style={[styles.coverDateTime, { color: theme.colors.stickerControlText }]}
            numberOfLines={1}
          >
            {timestamp}
          </Text>
        </View>
      )}
      <DiaryEntryBodyView
        entry={entry}
        bodyCanvasHeight={bodyCanvasHeight}
        bodyFontSize={ENTRY_EDITOR_BODY_FONT_SIZE}
        bodyLineHeight={ENTRY_EDITOR_BODY_LINE_HEIGHT}
        stickers={stickers}
        onBodyLayout={(layout) => {
          onChangeBodyLayout((current) => (
            current.y === layout.y && current.width === layout.width && current.height === layout.height
              ? current
              : layout
          ));
        }}
        onUpdateSticker={onUpdateSticker}
        onDeleteSticker={onDeleteSticker}
        onStickerDragStateChange={onStickerDragStateChange}
      />
      {loadingEntryDirection === 'next' ? (
        <View style={styles.entryLoader} testID="entry-view-next-loader">
          <ActivityIndicator color={theme.colors.tint} />
        </View>
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  entryLoader: {
    minHeight: 72,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noCoverHeader: {
    paddingTop: 2,
    paddingBottom: 12,
  },
  coverDateTime: {
    fontWeight: '700',
    flexShrink: 0,
  },
  coverTitle: {
    fontSize: 28,
    fontWeight: '800',
    lineHeight: 34,
    marginBottom: 8,
  },
});
