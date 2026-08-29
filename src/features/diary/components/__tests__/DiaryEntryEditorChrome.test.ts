import {
  ENTRY_EDITOR_BODY_DEFAULT_VIEWPORT_RATIO,
  ENTRY_EDITOR_BODY_MIN_HEIGHT,
  ENTRY_EDITOR_FOOTER_BOTTOM_OFFSET,
  ENTRY_EDITOR_TOOLBAR_HEIGHT,
  diaryEntryEditorChromeStyles,
  getEntryEditorScrollBottomPadding,
} from '@/features/diary/components/DiaryEntryEditorChrome';
import { StyleSheet } from 'react-native';

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
});
