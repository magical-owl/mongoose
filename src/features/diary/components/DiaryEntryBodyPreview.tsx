import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { MarkdownText } from '@shared/components/MarkdownText';
import { useTheme } from '@providers/ThemeProvider';
import { normalizeDiaryBodyFontFamily, normalizeDiaryBodyTextColor } from '@/features/diary/domain/DiaryBodyStyle';
import { getDiaryEntryType, type DiaryEntry } from '@/features/diary/domain/DiaryEntry';
import type { PlacedSticker } from '@/features/diary/domain/Sticker';
import { getStickerTextAvoidanceInsets } from '@/features/diary/domain/StickerLayout';
import { resolveAppFontFamily } from '@/theme/fonts';

import { StickerCanvasItem } from './StickerCanvasItem';
import { MomentPhotoGrid } from './MomentPhotoGrid';

interface DiaryEntryBodyPreviewProps {
  readonly entry: DiaryEntry;
  readonly bodyCanvasHeight: number;
  readonly bodyFontSize: number;
  readonly bodyLineHeight: number;
  readonly stickers: readonly PlacedSticker[];
  readonly coordinateScale?: number;
  readonly initialCanvasWidth?: number;
  readonly onBodyLayout: (layout: { readonly y: number; readonly width: number; readonly height: number }) => void;
}

export function DiaryEntryBodyPreview({
  entry,
  bodyCanvasHeight,
  bodyFontSize,
  bodyLineHeight,
  stickers,
  coordinateScale = 1,
  initialCanvasWidth = 0,
  onBodyLayout,
}: DiaryEntryBodyPreviewProps): React.JSX.Element {
  const theme = useTheme();
  const bodyTextColor = normalizeDiaryBodyTextColor(entry.bodyTextColor) ?? theme.colors.text;
  const bodyFontFamily = resolveAppFontFamily(normalizeDiaryBodyFontFamily(entry.bodyFontFamily), true);
  const scaledStickers = useMemo(
    () => stickers.map((sticker) => ({
      ...sticker,
      x: sticker.x * coordinateScale,
      y: sticker.y * coordinateScale,
      scale: sticker.scale * coordinateScale,
    })),
    [coordinateScale, stickers],
  );
  const behindStickers = useMemo(() => scaledStickers.filter((sticker) => sticker.behindText), [scaledStickers]);
  const foregroundStickers = useMemo(() => scaledStickers.filter((sticker) => !sticker.behindText), [scaledStickers]);
  const contentHeight = Math.max(1, bodyCanvasHeight);
  const [bodyLayout, setBodyLayout] = useState({ width: initialCanvasWidth, height: contentHeight });
  const showMomentPhotos = getDiaryEntryType(entry) === 'moment' && entry.photos.length > 0;
  const showBodyText = entry.content.trim().length > 0;
  const textAvoidanceInsets = useMemo(
    () => {
      const insets = getStickerTextAvoidanceInsets(scaledStickers, bodyLayout);
      return { paddingLeft: insets.paddingLeft, paddingRight: insets.paddingRight };
    },
    [bodyLayout, scaledStickers],
  );

  return (
    <View
      testID="diary-entry-body-preview"
      style={[styles.canvas, { minHeight: contentHeight }]}
      onLayout={(event) => {
        const { y, width, height } = event.nativeEvent.layout;
        setBodyLayout((current) => (
          current.width === width && current.height === height ? current : { width, height }
        ));
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
      {showMomentPhotos ? (
        <MomentPhotoGrid
          photos={entry.photos}
          layout={entry.momentPhotoLayout}
          compact
          previewable
          style={!showBodyText ? styles.momentGridFlush : undefined}
          testID="entry-preview-moment-photo-grid"
        />
      ) : null}
      {showBodyText ? (
        <View style={[styles.textLayer, textAvoidanceInsets]} testID="diary-entry-body-preview-text-layer">
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
      ) : null}
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
  momentGridFlush: {
    marginBottom: 0,
  },
  text: {
    fontWeight: '600',
  },
});
