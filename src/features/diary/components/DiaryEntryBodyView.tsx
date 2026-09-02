import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import WebView, { type WebViewMessageEvent } from 'react-native-webview';
import { useTheme } from '@/providers/ThemeProvider';
import type { DiaryEntry } from '@/features/diary/domain/DiaryEntry';
import { normalizeDiaryBodyFontFamily, normalizeDiaryBodyTextColor } from '@/features/diary/domain/DiaryBodyStyle';
import type { PlacedSticker } from '@/features/diary/domain/Sticker';
import { StickerCanvasItem } from '@/features/diary/components/StickerCanvasItem';
import { resolveAppFontFamilyForWebContent } from '@/theme/fonts';

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

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function normalizeCssInlineValue(value: string): string {
  return value.replace(/[<>{};]/g, '').replace(/\n/g, ' ').trim();
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

export function buildDiaryEntryBodyHtml({
  content,
  fontFamily,
  textColor,
  fontSize,
  lineHeight,
}: {
  readonly content: string;
  readonly fontFamily: string;
  readonly textColor: string;
  readonly fontSize: number;
  readonly lineHeight: number;
}): string {
  const sanitizedContent = sanitizeRichBodyHtml(content);
  const safeFontFamily = normalizeCssInlineValue(fontFamily);
  const safeTextColor = escapeHtml(textColor);

  return `<!doctype html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1">
  <style>
    html,
    body {
      margin: 0;
      padding: 0;
      background: transparent;
      color: ${safeTextColor};
      font-family: ${safeFontFamily};
      font-size: ${fontSize}px;
      font-weight: 600;
      line-height: ${lineHeight}px;
      overflow: hidden;
      -webkit-text-size-adjust: 100%;
    }

    body {
      min-height: 1px;
    }

    * {
      box-sizing: border-box;
      max-width: 100%;
    }

    p,
    div,
    blockquote,
    h1,
    h2,
    h3,
    h4,
    h5,
    h6,
    ul,
    ol {
      margin-top: 0;
    }

    p,
    div {
      margin-bottom: 12px;
    }

    h1,
    h2,
    h3 {
      line-height: 1.18;
      margin-bottom: 10px;
    }

    blockquote {
      border-left: 3px solid currentColor;
      margin-left: 0;
      padding-left: 12px;
      opacity: 0.9;
    }

    pre,
    code {
      font-family: "Courier New", Courier, monospace;
      white-space: pre-wrap;
    }
  </style>
</head>
<body>
  ${sanitizedContent}
  <script>
    (function () {
      var lastHeight = 0;
      function postHeight() {
        var height = Math.ceil(Math.max(
          document.body.scrollHeight,
          document.documentElement.scrollHeight,
          document.body.offsetHeight,
          document.documentElement.offsetHeight
        ));
        if (height !== lastHeight) {
          lastHeight = height;
          window.ReactNativeWebView && window.ReactNativeWebView.postMessage(String(height));
        }
      }
      postHeight();
      setTimeout(postHeight, 50);
      setTimeout(postHeight, 250);
      window.addEventListener('load', postHeight);
      window.addEventListener('resize', postHeight);
    })();
  </script>
</body>
</html>`;
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
  const [webContentHeight, setWebContentHeight] = useState(minimumBodyCanvasHeight);
  const bodyTextColor = normalizeDiaryBodyTextColor(entry.bodyTextColor) ?? theme.colors.text;
  const bodyFontFamily = resolveAppFontFamilyForWebContent(normalizeDiaryBodyFontFamily(entry.bodyFontFamily));
  const behindStickers = stickers.filter((sticker) => sticker.behindText);
  const foregroundStickers = stickers.filter((sticker) => !sticker.behindText);
  const contentHeight = Math.max(minimumBodyCanvasHeight, webContentHeight);
  const handleUpdateSticker = onUpdateSticker ?? (() => {});
  const handleDeleteSticker = onDeleteSticker ?? (() => {});
  const bodyHtml = useMemo(() => (
    buildDiaryEntryBodyHtml({
      content: entry.content,
      fontFamily: bodyFontFamily,
      textColor: bodyTextColor,
      fontSize: bodyFontSize,
      lineHeight: bodyLineHeight,
    })
  ), [bodyFontFamily, bodyFontSize, bodyLineHeight, bodyTextColor, entry.content]);

  const handleMessage = (event: WebViewMessageEvent): void => {
    const nextHeight = Number(event.nativeEvent.data);
    if (Number.isFinite(nextHeight) && nextHeight > 0) {
      setWebContentHeight(Math.ceil(nextHeight));
    }
  };

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
        <WebView
          testID="diary-entry-body-webview"
          source={{ html: bodyHtml, baseUrl: 'about:blank' }}
          originWhitelist={['about:blank']}
          javaScriptEnabled={true}
          domStorageEnabled={false}
          allowFileAccess={false}
          allowingReadAccessToURL="about:blank"
          mixedContentMode="never"
          setSupportMultipleWindows={false}
          allowsLinkPreview={false}
          scrollEnabled={false}
          showsVerticalScrollIndicator={false}
          showsHorizontalScrollIndicator={false}
          onMessage={handleMessage}
          style={[styles.bodyWebView, { height: contentHeight }]}
        />
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
  bodyWebView: {
    backgroundColor: 'transparent',
  },
});
