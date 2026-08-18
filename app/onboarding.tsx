import { Image, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Redirect, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '@/shared/components/Text';
import { useTheme } from '@/providers/ThemeProvider';
import { APP_LANGUAGES, appText, useTranslation, type TranslationKey } from '@/localization/i18n';
import { useAppStore } from '@/stores/useAppStore';

const ONBOARDING_POINTS: readonly {
  readonly icon: keyof typeof Ionicons.glyphMap;
  readonly title: TranslationKey;
  readonly body: TranslationKey;
}[] = [
  {
    icon: 'lock-closed-outline',
    title: 'onboardingPrivateTitle',
    body: 'onboardingPrivateBody',
  },
  {
    icon: 'git-branch-outline',
    title: 'onboardingReflectTitle',
    body: 'onboardingReflectBody',
  },
  {
    icon: 'calendar-outline',
    title: 'onboardingReviewTitle',
    body: 'onboardingReviewBody',
  },
];

export default function OnboardingScreen(): React.JSX.Element {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const t = useTranslation();
  const isOnboarded = useAppStore((state) => state.isOnboarded);
  const appLanguage = useAppStore((state) => state.appLanguage);
  const setAppLanguage = useAppStore((state) => state.setAppLanguage);
  const setOnboardingStatus = useAppStore((state) => state.setOnboardingStatus);

  if (isOnboarded) {
    return <Redirect href="/(tabs)" />;
  }

  const completeOnboarding = () => {
    setOnboardingStatus('completed');
    router.replace('/(tabs)');
  };

  return (
    <View style={[styles.root, { backgroundColor: theme.colors.background, paddingTop: insets.top + 18 }]}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 28 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          <Image source={require('../assets/icon.png')} style={styles.icon} resizeMode="contain" />
          <Text preset="caption" color="tint" style={styles.kicker}>
            {t('onboardingKicker')}
          </Text>
          <Text preset="h1" color="text" style={styles.title}>
            {appText(t('onboardingTitle'))}
          </Text>
          <Text preset="body" color="textSecondary" style={styles.subtitle}>
            {t('onboardingSubtitle')}
          </Text>
        </View>

        <View style={[styles.languageSection, { borderColor: theme.colors.border }]}>
          <Text preset="caption" color="textSecondary" style={styles.languageLabel}>
            {t('onboardingLanguage')}
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.languageScroll}
            contentContainerStyle={styles.languageOptions}
          >
            {APP_LANGUAGES.map((language) => {
              const selected = language.value === appLanguage;
              return (
                <TouchableOpacity
                  key={language.value}
                  onPress={() => setAppLanguage(language.value)}
                  style={[
                    styles.languageChip,
                    {
                      borderColor: selected ? theme.colors.tint : theme.colors.border,
                      backgroundColor: selected ? `${theme.colors.tint}18` : theme.colors.surface,
                    },
                  ]}
                  accessibilityRole="radio"
                  accessibilityState={{ selected }}
                  accessibilityLabel={language.label}
                >
                  <Text preset="caption" color={selected ? 'tint' : 'text'} style={styles.languageChipText}>
                    {language.nativeLabel}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        <View style={styles.points}>
          {ONBOARDING_POINTS.map((point) => (
            <View key={point.title} style={[styles.pointRow, { borderColor: theme.colors.border }]}>
              <View style={[styles.pointIcon, { backgroundColor: `${theme.colors.tint}18` }]}>
                <Ionicons name={point.icon} size={22} color={theme.colors.tint} />
              </View>
              <View style={styles.pointCopy}>
                <Text preset="label" color="text" style={styles.pointTitle}>
                  {t(point.title)}
                </Text>
                <Text preset="bodySmall" color="textSecondary" style={styles.pointBody}>
                  {t(point.body)}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 14, backgroundColor: theme.colors.background }]}>
        <TouchableOpacity
          onPress={completeOnboarding}
          style={[styles.startButton, { backgroundColor: theme.colors.tint }]}
          accessibilityRole="button"
          accessibilityLabel={t('onboardingStart')}
        >
          <Text preset="label" style={[styles.startButtonText, { color: theme.isDark ? theme.colors.background : theme.colors.card }]}>
            {t('onboardingStart')}
          </Text>
          <Ionicons name="arrow-forward" size={18} color={theme.isDark ? theme.colors.background : theme.colors.card} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 24,
  },
  hero: {
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 20,
  },
  icon: {
    width: 112,
    height: 112,
    borderRadius: 24,
    marginBottom: 18,
  },
  kicker: {
    fontWeight: '700',
    marginBottom: 10,
    textAlign: 'center',
  },
  title: {
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    textAlign: 'center',
    lineHeight: 24,
    maxWidth: 330,
  },
  points: {
    gap: 12,
  },
  languageSection: {
    borderTopWidth: 1,
    borderBottomWidth: 1,
    paddingVertical: 14,
    marginBottom: 12,
  },
  languageLabel: {
    fontWeight: '700',
    marginBottom: 10,
  },
  languageScroll: {
    height: 36,
    maxHeight: 36,
    flexGrow: 0,
    flexShrink: 0,
  },
  languageOptions: {
    height: 36,
    alignItems: 'flex-start',
    gap: 8,
    paddingRight: 4,
  },
  languageChip: {
    alignSelf: 'flex-start',
    minHeight: 32,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  languageChipText: {
    fontWeight: '700',
  },
  pointRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderBottomWidth: 1,
    paddingVertical: 14,
  },
  pointIcon: {
    width: 42,
    height: 42,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  pointCopy: {
    flex: 1,
  },
  pointTitle: {
    fontWeight: '700',
    marginBottom: 4,
  },
  pointBody: {
    lineHeight: 20,
  },
  footer: {
    paddingHorizontal: 24,
    paddingTop: 14,
  },
  startButton: {
    minHeight: 52,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  startButtonText: {
    fontWeight: '700',
  },
});
