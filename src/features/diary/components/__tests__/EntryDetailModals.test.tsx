import { fireEvent } from '@testing-library/react-native';
import { EntryDetailModals } from '@/features/diary/components/EntryDetailModals';
import type { RichTextFormatItem } from '@/features/diary/components/RichTextFormattingDrawer';
import { renderWithProviders } from '@tests/helpers';
import { buildDiaryEntry } from '@tests/fixtures/domain';

jest.mock('@/features/diary/components/RichTextFormattingDrawer', () => {
  const React = jest.requireActual<typeof import('react')>('react');
  const { Text, View } = jest.requireActual<typeof import('react-native')>('react-native');

  return {
    RichTextFormattingDrawer: ({
      visible,
      onSelect,
      onSelectFontFamily,
      onSelectTextColor,
    }: {
      readonly visible: boolean;
      readonly onSelect: (kind: string) => void;
      readonly onSelectFontFamily?: (fontFamily: string) => void;
      readonly onSelectTextColor?: (textColor: string | undefined) => void;
    }) => React.createElement(
      View,
      { testID: 'mock-formatting-drawer' },
      React.createElement(Text, null, visible ? 'formatting-visible' : 'formatting-hidden'),
      React.createElement(Text, { onPress: () => onSelect('bold') }, 'Bold action'),
      React.createElement(Text, { onPress: () => onSelectFontFamily?.('lora') }, 'Font action'),
      React.createElement(Text, { onPress: () => onSelectTextColor?.('#F3C6C1') }, 'Color action'),
    ),
  };
});

jest.mock('@/features/diary/components/StickerPickerModal', () => ({
  StickerPickerModal: ({ visible }: { readonly visible: boolean }) => {
    const React = jest.requireActual<typeof import('react')>('react');
    const { Text, View } = jest.requireActual<typeof import('react-native')>('react-native');
    return React.createElement(View, { testID: 'mock-sticker-picker' }, React.createElement(Text, null, visible ? 'sticker-visible' : 'sticker-hidden'));
  },
}));

jest.mock('@/features/diary/components/TemplatePickerModal', () => ({
  TemplatePickerModal: ({ visible }: { readonly visible: boolean }) => {
    const React = jest.requireActual<typeof import('react')>('react');
    const { Text, View } = jest.requireActual<typeof import('react-native')>('react-native');
    return React.createElement(View, { testID: 'mock-template-picker' }, React.createElement(Text, null, visible ? 'template-visible' : 'template-hidden'));
  },
}));

jest.mock('@/features/diary/components/DiaryPaperBackgroundPickerModal', () => ({
  DiaryPaperBackgroundPickerModal: ({ visible }: { readonly visible: boolean }) => {
    const React = jest.requireActual<typeof import('react')>('react');
    const { Text, View } = jest.requireActual<typeof import('react-native')>('react-native');
    return React.createElement(View, { testID: 'mock-paper-picker' }, React.createElement(Text, null, visible ? 'paper-visible' : 'paper-hidden'));
  },
}));

jest.mock('@/shared/components/PaywallModal', () => ({
  PaywallModal: ({ visible }: { readonly visible: boolean }) => {
    const React = jest.requireActual<typeof import('react')>('react');
    const { Text, View } = jest.requireActual<typeof import('react-native')>('react-native');
    return React.createElement(View, { testID: 'mock-paywall-modal' }, React.createElement(Text, null, visible ? 'paywall-visible' : 'paywall-hidden'));
  },
}));

jest.mock('@/features/diary/components/EntryReflectionsModal', () => ({
  EntryReflectionsModal: ({ visible }: { readonly visible: boolean }) => {
    const React = jest.requireActual<typeof import('react')>('react');
    const { Text, View } = jest.requireActual<typeof import('react-native')>('react-native');
    return React.createElement(View, { testID: 'mock-reflections-modal' }, React.createElement(Text, null, visible ? 'reflections-visible' : 'reflections-hidden'));
  },
}));

jest.mock('@/features/diary/components/EntryMetadataModal', () => ({
  EntryMetadataModal: ({ visible }: { readonly visible: boolean }) => {
    const React = jest.requireActual<typeof import('react')>('react');
    const { Text, View } = jest.requireActual<typeof import('react-native')>('react-native');
    return React.createElement(View, { testID: 'mock-metadata-modal' }, React.createElement(Text, null, visible ? 'metadata-visible' : 'metadata-hidden'));
  },
}));

const formatItems: readonly RichTextFormatItem[] = [
  { kind: 'bold', icon: 'format-bold' },
];

const entry = buildDiaryEntry({
  content: '<p>Body</p>',
  paperBackgroundId: 'vintage-parchment',
  createdAt: '2026-08-29T01:58:00.000Z',
  updatedAt: '2026-08-29T01:58:00.000Z',
});

describe('EntryDetailModals', () => {
  it('renders modal surfaces and routes formatting callbacks', async () => {
    const onSelectFormat = jest.fn();
    const onSelectFontFamily = jest.fn();
    const onSelectTextColor = jest.fn();

    const { getByText, getByTestId } = await renderWithProviders(
      <EntryDetailModals
        entry={entry}
        profile={null}
        timeFormat="24-hour"
        journals={[]}
        availableTags={[]}
        isEditing
        formatItems={formatItems}
        showFormattingTools
        showStickerPicker={false}
        showTemplatePicker={false}
        showPaperBackgroundPicker={false}
        showPremiumModal={false}
        showReflections={false}
        showEntryMetadata={false}
        editBodyFontFamily="system"
        editBodyTextColor={undefined}
        selectedPaperBackgroundId="blank"
        editMoods={['neutral']}
        selectedJournalIds={[]}
        selectedTags={[]}
        onDismissFormattingTools={jest.fn()}
        onSelectFormat={onSelectFormat}
        onSelectFontFamily={onSelectFontFamily}
        onSelectTextColor={onSelectTextColor}
        onCloseStickerPicker={jest.fn()}
        onSelectSticker={jest.fn()}
        onRequestPremium={jest.fn()}
        onCloseTemplatePicker={jest.fn()}
        onSelectTemplate={jest.fn()}
        onSelectPaperBackground={jest.fn()}
        onDismissPaperBackgroundPicker={jest.fn()}
        onClosePremiumModal={jest.fn()}
        onDismissReflections={jest.fn()}
        onAddReflection={jest.fn()}
        onDeleteReflection={jest.fn()}
        onDismissEntryMetadata={jest.fn()}
        onChangeMoods={jest.fn()}
        onChangeJournalIds={jest.fn()}
        onChangeTags={jest.fn()}
      />,
      { wrapperOptions: { initialThemeMode: 'dark' } },
    );

    fireEvent.press(getByText('Bold action'));
    fireEvent.press(getByText('Font action'));
    fireEvent.press(getByText('Color action'));

    expect(getByTestId('mock-formatting-drawer')).toBeTruthy();
    expect(getByText('formatting-visible')).toBeTruthy();
    expect(getByTestId('mock-sticker-picker')).toBeTruthy();
    expect(getByTestId('mock-template-picker')).toBeTruthy();
    expect(getByTestId('mock-paper-picker')).toBeTruthy();
    expect(getByTestId('mock-paywall-modal')).toBeTruthy();
    expect(getByTestId('mock-reflections-modal')).toBeTruthy();
    expect(getByTestId('mock-metadata-modal')).toBeTruthy();
    expect(onSelectFormat).toHaveBeenCalledWith('bold');
    expect(onSelectFontFamily).toHaveBeenCalledWith('lora');
    expect(onSelectTextColor).toHaveBeenCalledWith('#F3C6C1');
  });
});
