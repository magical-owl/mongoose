import { act, fireEvent } from '@testing-library/react-native';
import type React from 'react';
import { RichTextFormattingDrawer } from '@/features/diary/components/RichTextFormattingDrawer';
import { renderWithProviders } from '@tests/helpers';

jest.mock('@shared/components/Modal', () => {
  const { View, Text } = jest.requireActual<typeof import('react-native')>('react-native');

  interface MockModalProps {
    readonly visible: boolean;
    readonly children: React.ReactNode;
    readonly title?: string;
    readonly accessibilityLabel?: string;
  }

  return {
    Modal: ({ visible, children, title, accessibilityLabel }: MockModalProps) => (
      visible ? (
        <View accessibilityLabel={accessibilityLabel}>
          {title ? <Text>{title}</Text> : null}
          {children}
        </View>
      ) : null
    ),
  };
});

describe('RichTextFormattingDrawer', () => {
  it('groups color, font, and formatting controls in one modal', async () => {
    const onDismiss = jest.fn();
    const onSelect = jest.fn();
    const onSelectFontFamily = jest.fn();
    const onSelectTextColor = jest.fn();

    const { getByTestId, getByText } = await renderWithProviders(
      <RichTextFormattingDrawer
        visible
        onDismiss={onDismiss}
        items={[{ kind: 'bold', icon: 'format-bold' }]}
        onSelect={onSelect}
        selectedFontFamily="system"
        selectedTextColor="#FFF7E6"
        onSelectFontFamily={onSelectFontFamily}
        onSelectTextColor={onSelectTextColor}
      />,
      { wrapperOptions: { initialThemeMode: 'dark' } },
    );

    expect(getByText('Text style')).toBeTruthy();
    expect(getByText('Body color')).toBeTruthy();
    expect(getByText('Body font')).toBeTruthy();
    expect(getByText('Formatting')).toBeTruthy();

    await act(async () => {
      fireEvent.press(getByTestId('rich-text-color-option-rose'));
    });
    expect(onSelectTextColor).toHaveBeenCalledWith('#F3C6C1');

    await act(async () => {
      fireEvent.press(getByTestId('rich-text-font-option-lora'));
    });
    expect(onSelectFontFamily).toHaveBeenCalledWith('lora');

    await act(async () => {
      fireEvent.press(getByTestId('rich-text-format-bold-button'));
    });
    expect(onSelect).toHaveBeenCalledWith('bold');
  });
});
