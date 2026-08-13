/**
 * MarkdownText
 *
 * Lightweight Markdown renderer using only React Native built-ins.
 * Supports: # headings, **bold**, *italic*, ***bold+italic***,
 *            `code`, > blockquote, bullet lines (•  -  *)
 *
 * No external dependencies — works in Expo Go.
 */

import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@providers/ThemeProvider';

// ---------------------------------------------------------------------------
// Inline segment types
// ---------------------------------------------------------------------------

type InlineSegment =
  | { kind: 'text'; text: string }
  | { kind: 'bold'; text: string }
  | { kind: 'italic'; text: string }
  | { kind: 'bold-italic'; text: string }
  | { kind: 'code'; text: string };

function parseInline(raw: string): InlineSegment[] {
  const segments: InlineSegment[] = [];
  // Order: bold-italic first, then bold, then italic, then code
  const re = /(\*\*\*(.+?)\*\*\*|\*\*(.+?)\*\*|\*(.+?)\*|`(.+?)`)/gs;
  let last = 0;
  let m: RegExpExecArray | null;

  while ((m = re.exec(raw)) !== null) {
    if (m.index > last) {
      segments.push({ kind: 'text', text: raw.slice(last, m.index) });
    }
    if (m[2] != null) {
      segments.push({ kind: 'bold-italic', text: m[2] });
    } else if (m[3] != null) {
      segments.push({ kind: 'bold', text: m[3] });
    } else if (m[4] != null) {
      segments.push({ kind: 'italic', text: m[4] });
    } else if (m[5] != null) {
      segments.push({ kind: 'code', text: m[5] });
    }
    last = re.lastIndex;
  }
  if (last < raw.length) {
    segments.push({ kind: 'text', text: raw.slice(last) });
  }
  return segments;
}

// ---------------------------------------------------------------------------
// Inline renderer
// ---------------------------------------------------------------------------

interface InlineProps {
  readonly segments: InlineSegment[];
  readonly baseStyle: object;
  readonly tintColor: string;
}

function InlineSegments({ segments, baseStyle, tintColor }: InlineProps) {
  return (
    <Text style={baseStyle}>
      {segments.map((seg, i) => {
        switch (seg.kind) {
          case 'bold':
            return <Text key={i} style={{ fontWeight: '700' }}>{seg.text}</Text>;
          case 'italic':
            return <Text key={i} style={{ fontStyle: 'italic' }}>{seg.text}</Text>;
          case 'bold-italic':
            return <Text key={i} style={{ fontWeight: '700', fontStyle: 'italic' }}>{seg.text}</Text>;
          case 'code':
            return (
              <Text
                key={i}
                style={{
                  fontFamily: 'Courier',
                  fontSize: 13,
                  color: tintColor,
                  backgroundColor: tintColor + '18',
                }}
              >
                {seg.text}
              </Text>
            );
          default:
            return <Text key={i}>{seg.text}</Text>;
        }
      })}
    </Text>
  );
}

// ---------------------------------------------------------------------------
// Block-level line types
// ---------------------------------------------------------------------------

type BlockLine =
  | { kind: 'h1' | 'h2' | 'h3'; text: string }
  | { kind: 'bullet'; text: string }
  | { kind: 'quote'; text: string }
  | { kind: 'blank' }
  | { kind: 'paragraph'; text: string };

function parseLine(raw: string): BlockLine {
  const trimmed = raw.trim();
  if (trimmed === '') return { kind: 'blank' };
  if (/^### (.+)/.test(trimmed)) return { kind: 'h3', text: trimmed.slice(4) };
  if (/^## (.+)/.test(trimmed)) return { kind: 'h2', text: trimmed.slice(3) };
  if (/^# (.+)/.test(trimmed)) return { kind: 'h1', text: trimmed.slice(2) };
  if (/^[•\-\*] (.+)/.test(trimmed)) return { kind: 'bullet', text: trimmed.replace(/^[•\-\*] /, '') };
  if (/^> (.+)/.test(trimmed)) return { kind: 'quote', text: trimmed.slice(2) };
  return { kind: 'paragraph', text: trimmed };
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface MarkdownTextProps {
  readonly children: string;
  readonly style?: object;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function MarkdownText({ children, style }: MarkdownTextProps) {
  const theme = useTheme();

  const baseText = {
    color: theme.colors.text,
    fontSize: theme.fontSizes.base,
    lineHeight: 26,
    ...style,
  };

  const lines = children.split('\n');
  const blocks: BlockLine[] = lines.map(parseLine);

  return (
    <View>
      {blocks.map((block, i) => {
        switch (block.kind) {
          case 'blank':
            return <View key={i} style={{ height: 10 }} />;

          case 'h1':
            return (
              <InlineSegments
                key={i}
                segments={parseInline(block.text)}
                tintColor={theme.colors.tint}
                baseStyle={{
                  color: theme.colors.text,
                  fontSize: theme.fontSizes.xxl,
                  fontWeight: '700',
                  lineHeight: 34,
                  marginBottom: 6,
                  marginTop: i > 0 ? 12 : 0,
                }}
              />
            );

          case 'h2':
            return (
              <InlineSegments
                key={i}
                segments={parseInline(block.text)}
                tintColor={theme.colors.tint}
                baseStyle={{
                  color: theme.colors.text,
                  fontSize: theme.fontSizes.xl,
                  fontWeight: '700',
                  lineHeight: 28,
                  marginBottom: 4,
                  marginTop: i > 0 ? 10 : 0,
                }}
              />
            );

          case 'h3':
            return (
              <InlineSegments
                key={i}
                segments={parseInline(block.text)}
                tintColor={theme.colors.tint}
                baseStyle={{
                  color: theme.colors.text,
                  fontSize: theme.fontSizes.lg,
                  fontWeight: '600',
                  lineHeight: 26,
                  marginBottom: 2,
                  marginTop: i > 0 ? 8 : 0,
                }}
              />
            );

          case 'bullet':
            return (
              <View key={i} style={styles.bulletRow}>
                <Text style={[styles.bulletDot, { color: theme.colors.tint }]}>•</Text>
                <InlineSegments
                  segments={parseInline(block.text)}
                  tintColor={theme.colors.tint}
                  baseStyle={[baseText, { flex: 1 }]}
                />
              </View>
            );

          case 'quote':
            return (
              <View
                key={i}
                style={[
                  styles.quoteBlock,
                  {
                    borderLeftColor: theme.colors.tint,
                    backgroundColor: theme.colors.surface,
                  },
                ]}
              >
                <InlineSegments
                  segments={parseInline(block.text)}
                  tintColor={theme.colors.tint}
                  baseStyle={[baseText, { fontStyle: 'italic', color: theme.colors.textSecondary }]}
                />
              </View>
            );

          default: // paragraph
            return (
              <InlineSegments
                key={i}
                segments={parseInline(block.text)}
                tintColor={theme.colors.tint}
                baseStyle={baseText}
              />
            );
        }
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 2,
  },
  bulletDot: {
    fontSize: 18,
    lineHeight: 26,
    marginRight: 8,
    marginTop: 0,
  },
  quoteBlock: {
    borderLeftWidth: 3,
    paddingLeft: 12,
    paddingVertical: 4,
    marginVertical: 4,
    borderRadius: 4,
  },
});
