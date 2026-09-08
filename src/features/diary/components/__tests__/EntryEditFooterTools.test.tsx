import { fireEvent } from '@testing-library/react-native';
import { EntryEditFooterTools } from '@/features/diary/components/EntryEditFooterTools';
import { renderWithProviders } from '@tests/helpers';

describe('EntryEditFooterTools', () => {
  it('renders the edit footer controls and routes primary actions', async () => {
    const onOpenMetadata = jest.fn();
    const onOpenPaperBackgroundPicker = jest.fn();
    const onAddPhotoSticker = jest.fn();

    const { getByTestId, getByText } = await renderWithProviders(
      <EntryEditFooterTools
        bottom={12}
        wordCount={42}
        stickerCount={3}
        showFormattingTools={false}
        showKeyboardDismiss={false}
        onOpenMetadata={onOpenMetadata}
        onOpenFormatting={jest.fn()}
        onOpenTemplatePicker={jest.fn()}
        onOpenPaperBackgroundPicker={onOpenPaperBackgroundPicker}
        onAddPhotoSticker={onAddPhotoSticker}
        onAddTextSticker={jest.fn()}
        onOpenStickerPicker={jest.fn()}
        onDismissKeyboard={jest.fn()}
      />,
      { wrapperOptions: { initialThemeMode: 'dark' } },
    );

    fireEvent.press(getByTestId('entry-edit-metadata-button'));
    fireEvent.press(getByTestId('entry-edit-paper-background-button'));
    fireEvent.press(getByTestId('entry-edit-add-photo-sticker-button'));

    expect(getByText('42w')).toBeTruthy();
    expect(onOpenMetadata).toHaveBeenCalled();
    expect(onOpenPaperBackgroundPicker).toHaveBeenCalled();
    expect(onAddPhotoSticker).toHaveBeenCalled();
  });
});
