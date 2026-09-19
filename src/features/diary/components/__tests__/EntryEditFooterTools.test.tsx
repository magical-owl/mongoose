import { fireEvent } from '@testing-library/react-native';
import type React from 'react';
import { EntryEditFooterTools } from '@/features/diary/components/EntryEditFooterTools';
import { renderWithProviders } from '@tests/helpers';

jest.mock('@shared/components/Modal', () => {
  const { View } = jest.requireActual<typeof import('react-native')>('react-native');

  interface MockModalProps {
    readonly visible: boolean;
    readonly children: React.ReactNode;
    readonly accessibilityLabel?: string;
  }

  return {
    Modal: ({ visible, children, accessibilityLabel }: MockModalProps) => (
      visible ? <View accessibilityLabel={accessibilityLabel}>{children}</View> : null
    ),
  };
});

describe('EntryEditFooterTools', () => {
  it('renders the edit footer controls and routes primary actions', async () => {
    const onOpenMetadata = jest.fn();

    const { getByTestId, getByText } = await renderWithProviders(
      <EntryEditFooterTools
        bottom={12}
        wordCount={42}
        stickerCount={3}
        showFormattingTools={false}
        onOpenMetadata={onOpenMetadata}
        onOpenFormatting={jest.fn()}
        onOpenTemplatePicker={jest.fn()}
        onOpenStylePresetPicker={jest.fn()}
        onOpenPaperBackgroundPicker={jest.fn()}
        onAddPhotoSticker={jest.fn()}
        onAddTextSticker={jest.fn()}
        onOpenStickerPicker={jest.fn()}
      />,
      { wrapperOptions: { initialThemeMode: 'dark' } },
    );

    await fireEvent.press(getByTestId('entry-edit-metadata-button'));

    expect(getByText('42w')).toBeTruthy();
    expect(getByTestId('entry-edit-customize-tools-button')).toBeTruthy();
    expect(getByTestId('entry-edit-insert-tools-button')).toBeTruthy();
    expect(onOpenMetadata).toHaveBeenCalled();
  });
});
