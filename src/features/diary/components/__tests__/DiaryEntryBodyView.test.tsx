import { DiaryEntryBodyView } from '@/features/diary/components/DiaryEntryBodyView';
import type { DiaryEntry } from '@/features/diary/domain/DiaryEntry';
import { renderWithProviders } from '@tests/helpers';

const entry: DiaryEntry = {
  id: '11111111-1111-4111-8111-111111111111',
  title: 'Morning notes',
  content: '<p>A <strong>bold</strong> <span style="color: rgb(243, 198, 193);">thought</span>.</p><a href="https://example.com">link</a><script>alert("x")</script>',
  date: '2026-08-29',
  paperBackgroundId: 'vintage-parchment',
  bodyFontFamily: 'lora',
  bodyTextColor: '#F3C6C1',
  stickers: [],
  companion: 'cat',
  isFavorite: false,
  tags: ['daily'],
  createdAt: '2026-08-29T01:58:00.000Z',
  updatedAt: '2026-08-29T01:58:00.000Z',
  manualMoodWeather: 'neutral',
  manualMood: 'calm',
  manualMoods: ['calm'],
  writingMode: 'free-write',
  isLockbox: false,
  sensory: {
    locationLabel: '',
    sounds: '',
    smells: '',
    energyLevel: 5,
    bodyState: '',
  },
  collectionIds: [],
  journalIds: [],
  photos: [],
  reflections: [],
};

describe('DiaryEntryBodyView', () => {
  it('renders saved rich body formatting in read-only view mode', async () => {
    const { getByTestId } = await renderWithProviders(
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

    const webView = getByTestId('diary-entry-body-webview');
    const source = webView.props.source as { readonly html: string };

    expect(source.html).toContain('<strong>bold</strong>');
    expect(source.html).toContain('color: rgb(243, 198, 193);');
    expect(source.html).toContain('color: #F3C6C1;');
    expect(source.html).toContain('font-family: Georgia, "Times New Roman", serif;');
    expect(source.html).toContain('<a>link</a>');
    expect(source.html).not.toContain('href="https://example.com"');
    expect(source.html).not.toContain('<script>alert("x")</script>');
  });
});
