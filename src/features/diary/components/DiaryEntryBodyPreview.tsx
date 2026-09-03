import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { MarkdownText } from '@shared/components/MarkdownText';
import { useTheme } from '@providers/ThemeProvider';
import { normalizeDiaryBodyFontFamily, normalizeDiaryBodyTextColor } from '@/features/diary/domain/DiaryBodyStyle';
import type { DiaryEntry } from '@/features/diary/domain/DiaryEntry';
import type { PlacedSticker } from '@/features/diary/domain/Sticker';
import { resolveAppFontFamily } from '@/theme/fonts';

import { StickerCanvasItem } from './StickerCanvasItem';

interface DiaryEntryBodyPreviewProps {
  readonly entry: DiaryEntry;
  readonly bodyCanvasHeight: number;
  readonly bodyFontSize: number;
  readonly bodyLineHeight: number;
  readonly stickers: readonly PlacedSticker[];
  readonly onBodyLayout: (layout: { readonly y: number; readonly width: number; readonly height: number }) => void;
}

export function DiaryEntryBodyPreview({
  entry,
  bodyCanvasHeight,
  bodyFontSize,
  bodyLineHeight,
  stickers,
  onBodyLayout,
}: DiaryEntryBodyPreviewProps): React.JSX.Element {
  const theme = useTheme();
  const bodyTextColor = normalizeDiaryBodyTextColor(entry.bodyTextColor) ?? theme.colors.text;
  const bodyFontFamily = resolveAppFontFamily(normalizeDiaryBodyFontFamily(entry.bodyFontFamily), true);
  const behindStickers = useMemo(() => stickers.filter((sticker) => sticker.behindText), [stickers]);
  const foregroundStickers = useMemo(() => stickers.filter((sticker) => !sticker.behindText), [stickers]);
  const contentHeight = Math.max(1, bodyCanvasHeight);

  return (
    <View
      testID="diary-entry-body-preview"
      style={[styles.canvas, { minHeight: contentHeight }]}
      onLayout={(event) => {
        const { y, width, height } = event.nativeEvent.layout;
        onBodyLayout({ y, width, height });
      }}
    >
      {behindStickers.map((sticker) => (
        <StickerCanvasItem
          key={sticker.id}
          sticker={sticker}
          onUpdate={() => {}}
          onDelete={() => {}}
          isEditable={false}
        />
      ))}
      <View style={styles.textLayer}>
        <MarkdownText
          style={[
            styles.text,
            {
              color: bodyTextColor,
              fontFamily: bodyFontFamily,
              fontSize: bodyFontSize,
              lineHeight: bodyLineHeight,
            },
          ]}
        >
          {entry.content}
        </MarkdownText>
      </View>
      {foregroundStickers.map((sticker) => (
        <StickerCanvasItem
          key={sticker.id}
          sticker={sticker}
          onUpdate={() => {}}
          onDelete={() => {}}
          isEditable={false}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  canvas: {
    overflow: 'hidden',
    position: 'relative',
  },
  textLayer: {
    elevation: 2,
    position: 'relative',
    zIndex: 2,
  },
  text: {
    fontWeight: '600',
  },
});
