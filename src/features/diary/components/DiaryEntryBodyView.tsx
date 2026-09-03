import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { MarkdownText } from '@shared/components/MarkdownText';
import { useTheme } from '@/providers/ThemeProvider';
import type { DiaryEntry } from '@/features/diary/domain/DiaryEntry';
import { normalizeDiaryBodyFontFamily, normalizeDiaryBodyTextColor } from '@/features/diary/domain/DiaryBodyStyle';
import type { PlacedSticker } from '@/features/diary/domain/Sticker';
import { StickerCanvasItem } from '@/features/diary/components/StickerCanvasItem';
import { resolveAppFontFamily } from '@/theme/fonts';

interface DiaryEntryBodyViewProps {
  readonly entry: DiaryEntry;
  readonly bodyCanvasHeight: number;
  readonly bodyFontSize: number;
  readonly bodyLineHeight: number;
  readonly stickers: readonly PlacedSticker[];
  readonly onBodyLayout: (layout: { readonly y: number; readonly width: number; readonly height: number }) => void;
  readonly onUpdateSticker?: (sticker: PlacedSticker) => void;
  readonly onDeleteSticker?: (stickerId: string) => void;
  readonly onStickerDragStateChange?: (isDragging: boolean) => void;
}

function sanitizeRichBodyHtml(html: string): string {
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    .replace(/<(iframe|object|embed)\b[^<]*(?:(?!<\/\1>)<[^<]*)*<\/\1>/gi, '')
    .replace(/<(iframe|object|embed|link|meta)\b[^>]*>/gi, '')
    .replace(/\son[a-z]+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '')
    .replace(/\s(href|src)\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '');
}

export function DiaryEntryBodyView({
  entry,
  bodyCanvasHeight,
  bodyFontSize,
  bodyLineHeight,
  stickers,
  onBodyLayout,
  onUpdateSticker,
  onDeleteSticker,
  onStickerDragStateChange,
}: DiaryEntryBodyViewProps): React.JSX.Element {
  const theme = useTheme();
  const minimumBodyCanvasHeight = Math.max(1, bodyCanvasHeight);
  const bodyTextColor = normalizeDiaryBodyTextColor(entry.bodyTextColor) ?? theme.colors.text;
  const bodyFontFamily = resolveAppFontFamily(normalizeDiaryBodyFontFamily(entry.bodyFontFamily), true);
  const behindStickers = useMemo(() => stickers.filter((sticker) => sticker.behindText), [stickers]);
  const foregroundStickers = useMemo(() => stickers.filter((sticker) => !sticker.behindText), [stickers]);
  const contentHeight = minimumBodyCanvasHeight;
  const handleUpdateSticker = onUpdateSticker ?? (() => {});
  const handleDeleteSticker = onDeleteSticker ?? (() => {});
  const sanitizedContent = useMemo(() => sanitizeRichBodyHtml(entry.content), [entry.content]);

  return (
    <View
      testID="diary-entry-body-view"
      style={[styles.bodyStickerCanvas, { minHeight: contentHeight }]}
      onLayout={(event) => {
        const { y, width, height } = event.nativeEvent.layout;
        onBodyLayout({ y, width, height });
      }}
    >
      {behindStickers.map((sticker) => (
        <StickerCanvasItem
          key={sticker.id}
          sticker={sticker}
          onUpdate={handleUpdateSticker}
          onDelete={handleDeleteSticker}
          isEditable={false}
          onDragStateChange={onStickerDragStateChange}
        />
      ))}
      <View style={styles.entryBodyLayer}>
        <MarkdownText
          style={[
            styles.bodyText,
            {
              color: bodyTextColor,
              fontFamily: bodyFontFamily,
              fontSize: bodyFontSize,
              lineHeight: bodyLineHeight,
            },
          ]}
        >
          {sanitizedContent}
        </MarkdownText>
      </View>
      {foregroundStickers.map((sticker) => (
        <StickerCanvasItem
          key={sticker.id}
          sticker={sticker}
          onUpdate={handleUpdateSticker}
          onDelete={handleDeleteSticker}
          isEditable={false}
          onDragStateChange={onStickerDragStateChange}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  bodyStickerCanvas: {
    position: 'relative',
    overflow: 'hidden',
  },
  entryBodyLayer: {
    position: 'relative',
    zIndex: 2,
    elevation: 2,
  },
  bodyText: {
    fontWeight: '600',
  },
});
