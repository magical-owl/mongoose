import { ImageBackground, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '@providers/ThemeProvider';
import { Modal } from '@shared/components/Modal';
import { Text } from '@shared/components/Text';
import { DIARY_PAPER_BACKGROUNDS } from '@/features/diary/domain/DiaryPaperBackgrounds';
import { useTranslation } from '@/localization/i18n';

interface DiaryPaperBackgroundPickerModalProps {
  readonly visible: boolean;
  readonly selectedPaperBackgroundId: string;
  readonly onSelect: (paperBackgroundId: string) => void;
  readonly onDismiss: () => void;
}

export function DiaryPaperBackgroundPickerModal({
  visible,
  selectedPaperBackgroundId,
  onSelect,
  onDismiss,
}: DiaryPaperBackgroundPickerModalProps): React.JSX.Element {
  const theme = useTheme();
  const t = useTranslation();

  return (
    <Modal
      visible={visible}
      onDismiss={onDismiss}
      title={t('entryPaperBackgroundTitle')}
      accessibilityLabel={t('entryPaperBackgroundPickerA11y')}
      scrollable={false}
    >
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.list}
      >
        {DIARY_PAPER_BACKGROUNDS.map((background) => {
          const selected = selectedPaperBackgroundId === background.id;
          const selectedBadge = selected ? (
            <View style={[styles.selectedBadge, { backgroundColor: theme.colors.tint }]}>
              <MaterialCommunityIcons name="check" size={16} color={theme.colors.background} />
            </View>
          ) : null;

          return (
            <TouchableOpacity
              key={background.id}
              onPress={() => {
                onSelect(background.id);
                onDismiss();
              }}
              style={[
                styles.option,
                {
                  borderColor: selected ? theme.colors.tint : theme.colors.border,
                  backgroundColor: theme.colors.surface,
                },
              ]}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              accessibilityLabel={`${t('entryPaperBackgroundSelectA11y')} ${background.label}`}
              testID={`entry-paper-background-${background.id}`}
            >
              {background.source ? (
                <ImageBackground
                  source={background.source}
                  resizeMode="cover"
                  style={styles.preview}
                  imageStyle={styles.previewImage}
                >
                  <View
                    style={[
                      StyleSheet.absoluteFill,
                      { backgroundColor: theme.isDark ? 'rgba(0, 0, 0, 0.18)' : 'rgba(255, 255, 255, 0.08)' },
                    ]}
                  />
                  {selectedBadge}
                </ImageBackground>
              ) : (
                <View
                  style={[
                    styles.preview,
                    styles.blankPreview,
                    {
                      backgroundColor: theme.colors.card,
                      borderColor: theme.colors.border,
                    },
                  ]}
                >
                  {selectedBadge}
                </View>
              )}
              <Text preset="caption" style={[styles.label, { color: selected ? theme.colors.tint : theme.colors.text }]}>
                {background.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: 12,
    paddingBottom: 12,
  },
  option: {
    width: 142,
    borderWidth: 2,
    borderRadius: 8,
    overflow: 'hidden',
  },
  preview: {
    height: 112,
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
  },
  blankPreview: {
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  previewImage: {
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
  },
  selectedBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    margin: 8,
  },
  label: {
    minHeight: 38,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 13,
    lineHeight: 17,
    fontWeight: '800',
  },
});
