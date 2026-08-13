/**
 * RichTextEditor
 *
 * Markdown-aware rich text editor.
 * - When `showToolbar=true` (default), renders an inline formatting toolbar.
 * - When `showToolbar=false`, toolbar is hidden and the parent controls
 *   formatting via the forwarded ref (`editorRef.current.applyFormat(...)`).
 *
 * Works in Expo Go — zero native dependencies.
 */

import { useRef, useState, useCallback, forwardRef, useImperativeHandle } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  ScrollView,
  StyleSheet,
  type NativeSyntheticEvent,
  type TextInputSelectionChangeEventData,
} from 'react-native';
import { useTheme } from '@providers/ThemeProvider';
import { MarkdownText } from './MarkdownText';

// ---------------------------------------------------------------------------
// Markdown helpers
// ---------------------------------------------------------------------------

function applyLinePrefix(
  text: string,
  start: number,
  linePrefix: string
): { text: string; newCursor: number } {
  const lineStart = text.lastIndexOf('\n', start - 1) + 1;
  const lineContent = text.slice(lineStart);
  const lineEnd = lineContent.indexOf('\n');
  const currentLine = lineEnd >= 0 ? lineContent.slice(0, lineEnd) : lineContent;

  if (currentLine.startsWith(linePrefix)) {
    const newText =
      text.slice(0, lineStart) +
      currentLine.slice(linePrefix.length) +
      text.slice(lineStart + currentLine.length);
    return { text: newText, newCursor: start - linePrefix.length };
  }
  const newText = text.slice(0, lineStart) + linePrefix + text.slice(lineStart);
  return { text: newText, newCursor: start + linePrefix.length };
}

function applyWrap(
  text: string,
  start: number,
  end: number,
  prefix: string,
  suffix: string
): { text: string; newStart: number; newEnd: number } {
  const selected = text.slice(start, end);
  const hasWrap =
    selected.startsWith(prefix) && selected.endsWith(suffix) && selected.length > prefix.length + suffix.length;
  if (hasWrap) {
    const inner = selected.slice(prefix.length, selected.length - suffix.length);
    return {
      text: text.slice(0, start) + inner + text.slice(end),
      newStart: start,
      newEnd: start + inner.length,
    };
  }
  const newSelected = selected.length > 0 ? `${prefix}${selected}${suffix}` : `${prefix}${suffix}`;
  return {
    text: text.slice(0, start) + newSelected + text.slice(end),
    newStart: start + prefix.length,
    newEnd: start + prefix.length + selected.length,
  };
}

// ---------------------------------------------------------------------------
// Format actions
// ---------------------------------------------------------------------------

export type FormatActionKind = 'bold' | 'italic' | 'heading' | 'bullet' | 'quote' | 'code';

const FORMAT_ACTIONS: { kind: FormatActionKind; label: string; prefix: string; suffix: string; linePrefix?: string }[] = [
  { kind: 'bold',    label: 'B',   prefix: '**', suffix: '**' },
  { kind: 'italic',  label: 'I',   prefix: '*',  suffix: '*' },
  { kind: 'heading', label: 'H',   prefix: '',   suffix: '', linePrefix: '## ' },
  { kind: 'bullet',  label: '•',   prefix: '',   suffix: '', linePrefix: '• ' },
  { kind: 'quote',   label: '"',   prefix: '',   suffix: '', linePrefix: '> ' },
  { kind: 'code',    label: '`',   prefix: '`',  suffix: '`' },
];

// ---------------------------------------------------------------------------
// Public handle (forwardRef)
// ---------------------------------------------------------------------------

