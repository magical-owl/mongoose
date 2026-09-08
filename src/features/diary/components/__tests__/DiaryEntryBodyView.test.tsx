import { DiaryEntryBodyView } from '@/features/diary/components/DiaryEntryBodyView';
import { renderWithProviders } from '@tests/helpers';
import { StyleSheet } from 'react-native';
import { buildDiaryEntry } from '@tests/fixtures/domain';

const entry = buildDiaryEntry({
  title: 'Morning notes',
  content: '<p>A <strong>bold</strong> <span style="color: rgb(243, 198, 193);">thought</span>.</p><a href="https://example.com">link</a><script>alert("x")</script>',
  paperBackgroundId: 'vintage-parchment',
  bodyFontFamily: 'lora',
  bodyTextColor: '#F3C6C1',
  tags: ['daily'],
  manualMood: 'calm',
  manualMoods: ['calm'],
});

describe('DiaryEntryBodyView', () => {
  it('renders saved rich body formatting in read-only view mode', async () => {
    const { getByTestId, getByText, queryByText } = await renderWithProviders(
      <DiaryEntryBodyView
        entry={entry}
        bodyCanvasHeight={160}
        bodyFontSize={20}
        bodyLineHeight={31}
        stickers={[]}
        onBodyLayout={jest.fn()}
        onUpdateSticker={jest.fn()}
        onDeleteSticker={jest.fn()}
      />,
      { wrapperOptions: { initialThemeMode: 'dark' } },
    );

    expect(getByTestId('diary-entry-body-view')).toBeTruthy();
    expect(getByText('bold')).toBeTruthy();
    expect(getByText(/thought/)).toBeTruthy();
    expect(getByText('link')).toBeTruthy();
    expect(queryByText('alert("x")')).toBeNull();
  });

  it('renders saved h2 blocks larger than normal body text', async () => {
    const h2Entry = {
      ...entry,
      content: '<h2><span>Section heading</span></h2><p>Normal body.</p>',
    };
    const { getByText } = await renderWithProviders(
      <DiaryEntryBodyView
        entry={h2Entry}
        bodyCanvasHeight={160}
        bodyFontSize={20}
        bodyLineHeight={31}
        stickers={[]}
        onBodyLayout={jest.fn()}
      />,
      { wrapperOptions: { initialThemeMode: 'dark' } },
    );

    const headingStyle = StyleSheet.flatten(getByText('Section heading').props.style);
    expect(headingStyle?.fontSize).toBeGreaterThan(20);
    expect(getByText('Normal body.')).toBeTruthy();
  });
});
