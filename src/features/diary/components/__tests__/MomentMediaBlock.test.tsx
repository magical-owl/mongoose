import { StyleSheet } from 'react-native';

import { MomentMediaBlock } from '@/features/diary/components/MomentMediaBlock';
import { buildDiaryPhoto } from '@tests/fixtures/domain';
import { renderWithProviders } from '@tests/helpers';

describe('MomentMediaBlock', () => {
  it('applies media bleed and flush spacing through the shared wrapper', async () => {
    const { getByTestId } = await renderWithProviders(
      <MomentMediaBlock
        photos={[buildDiaryPhoto()]}
        layout="grid"
        bleedHorizontal={16}
        flushBottom
        testID="moment-media"
      />,
    );

    const style = StyleSheet.flatten(getByTestId('moment-media').props.style);

    expect(style.marginHorizontal).toBe(-16);
    expect(style.marginTop).toBe(-16);
    expect(style.marginBottom).toBe(0);
  });

  it('does not render empty read-only media blocks', async () => {
    const { queryByTestId } = await renderWithProviders(
      <MomentMediaBlock photos={[]} testID="moment-media" />,
    );

    expect(queryByTestId('moment-media')).toBeNull();
  });
});