export interface RichTextEditorHandle {
  applyFormat: (kind: FormatActionKind) => void;
  togglePreview: () => void;
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface RichTextEditorProps {
  readonly value: string;
  readonly onChangeText: (text: string) => void;
  readonly placeholder?: string;
  readonly minHeight?: number;
  readonly accessibilityLabel?: string;
  /** When false the inline formatting toolbar is hidden. Default: true */
  readonly showToolbar?: boolean;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const RichTextEditor = forwardRef<RichTextEditorHandle, RichTextEditorProps>(
  (
    {
      value,
      onChangeText,
      placeholder = 'Write freely\u2026',
      minHeight = 240,
      accessibilityLabel,
      showToolbar = true,
    },
    ref
  ) => {
    const theme = useTheme();
    const inputRef = useRef<TextInput>(null);
    const selectionRef = useRef({ start: 0, end: 0 });
    const [showPreview, setShowPreview] = useState(false);

    const handleSelectionChange = useCallback(
      (e: NativeSyntheticEvent<TextInputSelectionChangeEventData>) => {
        selectionRef.current = e.nativeEvent.selection;
      },
      []
    );

    const applyFormat = useCallback(
      (kind: FormatActionKind) => {
        const { start, end } = selectionRef.current;
        const action = FORMAT_ACTIONS.find((a) => a.kind === kind);
        if (!action) return;

        if (action.linePrefix) {
          const { text: newText, newCursor } = applyLinePrefix(value, start, action.linePrefix);
          onChangeText(newText);
          setTimeout(() => {
            inputRef.current?.focus();
            const nc = Math.max(0, newCursor);
            selectionRef.current = { start: nc, end: nc };
          }, 10);
          return;
        }

        const { text: newText, newStart, newEnd } = applyWrap(value, start, end, action.prefix, action.suffix);
        onChangeText(newText);
        setTimeout(() => {
          inputRef.current?.focus();
          selectionRef.current = { start: newStart, end: newEnd };
        }, 10);
      },
      [value, onChangeText]
    );

    const togglePreview = useCallback(() => setShowPreview((p) => !p), []);

    // Expose to parent via ref
    useImperativeHandle(ref, () => ({ applyFormat, togglePreview }), [applyFormat, togglePreview]);

    // ── Inline toolbar (only when showToolbar=true) ────────────────────────
    const toolbar = showToolbar ? (
      <View
        style={[
          styles.toolbar,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border,
          },
        ]}
      >
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.toolbarInner}
          keyboardShouldPersistTaps="always"
        >
          {FORMAT_ACTIONS.map((action) => (
            <TouchableOpacity
              key={action.kind}
              style={[styles.toolbarBtn, { borderColor: theme.colors.border }]}
              onPress={() => applyFormat(action.kind)}
              activeOpacity={0.6}
              accessibilityLabel={action.kind}
              accessibilityRole="button"
            >
              <Text
                style={[
                  styles.toolbarBtnText,
                  {
                    color: theme.colors.text,
                    fontWeight: action.kind === 'bold' ? '800' : '500',
                    fontStyle: action.kind === 'italic' ? 'italic' : 'normal',
                  },
                ]}
              >
                {action.label}
              </Text>
            </TouchableOpacity>
          ))}
          <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />
          <TouchableOpacity
            style={[
              styles.toolbarBtn,
              {
                borderColor: showPreview ? theme.colors.tint : theme.colors.border,
                backgroundColor: showPreview ? theme.colors.tint + '22' : 'transparent',
                paddingHorizontal: 10,
              },
            ]}
            onPress={togglePreview}
            activeOpacity={0.6}
            accessibilityLabel={showPreview ? 'Hide preview' : 'Show preview'}
            accessibilityRole="button"
          >
            <Text style={[styles.toolbarBtnText, { color: showPreview ? theme.colors.tint : theme.colors.textSecondary }]}>
              {showPreview ? 'Edit' : '👁'}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    ) : null;

    // ── Render ─────────────────────────────────────────────────────────────
    return (
      <View style={styles.container}>
        {toolbar}
        {showPreview ? (
          <View style={{ minHeight }}>
            {value.trim() ? (
              <MarkdownText>{value}</MarkdownText>
            ) : (
              <Text style={{ color: theme.colors.textSecondary, fontStyle: 'italic' }}>
                {placeholder}
              </Text>
            )}
          </View>
        ) : (
          <TextInput
            ref={inputRef}
            value={value}
            onChangeText={onChangeText}
            onSelectionChange={handleSelectionChange}
            placeholder={placeholder}
            placeholderTextColor={theme.colors.textSecondary}
            multiline
            textAlignVertical="top"
            style={[
              styles.input,
              {
                color: theme.colors.text,
                fontSize: theme.fontSizes.base,
                minHeight,
              },
            ]}
            scrollEnabled={false}
            accessibilityLabel={accessibilityLabel}
            accessibilityHint="Supports Markdown: **bold**, *italic*, ## heading, • bullet, > quote"
          />
        )}
      </View>
    );
  }
);

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: { flex: 1 },
  toolbar: {
    borderWidth: 1,
    borderRadius: 10,
    marginBottom: 12,
    overflow: 'hidden',
  },
  toolbarInner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 4,
    gap: 4,
  },
  toolbarBtn: {
    minWidth: 32,
    height: 32,
    borderRadius: 7,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  toolbarBtnText: { fontSize: 14, lineHeight: 18 },
  divider: { width: 1, height: 22, marginHorizontal: 4 },
  input: {
    padding: 0,
    lineHeight: 26,
    includeFontPadding: false,
  },
});
