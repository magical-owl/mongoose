import type { ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import { useTheme } from "@providers/ThemeProvider";
import { Text } from "@shared/components/Text";
import {
  InsetFloatingToolbar,
  insetFloatingToolbarStyles,
} from "@shared/components/InsetFloatingToolbar";

export const ENTRY_EDITOR_HEADER_TOP_OFFSET = 10;
export const ENTRY_EDITOR_HEADER_BUTTON_HEIGHT = 44;
export const ENTRY_EDITOR_HEADER_BOTTOM_PADDING = 12;
export const ENTRY_EDITOR_COVER_TOP_GAP = 12;
export const ENTRY_EDITOR_BODY_MIN_HEIGHT = 96;
export const ENTRY_EDITOR_BODY_DEFAULT_VIEWPORT_RATIO = 0.21;
export const ENTRY_EDITOR_BODY_EXTRA_STICKER_SPACE = 6;
export const ENTRY_EDITOR_TOOLBAR_HEIGHT = 56;
export const ENTRY_EDITOR_FOOTER_BOTTOM_OFFSET = 12;
export const ENTRY_EDITOR_BODY_FONT_SIZE = 20;
export const ENTRY_EDITOR_BODY_LINE_HEIGHT = 31;

export function getEntryEditorHorizontalPadding(windowWidth: number): number {
  return Math.min(28, Math.max(18, Math.round(windowWidth * 0.052)));
}

export function getEntryEditorCoverHeight(
  windowWidth: number,
  horizontalPadding: number,
): number {
  return Math.min(
    150,
    Math.max(104, (windowWidth - horizontalPadding * 2) / 2.45),
  );
}

export function getEntryEditorScrollBottomPadding(
  bottomInset: number,
  spacingAfterFooter: number,
): number {
  return (
    ENTRY_EDITOR_TOOLBAR_HEIGHT +
    bottomInset +
    ENTRY_EDITOR_FOOTER_BOTTOM_OFFSET +
    spacingAfterFooter
  );
}

interface DiaryEntryEditorHeaderProps {
  readonly topInset: number;
  readonly horizontalPadding: number;
  readonly title: string;
  readonly left: ReactNode;
  readonly actions: ReactNode;
}

export function DiaryEntryEditorHeader({
  topInset,
  horizontalPadding,
  title,
  left,
  actions,
}: DiaryEntryEditorHeaderProps): React.JSX.Element {
  const theme = useTheme();

  return (
    <View
      style={[
        styles.header,
        {
          paddingTop: topInset + ENTRY_EDITOR_HEADER_TOP_OFFSET,
          paddingHorizontal: horizontalPadding,
          backgroundColor: theme.colors.background,
        },
      ]}
    >
      <View style={styles.headerLeftSlot}>{left}</View>
      <Text
        preset="h3"
        color="text"
        style={styles.headerTitle}
        numberOfLines={1}
      >
        {title}
      </Text>
      <View style={styles.headerActions}>{actions}</View>
    </View>
  );
}

interface DiaryEntryEditorFooterProps {
  readonly bottom: number;
  readonly children: ReactNode;
  readonly wordCount?: number;
}

export function DiaryEntryEditorFooter({
  bottom,
  children,
  wordCount,
}: DiaryEntryEditorFooterProps): React.JSX.Element {
  const theme = useTheme();

  return (
    <InsetFloatingToolbar
      bottom={bottom}
      trailing={
        wordCount ? (
          <Text
            preset="caption"
            style={[styles.wordCount, { color: theme.colors.textSecondary }]}
          >
            {wordCount}w
          </Text>
        ) : undefined
      }
    >
      {children}
    </InsetFloatingToolbar>
  );
}

export const diaryEntryEditorChromeStyles = StyleSheet.create({
  toolbarGroup: {
    ...insetFloatingToolbarStyles.group,
  },
  toolbarPlainGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  toolbarDivider: {
    ...insetFloatingToolbarStyles.divider,
  },
});

const styles = StyleSheet.create({
  header: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 30,
    elevation: 30,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: ENTRY_EDITOR_HEADER_BOTTOM_PADDING,
  },
  headerLeftSlot: {
    minWidth: 44,
    height: 44,
    alignItems: "flex-start",
    justifyContent: "center",
  },
  headerTitle: {
    flex: 1,
    marginHorizontal: 12,
    textAlign: "center",
    fontSize: 22,
    lineHeight: 28,
    fontWeight: "700",
  },
  headerActions: {
    minWidth: 132,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 10,
  },
  wordCount: {
    fontSize: 11,
    fontVariant: ["tabular-nums"],
  },
});
