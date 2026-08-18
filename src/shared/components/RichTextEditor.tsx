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

import { useRef, useImperativeHandle, forwardRef, useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import {
  RichEditor,
  RichToolbar,
  actions,
} from 'react-native-pell-rich-editor';
import { useTheme } from '@providers/ThemeProvider';

export type FormatActionKind = 'bold' | 'italic' | 'heading' | 'bullet' | 'quote' | 'code';

export interface RichTextEditorHandle {
  applyFormat: (kind: FormatActionKind) => void;
  togglePreview: () => void;
  setContentHTML: (html: string) => void;
  insertHTML: (html: string) => void;
  richTextRef: React.RefObject<RichEditor | null>;
}

export interface RichTextEditorProps {
  readonly value: string;
  readonly onChangeText: (text: string) => void;
  readonly placeholder?: string;
  readonly minHeight?: number;
  readonly accessibilityLabel?: string;
  readonly showToolbar?: boolean;
}

export const RichTextEditor = forwardRef<RichTextEditorHandle, RichTextEditorProps>(
  (
    {
      value,
      onChangeText,
      placeholder = "What's on your mind today? Write freely…",
      minHeight = 320,
      showToolbar = false,
    },
    ref
  ) => {
    const theme = useTheme();
    const richTextRef = useRef<RichEditor>(null);

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
      }
    }, []);

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

    useImperativeHandle(
      ref,
      () => ({
        applyFormat,
        togglePreview: () => {},
        setContentHTML,
        insertHTML,
        richTextRef,
      }),
      [applyFormat, setContentHTML, insertHTML]
    );

    return (
      <View style={[styles.container, { minHeight }]}>
        <RichEditor
          ref={richTextRef}
          initialContentHTML={value || ''}
          onChange={onChangeText}
          styleWithCSS={true}
          placeholder={placeholder}
          useContainer={true}
          editorStyle={{
            backgroundColor: 'transparent',
            color: theme.colors.text,
            placeholderColor: theme.colors.textSecondary,
            contentCSSText: `
              padding: 0 0 40px 0;
              font-size: ${theme.fontSizes.lg}px;
              font-family: ${theme.fontFamily};
              color: ${theme.colors.text};
              line-height: ${Math.round(theme.fontSizes.lg * 1.45)}px;
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
