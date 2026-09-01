import { DiaryPaperCanvas } from '@/features/diary/components/DiaryPaperCanvas';
import { getDiaryPaperBackgroundSource } from '@/features/diary/domain/DiaryPaperBackgrounds';
import { Text } from '@shared/components/Text';
import { renderWithProviders } from '@tests/helpers';

describe('DiaryPaperCanvas', () => {
  it('renders children over the selected paper background', async () => {
    const { getByTestId, getByText } = await renderWithProviders(
      <DiaryPaperCanvas paperBackgroundId="soft-lined-paper" testID="paper-canvas">
        <Text>Dear diary</Text>
      </DiaryPaperCanvas>,
      { wrapperOptions: { initialThemeMode: 'light' } },
    );

    expect(getByTestId('paper-canvas-image').props.source).toBe(getDiaryPaperBackgroundSource('soft-lined-paper'));
    expect(getByText('Dear diary')).toBeTruthy();
  });

  it('renders children without a paper image for the blank background', async () => {
    const { getByText, queryByTestId } = await renderWithProviders(
      <DiaryPaperCanvas paperBackgroundId="blank" testID="paper-canvas">
        <Text>Plain page</Text>
      </DiaryPaperCanvas>,
      { wrapperOptions: { initialThemeMode: 'light' } },
    );

    expect(queryByTestId('paper-canvas-image')).toBeNull();
    expect(getByText('Plain page')).toBeTruthy();
  });
});
