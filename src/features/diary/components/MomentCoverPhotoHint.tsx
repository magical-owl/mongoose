import { Alert, Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/providers/ThemeProvider';
import { Text } from '@/shared/components/Text';
import { useTranslation } from '@/localization/i18n';
import { useAppStore } from '@/stores/useAppStore';

interface MomentCoverPhotoHintProps {
  readonly testID?: string;
}

export function MomentCoverPhotoHint({ testID = 'moment-cover-photo-hint' }: MomentCoverPhotoHintProps) {
  const theme = useTheme();
  const t = useTranslation();
  const showTips = useAppStore((state) => state.showTips);
  const tipDismissNoticeShown = useAppStore((state) => state.tipDismissNoticeShown);
  const setShowTips = useAppStore((state) => state.setShowTips);
  const markTipDismissNoticeShown = useAppStore((state) => state.markTipDismissNoticeShown);

  if (!showTips) return null;

  const handleDismiss = () => {
    setShowTips(false);
    if (!tipDismissNoticeShown) {
      markTipDismissNoticeShown();
      Alert.alert(t('tipsDismissedTitle'), t('tipsDismissedMessage'));
    }
  };

  return (
    <View
      style={[
        styles.root,
        {
          backgroundColor: theme.colors.card + 'CC',
          borderColor: theme.colors.tint + '66',
        },
      ]}
      testID={testID}
    >
      <View style={styles.header}>
        <Text style={[styles.kicker, { color: theme.colors.tint }]}>
          {t('commonTip')}
        </Text>
        <Pressable
          onPress={handleDismiss}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel={t('tipsDismissA11y')}
          testID={`${testID}-dismiss`}
        >
          <Ionicons name="close" size={18} color={theme.colors.textSecondary} />
        </Pressable>
      </View>
      <Text style={[styles.text, { color: theme.colors.text }]}>{t('entryMomentCoverPhotoHint')}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  kicker: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0,
    textTransform: 'uppercase',
  },
  text: {
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 18,
  },
});
