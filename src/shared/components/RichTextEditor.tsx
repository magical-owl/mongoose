/**
 * RichTextEditor
 *
 * Real-time HTML/WYSIWYG Rich Text Editor powered by `react-native-pell-rich-editor`.
 *
 * Features:
 * - Real-time visual bold, italic, underline, headers, bullets, quotes in the editor
 * - Exposes `applyFormat(kind)`, `setContentHTML(html)`, `insertHTML(html)` via `forwardRef`
 * - Optional inline toolbar when `showToolbar={true}`
 */

import { useRef, useImperativeHandle, forwardRef, useCallback, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import {
  RichEditor,
  RichToolbar,
  actions,
} from 'react-native-pell-rich-editor';
import { useTheme } from '@providers/ThemeProvider';
import { normalizeHtmlContent } from '@/shared/utils/html';

export type FormatActionKind = 'bold' | 'italic' | 'heading' | 'bullet' | 'quote' | 'code' | 'align-left' | 'align-center' | 'align-right' | 'align-justify';

export interface RichTextEditorHandle {
  applyFormat: (kind: FormatActionKind) => void;
  setBodyStyle: (style: { readonly fontFamily?: string; readonly textColor?: string }) => void;
  togglePreview: () => void;
  setContentHTML: (html: string) => void;
  insertHTML: (html: string) => void;
  dismissKeyboard: () => void;
  richTextRef: React.RefObject<RichEditor | null>;
}

export interface RichTextEditorProps {
  readonly value: string;
  readonly onChangeText: (text: string) => void;
  readonly onHeightChange?: (height: number) => void;
  readonly placeholder?: string;
  readonly textColor?: string;
  readonly placeholderColor?: string;
  readonly fontFamily?: string;
  readonly fontSize?: number;
  readonly lineHeight?: number;
  readonly fontWeight?: string;
  readonly minHeight?: number;
  readonly accessibilityLabel?: string;
  readonly showToolbar?: boolean;
}

export const RichTextEditor = forwardRef<RichTextEditorHandle, RichTextEditorProps>(
  (
    {
      value,
      onChangeText,
      onHeightChange,
      placeholder = "What's on your mind today? Write freely…",
      textColor,
      placeholderColor,
      fontFamily,
      fontSize,
      lineHeight,
      fontWeight,
      minHeight = 320,
      showToolbar = false,
    },
    ref
  ) => {
    const theme = useTheme();
    const richTextRef = useRef<RichEditor>(null);
    const editorTextColor = textColor ?? theme.colors.text;
    const editorPlaceholderColor = placeholderColor ?? theme.colors.textSecondary;
    const editorFontFamily = fontFamily ?? theme.fontFamily;
    const editorFontSize = fontSize ?? theme.fontSizes.lg;
    const editorLineHeight = lineHeight ?? Math.round(theme.fontSizes.lg * 1.45);
    const editorFontWeight = fontWeight ?? '400';

    const applyFormat = useCallback((kind: FormatActionKind) => {
      if (!richTextRef.current) return;
      switch (kind) {
        case 'bold':
          richTextRef.current.sendAction(actions.setBold, 'result');
          break;
        case 'italic':
          richTextRef.current.sendAction(actions.setItalic, 'result');
          break;
        case 'heading':
          richTextRef.current.sendAction(actions.heading2, 'result');
          break;
        case 'bullet':
          richTextRef.current.sendAction(actions.insertBulletsList, 'result');
          break;
        case 'quote':
          richTextRef.current.sendAction(actions.blockquote, 'result');
          break;
        case 'code':
          richTextRef.current.sendAction(actions.code, 'result');
          break;
        case 'align-left':
          richTextRef.current.sendAction(actions.alignLeft, 'result');
          break;
        case 'align-center':
          richTextRef.current.sendAction(actions.alignCenter, 'result');
          break;
        case 'align-right':
          richTextRef.current.sendAction(actions.alignRight, 'result');
          break;
        case 'align-justify':
          richTextRef.current.sendAction(actions.alignFull, 'result');
          break;
      }
    }, []);

    const setBodyStyle = useCallback((style: { readonly fontFamily?: string; readonly textColor?: string }) => {
      const commands: string[] = [];
      if (style.fontFamily) {
        const fontFamily = JSON.stringify(style.fontFamily);
        commands.push(`$('#content').style.fontFamily=${fontFamily}`);
      }
      if (style.textColor) {
        const textColor = JSON.stringify(style.textColor);
        commands.push(`$('#content').style.color=${textColor}`);
      }
      if (commands.length > 0) {
        richTextRef.current?.commandDOM(commands.join(';'));
      }
    }, []);

    useEffect(() => {
      setBodyStyle({ fontFamily: editorFontFamily, textColor: editorTextColor });
    }, [editorFontFamily, editorTextColor, setBodyStyle]);

    const setContentHTML = useCallback((html: string) => {
      if (richTextRef.current) {
        richTextRef.current.setContentHTML(html);
      }
    }, []);

    const insertHTML = useCallback((html: string) => {
      if (richTextRef.current) {
        richTextRef.current.insertHTML(html);
      }
    }, []);

    const dismissKeyboard = useCallback(() => {
      richTextRef.current?.dismissKeyboard();
    }, []);

    useImperativeHandle(
      ref,
      () => ({
        applyFormat,
        setBodyStyle,
        togglePreview: () => {},
        setContentHTML,
        insertHTML,
        dismissKeyboard,
        richTextRef,
      }),
      [applyFormat, dismissKeyboard, setBodyStyle, setContentHTML, insertHTML]
    );

    return (
      <View style={[styles.container, { minHeight }]}>
        <RichEditor
          ref={richTextRef}
          initialContentHTML={value || ''}
          onChange={(html) => onChangeText(normalizeHtmlContent(html))}
          onHeightChange={onHeightChange}
          styleWithCSS={true}
          placeholder={placeholder}
          useContainer={true}
          editorStyle={{
            backgroundColor: 'transparent',
            color: editorTextColor,
            placeholderColor: editorPlaceholderColor,
            contentCSSText: `
              padding: 0 0 40px 0;
              font-size: ${editorFontSize}px;
              font-family: ${editorFontFamily};
              font-weight: ${editorFontWeight};
              color: ${editorTextColor};
              line-height: ${editorLineHeight}px;
              padding-bottom: 40px;
            `,
          }}
          style={{
            flex: 1,
            minHeight,
            backgroundColor: 'transparent',
          }}
        />

        {showToolbar && (
          <RichToolbar
            editor={richTextRef}
            actions={[
              actions.setBold,
              actions.setItalic,
              actions.setUnderline,
              actions.heading2,
              actions.insertBulletsList,
              actions.blockquote,
            ]}
            style={{
              backgroundColor: theme.colors.surface,
              borderTopWidth: 1,
              borderTopColor: theme.colors.border,
            }}
          />
        )}
      </View>
    );
  }
);

RichTextEditor.displayName = 'RichTextEditor';

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
