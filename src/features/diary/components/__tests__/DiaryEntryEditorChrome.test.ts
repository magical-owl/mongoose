import {
  ENTRY_EDITOR_FOOTER_BOTTOM_OFFSET,
  ENTRY_EDITOR_TOOLBAR_HEIGHT,
  getEntryEditorScrollBottomPadding,
} from '@/features/diary/components/DiaryEntryEditorChrome';

describe('DiaryEntryEditorChrome', () => {
  it('reserves the floating footer, safe area, and trailing content gap in scroll padding', () => {
    expect(getEntryEditorScrollBottomPadding(34, 24)).toBe(
      ENTRY_EDITOR_TOOLBAR_HEIGHT + 34 + ENTRY_EDITOR_FOOTER_BOTTOM_OFFSET + 24,
    );
  });
});
