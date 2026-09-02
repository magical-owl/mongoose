import { type ComponentProps } from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '@/providers/ThemeProvider';
import type { FormatActionKind } from '@/shared/components/RichTextEditor';
import { Text } from '@/shared/components/Text';
import { Modal } from '@shared/components/Modal';
import { DIARY_BODY_TEXT_COLORS, type DiaryBodyFontFamily, type DiaryBodyTextColor } from '@/features/diary/domain/DiaryBodyStyle';
import { useTranslation } from '@/localization/i18n';
import { appFontOptions, resolveAppFontFamily } from '@/theme/fonts';

export interface RichTextFormatItem {
  readonly kind: FormatActionKind;
  readonly icon: ComponentProps<typeof MaterialCommunityIcons>['name'];
}

interface RichTextFormattingDrawerProps {
  readonly visible: boolean;
  readonly onDismiss: () => void;
  readonly items: readonly RichTextFormatItem[];
  readonly onSelect: (kind: FormatActionKind) => void;
  readonly selectedFontFamily?: DiaryBodyFontFamily;
  readonly selectedTextColor?: DiaryBodyTextColor;
  readonly onSelectFontFamily?: (fontFamily: DiaryBodyFontFamily) => void;
  readonly onSelectTextColor?: (textColor: DiaryBodyTextColor | undefined) => void;
}

export function RichTextFormattingDrawer({
  visible,
  onDismiss,
  items,
  onSelect,
  selectedFontFamily,
  selectedTextColor,
  onSelectFontFamily,
  onSelectTextColor,
}: RichTextFormattingDrawerProps): React.JSX.Element {
  const theme = useTheme();
  const t = useTranslation();

  return (
    <Modal
      visible={visible}
      onDismiss={onDismiss}
      title={t('entryFormattingTitle')}
      accessibilityLabel={t('entryFormattingTitle')}
      scrollable={false}
    >
      <View testID="rich-text-formatting-drawer" style={styles.modalContent}>
        {onSelectTextColor ? (
          <View>
            <Text preset="caption" color="textSecondary" style={styles.sectionLabel}>
              {t('entryBodyColorSection')}
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              keyboardShouldPersistTaps="always"
              contentContainerStyle={styles.horizontalOptions}
            >
              <TouchableOpacity
                testID="rich-text-color-option-default"
                onPress={() => onSelectTextColor(undefined)}
                activeOpacity={0.7}
                accessibilityRole="radio"
                accessibilityState={{ selected: selectedTextColor === undefined }}
                accessibilityLabel={t('entryBodyTextColorDefaultA11y')}
                style={[
                  styles.colorChip,
                  {
                    borderColor: selectedTextColor === undefined ? theme.colors.tint : theme.colors.border,
                    backgroundColor: theme.colors.surface,
                  },
                ]}
              >
                <View style={[styles.colorPreview, { backgroundColor: theme.colors.text }]} />
                <Text preset="caption" color="text" style={styles.colorLabel}>
                  {t('entryBodyTextColorDefaultLabel')}
                </Text>
              </TouchableOpacity>
              {DIARY_BODY_TEXT_COLORS.map((option) => {
                const active = selectedTextColor === option.value;
                const textColor = option.value;
                return (
                  <TouchableOpacity
                    key={option.id}
                    testID={`rich-text-color-option-${option.id}`}
                    onPress={() => onSelectTextColor(option.value)}
                    activeOpacity={0.7}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: active }}
                    accessibilityLabel={`${t('entryBodyTextColorA11y')} ${option.label}`}
                    style={[
                      styles.colorChip,
                      {
                        borderColor: active ? theme.colors.tint : theme.colors.border,
                        backgroundColor: theme.colors.surface,
                      },
                    ]}
                  >
                    <View style={[styles.colorPreview, { backgroundColor: textColor }]} />
                    <Text preset="caption" color={active ? 'tint' : 'text'} style={styles.colorLabel}>
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        ) : null}

        {onSelectFontFamily ? (
          <View>
            <Text preset="caption" color="textSecondary" style={styles.sectionLabel}>
              {t('entryBodyFontSection')}
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              keyboardShouldPersistTaps="always"
              contentContainerStyle={styles.horizontalOptions}
            >
              {appFontOptions.map((option) => {
                const active = selectedFontFamily === option.value;
                const fontFamily = resolveAppFontFamily(option.value, true);
                return (
                  <TouchableOpacity
                    key={option.value}
                    testID={`rich-text-font-option-${option.value}`}
                    onPress={() => onSelectFontFamily(option.value)}
                    activeOpacity={0.7}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: active }}
                    accessibilityLabel={`${t('entryBodyFontA11y')} ${option.label}`}
                    style={[
                      styles.fontChip,
                      {
                        borderColor: active ? theme.colors.tint : theme.colors.border,
                        backgroundColor: active ? theme.colors.tint + '18' : theme.colors.surface,
                      },
                    ]}
                  >
                    <Text
                      preset="body"
                      color={active ? 'tint' : 'text'}
                      style={[styles.fontOptionTitle, { fontFamily }]}
                      numberOfLines={1}
                    >
                      {option.label}
                    </Text>
                    <Text preset="caption" color="textSecondary" style={{ fontFamily }} numberOfLines={1}>
                      {option.previewText}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        ) : null}

        <View>
          <Text preset="caption" color="textSecondary" style={styles.sectionLabel}>
            {t('entryFormattingToolsSection')}
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            keyboardShouldPersistTaps="always"
            contentContainerStyle={styles.horizontalOptions}
          >
            {items.map((item) => (
              <TouchableOpacity
                key={item.kind}
                testID={`rich-text-format-${item.kind}-button`}
                style={[
                  styles.formatChip,
                  {
                    borderColor: theme.colors.border,
                    backgroundColor: theme.colors.surface,
                  },
                ]}
                onPress={() => onSelect(item.kind)}
                activeOpacity={0.6}
                accessibilityLabel={item.kind}
                accessibilityRole="button"
              >
                <MaterialCommunityIcons name={item.icon} size={24} color={theme.colors.text} />
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContent: {
    gap: 18,
    paddingBottom: 12,
  },
  sectionLabel: {
    marginBottom: 8,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  horizontalOptions: {
    gap: 10,
    paddingRight: 18,
  },
  colorChip: {
    minWidth: 82,
    minHeight: 74,
    borderWidth: 1,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  colorPreview: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#00000022',
    marginBottom: 8,
  },
  colorLabel: {
    fontWeight: '700',
  },
  fontChip: {
    minWidth: 104,
    minHeight: 66,
    borderWidth: 1,
    borderRadius: 8,
    justifyContent: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  fontOptionTitle: {
    fontWeight: '800',
    marginBottom: 2,
  },
  formatChip: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: 8,
  },
});
