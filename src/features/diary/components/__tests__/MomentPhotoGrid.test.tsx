import { StyleSheet } from 'react-native';
import { fireEvent, waitFor } from '@testing-library/react-native';
import { MomentPhotoGrid } from '@/features/diary/components/MomentPhotoGrid';
import { buildDiaryPhoto } from '@tests/fixtures/domain';
import { renderWithProviders } from '@tests/helpers';

function photos(count: number) {
  return Array.from({ length: count }, (_, index) => buildDiaryPhoto({
    id: `33333333-3333-4333-8333-33333333333${index}`,
    uri: `file:///moment-${index}.jpg`,
  }));
}

describe('MomentPhotoGrid', () => {
  it('lets users choose a moment photo layout while editing', async () => {
    const onChangeLayout = jest.fn();
    const { getByTestId, queryByTestId } = await renderWithProviders(
      <MomentPhotoGrid
        photos={photos(3)}
        editable
        layout="grid"
        onChangeLayout={onChangeLayout}
        testID="moment-grid"
      />,
    );

    expect(queryByTestId('moment-grid-layout-auto')).toBeNull();
    expect(getByTestId('moment-grid-layout-album')).toBeTruthy();

    await fireEvent.press(getByTestId('moment-grid-layout-feature'));

    expect(onChangeLayout).toHaveBeenCalledWith('feature');
  });

  it('lets users choose album after stacked', async () => {
    const onChangeLayout = jest.fn();
    const { getByTestId } = await renderWithProviders(
      <MomentPhotoGrid
        photos={photos(3)}
        editable
        layout="grid"
        onChangeLayout={onChangeLayout}
        testID="moment-grid"
      />,
    );

    await fireEvent.press(getByTestId('moment-grid-layout-album'));

    expect(onChangeLayout).toHaveBeenCalledWith('album');
  });

  it('renders feature layouts with the first photo full width', async () => {
    const { getByTestId, queryByTestId } = await renderWithProviders(
      <MomentPhotoGrid
        photos={photos(3)}
        layout="feature"
        testID="moment-grid"
      />,
    );

    expect(getByTestId('moment-grid-photo-0')).toBeTruthy();
    expect(getByTestId('moment-grid-photo-2')).toBeTruthy();
    expect(queryByTestId('moment-grid-spacer-0')).toBeNull();
  });

  it('keeps odd grid rows at the same tile height', async () => {
    const { getByTestId } = await renderWithProviders(
      <MomentPhotoGrid
        photos={photos(3)}
        layout="grid"
        testID="moment-grid"
      />,
    );

    expect(getByTestId('moment-grid-row-1').props.children).toHaveLength(2);
    expect(getByTestId('moment-grid-spacer-1')).toBeTruthy();
  });

  it('adds space between photos while editing', async () => {
    const { getByTestId } = await renderWithProviders(
      <MomentPhotoGrid
        photos={photos(2)}
        editable
        layout="grid"
        testID="moment-grid"
      />,
    );

    expect(StyleSheet.flatten(getByTestId('moment-grid-row-0').props.style).gap).toBe(8);
  });

  it('opens read-only moment photos in a centered preview', async () => {
    const { getByTestId } = await renderWithProviders(
      <MomentPhotoGrid
        photos={photos(2)}
        layout="auto"
        previewable
        testID="moment-grid"
      />,
    );

    await fireEvent.press(getByTestId('moment-grid-photo-0'));

    expect(getByTestId('moment-grid-photo-0-preview-indicator')).toBeTruthy();

    await waitFor(() => {
      expect(getByTestId('moment-grid-photo-viewer-image').props.source).toEqual({
        uri: 'file:///moment-0.jpg',
      });
    });
  });

  it('renders album layouts in a horizontal pager', async () => {
    const { getByTestId, queryByTestId } = await renderWithProviders(
      <MomentPhotoGrid
        photos={photos(2)}
        layout="album"
        previewable
        testID="moment-grid"
      />,
    );

    expect(getByTestId('moment-grid-album')).toBeTruthy();
    expect(getByTestId('moment-grid-album-scroll')).toBeTruthy();
    expect(getByTestId('moment-grid-album-count').props.children.props.children).toBe('1/2');
    expect(getByTestId('moment-grid-photo-0-preview-indicator')).toBeTruthy();
    expect(queryByTestId('moment-grid-row-0')).toBeNull();
  });

  it('keeps the add button visible when an editable album is empty', async () => {
    const onAddPhoto = jest.fn();
    const { getByTestId } = await renderWithProviders(
      <MomentPhotoGrid
        photos={[]}
        editable
        layout="album"
        onAddPhoto={onAddPhoto}
        testID="moment-grid"
      />,
    );

    const albumStyle = StyleSheet.flatten(getByTestId('moment-grid-album').props.style);
    const addStyle = StyleSheet.flatten(getByTestId('moment-grid-add').props.style);

    expect(albumStyle.aspectRatio).toBe(1.2);
    expect(addStyle.aspectRatio).toBe(1.2);
    expect(addStyle.borderStyle).toBe('dashed');
    expect(getByTestId('moment-grid-add')).toBeTruthy();
  });
});
