import { fireEvent, waitFor } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';
import { MarkdownText } from '@/shared/components/MarkdownText';
import { renderWithProviders } from '@tests/helpers';

describe('MarkdownText', () => {
  it('only adds sticker avoidance spacing to blocks that overlap avoidance zones', async () => {
    const { getByTestId } = await renderWithProviders(
      <MarkdownText
        testID="markdown"
        avoidanceZones={[
          {
            top: 30,
            bottom: 90,
            paddingLeft: 120,
            paddingRight: 0,
            pushBelow: false,
          },
        ]}
      >
        {`Top line\nOverlapping line\nBottom line`}
      </MarkdownText>,
      { wrapperOptions: { initialThemeMode: 'dark' } },
    );

    await waitFor(() => expect(getByTestId('markdown-block-1')).toBeTruthy());
    await fireEvent(getByTestId('markdown-block-0'), 'layout', {
      nativeEvent: { layout: { y: 0, height: 20 } },
    });
    await fireEvent(getByTestId('markdown-block-1'), 'layout', {
      nativeEvent: { layout: { y: 40, height: 20 } },
    });
    await fireEvent(getByTestId('markdown-block-2'), 'layout', {
      nativeEvent: { layout: { y: 110, height: 20 } },
    });

    await waitFor(() => {
      expect(StyleSheet.flatten(getByTestId('markdown-block-0').props.style)?.paddingLeft).toBeUndefined();
      expect(StyleSheet.flatten(getByTestId('markdown-block-1').props.style)?.paddingLeft).toBe(120);
      expect(StyleSheet.flatten(getByTestId('markdown-block-2').props.style)?.paddingLeft).toBeUndefined();
    });
  });

  it('pushes only the overlapping block below a centered sticker zone', async () => {
    const { getByTestId } = await renderWithProviders(
      <MarkdownText
        testID="markdown"
        avoidanceZones={[
          {
            top: 30,
            bottom: 90,
            paddingLeft: 0,
            paddingRight: 0,
            pushBelow: true,
          },
        ]}
      >
        {`Top line\nOverlapping line\nBottom line`}
      </MarkdownText>,
      { wrapperOptions: { initialThemeMode: 'dark' } },
    );

    await waitFor(() => expect(getByTestId('markdown-block-1')).toBeTruthy());
    await fireEvent(getByTestId('markdown-block-0'), 'layout', {
      nativeEvent: { layout: { y: 0, height: 20 } },
    });
    await fireEvent(getByTestId('markdown-block-1'), 'layout', {
      nativeEvent: { layout: { y: 40, height: 20 } },
    });
    await fireEvent(getByTestId('markdown-block-2'), 'layout', {
      nativeEvent: { layout: { y: 110, height: 20 } },
    });

    await waitFor(() => {
      expect(StyleSheet.flatten(getByTestId('markdown-block-0').props.style)?.marginTop).toBeUndefined();
      expect(StyleSheet.flatten(getByTestId('markdown-block-1').props.style)?.marginTop).toBe(50);
      expect(StyleSheet.flatten(getByTestId('markdown-block-2').props.style)?.marginTop).toBeUndefined();
    });
  });
});
