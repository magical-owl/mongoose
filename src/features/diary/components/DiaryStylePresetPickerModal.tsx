import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '@providers/ThemeProvider';
import { Modal } from '@shared/components/Modal';
import { Text } from '@shared/components/Text';
import { DiaryPaperCanvas } from '@/features/diary/components/DiaryPaperCanvas';
import {
  DIARY_STYLE_PRESETS,
  getDiaryStylePreset,
  type DiaryStylePreset,
  type DiaryStylePresetId,
} from '@/features/diary/domain/DiaryStylePreset';
import { useTranslation } from '@/localization/i18n';
import { resolveAppFontFamily } from '@/theme/fonts';
import { useSubscription } from '@/features/subscription/hooks/useSubscription';
import { canUsePremiumFeature } from '@/features/subscription/services/PremiumAccessService';

interface DiaryStylePresetPickerModalProps {
  readonly visible: boolean;
  readonly selectedPresetId: string;
  readonly onSelect: (presetId: DiaryStylePresetId) => void;
  readonly onDismiss: () => void;
  readonly onRequestPremium: () => void;
}

function getPresetLabelKey(id: DiaryStylePresetId) {
  switch (id) {
    case 'notebook':
      return 'entryStylePresetNotebook';
    case 'kraft':
      return 'entryStylePresetKraft';
    case 'minimal':
      return 'entryStylePresetMinimal';
    case 'pressed-petal':
      return 'entryStylePresetPressedPetal';
    case 'taped-note':
      return 'entryStylePresetTapedNote';
    case 'rose-letter':
      return 'entryStylePresetRoseLetter';
    case 'blue-study':
      return 'entryStylePresetBlueStudy';
    case 'cream-letter':
      return 'entryStylePresetCreamLetter';
    case 'classic':
    default:
      return 'entryStylePresetClassic';
  }
}

function getPresetDescriptionKey(id: DiaryStylePresetId) {
  switch (id) {
    case 'notebook':
      return 'entryStylePresetNotebookDescription';
    case 'kraft':
      return 'entryStylePresetKraftDescription';
    case 'minimal':
      return 'entryStylePresetMinimalDescription';
    case 'pressed-petal':
      return 'entryStylePresetPressedPetalDescription';
    case 'taped-note':
      return 'entryStylePresetTapedNoteDescription';
    case 'rose-letter':
      return 'entryStylePresetRoseLetterDescription';
    case 'blue-study':
      return 'entryStylePresetBlueStudyDescription';
    case 'cream-letter':
      return 'entryStylePresetCreamLetterDescription';
    case 'classic':
    default:
      return 'entryStylePresetClassicDescription';
  }
}

export function DiaryStylePresetPickerModal({
  visible,
  selectedPresetId,
  onSelect,
  onDismiss,
  onRequestPremium,
}: DiaryStylePresetPickerModalProps): React.JSX.Element {
  const t = useTranslation();
  const { isPro } = useSubscription();
  const selectedPreset = getDiaryStylePreset(selectedPresetId);

  return (
    <Modal
      visible={visible}
      onDismiss={onDismiss}
      title={t('entryStylePresetPickerTitle')}
      accessibilityLabel={t('entryStylePresetPickerA11y')}
      scrollable={false}
    >
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.list}
      >
        {DIARY_STYLE_PRESETS.map((preset) => {
          const selected = selectedPreset.id === preset.id;
          const locked = preset.accessTier === 'premium'
            && !canUsePremiumFeature('premium-diary-style-presets', { isPro });
          return (
            <StylePresetCard
              key={preset.id}
              preset={preset}
              selected={selected}
              locked={locked}
              label={t(getPresetLabelKey(preset.id))}
              description={t(getPresetDescriptionKey(preset.id))}
              onPress={() => {
                if (locked) {
                  onDismiss();
                  setTimeout(onRequestPremium, 250);
                  return;
                }
                onSelect(preset.id);
              }}
            />
          );
        })}
      </ScrollView>
    </Modal>
  );
}

interface StylePresetCardProps {
  readonly preset: DiaryStylePreset;
  readonly selected: boolean;
  readonly locked: boolean;
  readonly label: string;
  readonly description: string;
  readonly onPress: () => void;
}

function StylePresetCard({
  preset,
  selected,
  locked,
  label,
  description,
  onPress,
}: StylePresetCardProps): React.JSX.Element {
  const theme = useTheme();
  const textColor = preset.bodyTextColor ?? theme.colors.text;

  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        styles.option,
        {
          borderColor: selected ? theme.colors.tint : theme.colors.border,
          backgroundColor: theme.colors.surface,
        },
        locked && styles.lockedOption,
      ]}
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      accessibilityLabel={`${locked ? 'Locked. ' : ''}${label}. ${description}`}
      testID={`entry-style-preset-${preset.id}`}
    >
      <DiaryPaperCanvas
        paperBackgroundId={preset.paperBackgroundId}
        style={styles.preview}
        pointerEvents="none"
      >
        <View style={styles.previewContent}>
          <Text
            preset="body"
            style={[
              styles.previewTitle,
              {
                color: textColor,
                fontFamily: resolveAppFontFamily(preset.bodyFontFamily, true),
              },
            ]}
          >
            Aa
          </Text>
          <View style={[styles.previewLine, { backgroundColor: textColor }]} />
          <View style={[styles.previewLineShort, { backgroundColor: textColor }]} />
        </View>
        {selected ? (
          <View style={[styles.selectedBadge, { backgroundColor: theme.colors.tint }]}>
            <MaterialCommunityIcons name="check" size={16} color={theme.colors.background} />
          </View>
        ) : null}
        {locked ? (
          <View style={[styles.lockBadge, { backgroundColor: theme.colors.background }]}>
            <MaterialCommunityIcons name="lock" size={13} color={theme.colors.tint} />
          </View>
        ) : null}
      </DiaryPaperCanvas>
      <Text preset="caption" style={[styles.label, { color: selected ? theme.colors.tint : theme.colors.text }]}>
        {label}
      </Text>
      <Text preset="caption" style={[styles.description, { color: theme.colors.textSecondary }]}>
        {description}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: 12,
    paddingBottom: 12,
  },
  option: {
    width: 154,
    borderWidth: 2,
    borderRadius: 8,
    overflow: 'hidden',
  },
  preview: {
    height: 120,
  },
  previewContent: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 16,
    gap: 8,
  },
  previewTitle: {
    fontSize: 28,
    lineHeight: 32,
    fontWeight: '800',
  },
  previewLine: {
    width: '72%',
    height: 5,
    borderRadius: 3,
    opacity: 0.6,
  },
  previewLineShort: {
    width: '48%',
    height: 5,
    borderRadius: 3,
    opacity: 0.42,
  },
  selectedBadge: {
    position: 'absolute',
    right: 8,
    top: 8,
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockBadge: {
    position: 'absolute',
    left: 8,
    top: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockedOption: {
    opacity: 0.76,
  },
  label: {
    paddingHorizontal: 10,
    paddingTop: 8,
    fontSize: 13,
    lineHeight: 17,
    fontWeight: '800',
  },
  description: {
    minHeight: 42,
    paddingHorizontal: 10,
    paddingTop: 2,
    paddingBottom: 10,
    fontSize: 12,
    lineHeight: 15,
    fontWeight: '700',
  },
});
