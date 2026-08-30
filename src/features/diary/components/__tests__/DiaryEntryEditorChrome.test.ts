import {
  DiaryEntryEditorFooter,
  ENTRY_EDITOR_BODY_DEFAULT_VIEWPORT_RATIO,
  ENTRY_EDITOR_BODY_MIN_HEIGHT,
  ENTRY_EDITOR_FOOTER_BOTTOM_OFFSET,
  ENTRY_EDITOR_TOOLBAR_HEIGHT,
  diaryEntryEditorChromeStyles,
  getEntryEditorScrollBottomPadding,
} from '@/features/diary/components/DiaryEntryEditorChrome';
import React, { type ComponentProps } from 'react';
import { StyleSheet, Text } from 'react-native';
import { renderWithProviders } from '@tests/helpers';

describe('DiaryEntryEditorChrome', () => {
  it('keeps the default body height compact enough for metadata controls to remain visible', () => {
    expect(ENTRY_EDITOR_BODY_MIN_HEIGHT).toBeLessThanOrEqual(96);
    expect(ENTRY_EDITOR_BODY_DEFAULT_VIEWPORT_RATIO).toBeLessThanOrEqual(0.21);
  });

  it('reserves the floating footer, safe area, and trailing content gap in scroll padding', () => {
    expect(getEntryEditorScrollBottomPadding(34, 24)).toBe(
      ENTRY_EDITOR_TOOLBAR_HEIGHT + 34 + ENTRY_EDITOR_FOOTER_BOTTOM_OFFSET + 24,
    );
  });

  it('keeps grouped footer icon clusters visually neutral', () => {
    const plainGroup = StyleSheet.flatten(diaryEntryEditorChromeStyles.toolbarPlainGroup) as Record<string, unknown>;

    expect(plainGroup.flexDirection).toBe('row');
    expect(plainGroup.backgroundColor).toBeUndefined();
    expect(plainGroup.borderColor).toBeUndefined();
    expect(plainGroup.borderWidth).toBeUndefined();
  });

  it('renders the floating footer with a translucent surface', async () => {
    const footerProps: Omit<ComponentProps<typeof DiaryEntryEditorFooter>, 'children'> = {
      bottom: 12,
      testID: 'entry-editor-footer',
    };

    const { getByTestId } = await renderWithProviders(
      React.createElement(
        DiaryEntryEditorFooter,
        footerProps,
        React.createElement(Text, null, 'Tools'),
      ),
    );

    const footerStyle = StyleSheet.flatten(getByTestId('entry-editor-footer').props.style) as Record<string, unknown>;

    expect(footerStyle.backgroundColor).toEqual(expect.stringMatching(/E6$/));
  });
});
