import { useState } from 'react';
import { Image, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Redirect, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '@/shared/components/Text';
import { useTheme, type ThemeMode } from '@/providers/ThemeProvider';
import { APP_LANGUAGES, appText, useTranslation, type TranslationKey } from '@/localization/i18n';
import { useAppStore, type FontScale, type TimeFormat } from '@/stores/useAppStore';
import { colorThemes, type ColorTheme } from '@/theme/colorThemes';
import { accentColors, type AccentColor } from '@/theme/accents';

type OnboardingStep = 0 | 1 | 2;

const ONBOARDING_STEP_COUNT = 3;

const THEME_MODE_OPTIONS: readonly { readonly value: ThemeMode; readonly label: TranslationKey }[] = [
  { value: 'dark', label: 'settingsThemeDark' },
  { value: 'light', label: 'settingsThemeLight' },
  { value: 'system', label: 'settingsThemeSystem' },
];

const COLOR_THEME_OPTIONS: readonly ColorTheme[] = ['default', 'sage', 'amber', 'rose'];
const ACCENT_COLOR_OPTIONS: readonly AccentColor[] = ['red', 'orange', 'yellow', 'green', 'blue', 'indigo', 'violet', 'teal', 'coral', 'rose', 'plum', 'mint', 'slate'];

const FONT_SCALE_OPTIONS: readonly { readonly value: FontScale; readonly label: TranslationKey }[] = [
  { value: 'small', label: 'settingsFontSmall' },
  { value: 'default', label: 'settingsFontDefault' },
  { value: 'large', label: 'settingsFontLarge' },
];

const TIME_FORMAT_OPTIONS: readonly { readonly value: TimeFormat; readonly label: string }[] = [
  { value: '24-hour', label: '24h' },
  { value: '12-hour', label: '12h' },
];

const READY_POINTS: readonly {
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
  const [step, setStep] = useState<OnboardingStep>(0);
  const isOnboarded = useAppStore((state) => state.isOnboarded);
  const appLanguage = useAppStore((state) => state.appLanguage);
  const themeMode = useAppStore((state) => state.themeMode);
  const accentColor = useAppStore((state) => state.accentColor);
  const colorTheme = useAppStore((state) => state.colorTheme);
  const fontScale = useAppStore((state) => state.fontScale);
  const timeFormat = useAppStore((state) => state.timeFormat);
  const setAppLanguage = useAppStore((state) => state.setAppLanguage);
  const setThemeMode = useAppStore((state) => state.setThemeMode);
  const setAccentColor = useAppStore((state) => state.setAccentColor);
  const setColorTheme = useAppStore((state) => state.setColorTheme);
  const setFontScale = useAppStore((state) => state.setFontScale);
  const setTimeFormat = useAppStore((state) => state.setTimeFormat);
  const setOnboardingStatus = useAppStore((state) => state.setOnboardingStatus);

  if (isOnboarded) {
    return <Redirect href="/(tabs)" />;
  }

  const completeOnboarding = () => {
    setOnboardingStatus('completed');
    router.replace('/entry/new');
  };

  const goNext = () => {
    if (step === 2) {
      completeOnboarding();
      return;
    }
    setStep((current) => (current + 1) as OnboardingStep);
  };

  const goBack = () => {
    setStep((current) => (current > 0 ? (current - 1) as OnboardingStep : current));
  };

  const buttonLabel = step === 0
    ? t('onboardingGetStarted')
    : step === 1
      ? t('onboardingContinue')
      : t('onboardingStart');

  return (
    <View style={[styles.root, { backgroundColor: theme.colors.background, paddingTop: insets.top + 14 }]}>
      <View style={styles.topBar}>
        {step > 0 ? (
          <TouchableOpacity onPress={goBack} style={styles.backButton} accessibilityRole="button" accessibilityLabel={t('onboardingBack')}>
            <Ionicons name="chevron-back" size={20} color={theme.colors.textSecondary} />
            <Text preset="label" color="textSecondary" style={styles.backText}>{t('onboardingBack')}</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.backButtonPlaceholder} />
        )}
        <View style={styles.stepDots} accessibilityLabel={`${step + 1} / ${ONBOARDING_STEP_COUNT}`}>
          {Array.from({ length: ONBOARDING_STEP_COUNT }, (_, index) => (
            <View
              key={index}
              style={[
                styles.stepDot,
                {
                  width: index === step ? 34 : 8,
                  backgroundColor: index === step ? theme.colors.tint : theme.colors.border,
                },
              ]}
            />
          ))}
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 104 }]}
        showsVerticalScrollIndicator={false}
      >
        {step === 0 && (
          <View style={styles.languageStep}>
            <View style={styles.starField}>
              <Text style={[styles.star, styles.starTopLeft, { color: theme.colors.tint }]}>✦</Text>
              <Text style={[styles.star, styles.starTopRight, { color: theme.colors.tint }]}>✦</Text>
              <Text style={[styles.star, styles.starBottomRight, { color: theme.colors.tint }]}>✦</Text>
            </View>
            <Image source={require('../assets/icon.png')} style={styles.heroIcon} resizeMode="cover" />
            <Text preset="caption" color="tint" style={styles.kicker}>
              {t('onboardingLanguageKicker')}
            </Text>
            <Text preset="h1" color="text" style={styles.heroTitle}>
              {appText(t('onboardingTitle'))}
            </Text>
            <Text preset="h3" color="textSecondary" style={styles.heroSubtitle}>
              {t('onboardingLanguageSubtitle')}
            </Text>

            <View style={styles.languageGrid}>
              {APP_LANGUAGES.map((language) => {
                const selected = language.value === appLanguage;
                return (
                  <TouchableOpacity
                    key={language.value}
                    onPress={() => setAppLanguage(language.value)}
                    style={[
                      styles.languageCard,
                      {
                        borderColor: selected ? theme.colors.tint : theme.colors.border,
                        backgroundColor: selected ? `${theme.colors.tint}18` : theme.colors.surface,
                      },
                    ]}
                    accessibilityRole="radio"
                    accessibilityState={{ selected }}
                    accessibilityLabel={language.label}
                  >
                    <Text preset="label" color={selected ? 'tint' : 'text'} style={styles.choiceText}>
                      {language.nativeLabel}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {step === 1 && (
          <View>
            <Text preset="h1" color="text" style={styles.stepTitle}>
              {t('onboardingSetupTitle')}
            </Text>
            <Text preset="body" color="textSecondary" style={styles.stepSubtitle}>
              {t('onboardingSetupSubtitle')}
            </Text>

            <Text preset="caption" color="textSecondary" style={styles.sectionLabel}>{t('settingsThemeModeSection')}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.selectorSlider}>
              {THEME_MODE_OPTIONS.map((option) => {
                const selected = themeMode === option.value;
                return (
                  <TouchableOpacity
                    key={option.value}
                    onPress={() => setThemeMode(option.value)}
                    style={[
                      styles.optionCard,
                      {
                        borderColor: selected ? theme.colors.tint : theme.colors.border,
                        backgroundColor: selected ? `${theme.colors.tint}18` : theme.colors.surface,
                      },
                    ]}
                    accessibilityRole="radio"
                    accessibilityState={{ selected }}
                  >
                    <Text preset="bodySmall" color={selected ? 'tint' : 'text'} style={styles.choiceText}>{t(option.label)}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
            <Text preset="caption" color="textSecondary" style={styles.setupHint}>{t('settingsDarkModeHint')}</Text>

            <Text preset="caption" color="textSecondary" style={styles.sectionLabel}>{t('settingsColorThemeSection')}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.selectorSlider}>
              {COLOR_THEME_OPTIONS.map((value) => {
                const selected = colorTheme === value;
                return (
                  <TouchableOpacity
                    key={value}
                    onPress={() => setColorTheme(value)}
                    style={[
                      styles.colorCard,
                      {
                        borderColor: selected ? theme.colors.tint : theme.colors.border,
                        backgroundColor: selected ? `${theme.colors.tint}18` : theme.colors.surface,
                      },
                    ]}
                    accessibilityRole="radio"
                    accessibilityState={{ selected }}
                  >
                    <View style={[styles.colorSwatch, { backgroundColor: colorThemes[value].preview }]} />
                    <Text preset="bodySmall" color={selected ? 'tint' : 'text'} style={styles.choiceText}>
                      {colorThemes[value].label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
            <Text preset="caption" color="textSecondary" style={styles.setupHint}>{t('settingsColorThemeHint')}</Text>

            <Text preset="caption" color="textSecondary" style={styles.sectionLabel}>{t('settingsAccentColorSection')}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.selectorSlider}>
              {ACCENT_COLOR_OPTIONS.map((value) => {
                const selected = accentColor === value;
                return (
                  <TouchableOpacity
                    key={value}
                    onPress={() => setAccentColor(value)}
                    style={[
                      styles.accentCard,
                      {
                        borderColor: selected ? theme.colors.text : theme.colors.border,
                        backgroundColor: selected ? `${theme.colors.tint}18` : theme.colors.surface,
                      },
                    ]}
                    accessibilityRole="radio"
                    accessibilityState={{ selected }}
                    accessibilityLabel={`${accentColors[value].label} ${t('settingsAccentColorSection')}`}
                  >
                    <View style={[styles.accentSwatch, { backgroundColor: accentColors[value][theme.isDark ? 'dark' : 'light'] }]} />
                    <Text preset="bodySmall" color={selected ? 'tint' : 'text'} style={styles.choiceText}>
                      {accentColors[value].label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
            <Text preset="caption" color="textSecondary" style={styles.setupHint}>{t('settingsAccentColorHint')}</Text>

            <Text preset="caption" color="textSecondary" style={styles.sectionLabel}>{t('settingsGlobalFontSizeSection')}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.selectorSlider}>
              {FONT_SCALE_OPTIONS.map((option) => {
                const selected = fontScale === option.value;
                return (
                  <TouchableOpacity
                    key={option.value}
                    onPress={() => setFontScale(option.value)}
                    style={[
                      styles.optionCard,
                      {
                        borderColor: selected ? theme.colors.tint : theme.colors.border,
                        backgroundColor: selected ? `${theme.colors.tint}18` : theme.colors.surface,
                      },
                    ]}
                    accessibilityRole="radio"
                    accessibilityState={{ selected }}
                  >
                    <Text preset="bodySmall" color={selected ? 'tint' : 'text'} style={styles.choiceText}>{t(option.label)}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
            <Text preset="caption" color="textSecondary" style={styles.setupHint}>{t('settingsGlobalFontSizeHint')}</Text>

            <Text preset="caption" color="textSecondary" style={styles.sectionLabel}>{t('settingsTimeFormatSection')}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.selectorSlider}>
              {TIME_FORMAT_OPTIONS.map((option) => {
                const selected = timeFormat === option.value;
                return (
                  <TouchableOpacity
                    key={option.value}
                    onPress={() => setTimeFormat(option.value)}
                    style={[
                      styles.optionCard,
                      {
                        borderColor: selected ? theme.colors.tint : theme.colors.border,
                        backgroundColor: selected ? `${theme.colors.tint}18` : theme.colors.surface,
                      },
                    ]}
                    accessibilityRole="radio"
                    accessibilityState={{ selected }}
                  >
                    <Text preset="bodySmall" color={selected ? 'tint' : 'text'} style={styles.choiceText}>{option.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}

        {step === 2 && (
          <View style={styles.readyStep}>
            <View style={[styles.readyHeroMark, { borderColor: `${theme.colors.tint}42`, backgroundColor: `${theme.colors.tint}16` }]}>
              <Ionicons name="checkmark" size={32} color={theme.colors.tint} />
            </View>
            <Text preset="caption" color="tint" style={styles.readyKicker}>
              {t('onboardingReadyKicker')}
            </Text>
            <Text preset="h1" color="text" style={styles.readyHeroTitle}>
              {t('onboardingReadyTitle')}
            </Text>
            <Text preset="body" color="textSecondary" style={styles.readyHeroSubtitle}>
              {t('onboardingReadySubtitle')}
            </Text>

            <View style={[styles.readyPanel, { borderColor: theme.colors.border, backgroundColor: theme.colors.surface }]}>
              {READY_POINTS.map((point, index) => (
                <View
                  key={point.title}
                  style={[
                    styles.readyRow,
                    {
                      borderBottomColor: theme.colors.border,
                      borderBottomWidth: index === READY_POINTS.length - 1 ? 0 : StyleSheet.hairlineWidth,
                    },
                  ]}
                >
                  <View style={[styles.readyIcon, { backgroundColor: `${theme.colors.tint}12` }]}>
                    <Ionicons name={point.icon} size={18} color={theme.colors.tint} />
                  </View>
                  <View style={styles.readyCopy}>
                    <Text preset="label" color="text" style={styles.readyTitle}>{t(point.title)}</Text>
                    <Text preset="bodySmall" color="textSecondary" style={styles.readyBody}>
                      {t(point.body)}
                    </Text>
                  </View>
                </View>
              ))}
            </View>

          </View>
        )}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 14, backgroundColor: theme.colors.background }]}>
        {step === 0 && (
          <Text preset="caption" color="textSecondary" style={styles.footerNote}>
            {t('onboardingNoSignup')}
          </Text>
        )}
        <TouchableOpacity
          onPress={goNext}
          style={[styles.startButton, { backgroundColor: theme.colors.tint }]}
          accessibilityRole="button"
          accessibilityLabel={buttonLabel}
        >
          <Text preset="label" style={[styles.startButtonText, { color: theme.isDark ? theme.colors.background : theme.colors.card }]}>
            {buttonLabel}
          </Text>
          <Ionicons name="arrow-forward" size={18} color={theme.isDark ? theme.colors.background : theme.colors.card} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  topBar: {
    minHeight: 44,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    minWidth: 92,
    minHeight: 40,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButtonPlaceholder: { minWidth: 92 },
  backText: { fontWeight: '700' },
  stepDots: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stepDot: {
    height: 8,
    borderRadius: 4,
  },
  content: { paddingHorizontal: 24 },
  languageStep: {
    minHeight: 580,
    alignItems: 'center',
    justifyContent: 'center',
  },
  starField: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
  star: {
    position: 'absolute',
    fontSize: 22,
    opacity: 0.8,
  },
  starTopLeft: {
    top: 42,
    left: 28,
  },
  starTopRight: {
    top: 24,
    right: 34,
  },
  starBottomRight: {
    bottom: 168,
    right: 52,
  },
  heroIcon: {
    width: 118,
    height: 118,
    borderRadius: 28,
    marginBottom: 26,
  },
  kicker: {
    fontWeight: '800',
    letterSpacing: 4,
    marginBottom: 14,
    textAlign: 'center',
  },
  heroTitle: {
    textAlign: 'center',
    marginBottom: 18,
    fontSize: 48,
    lineHeight: 56,
    fontWeight: '900',
    fontStyle: 'italic',
  },
  heroSubtitle: {
    maxWidth: 330,
    textAlign: 'center',
    fontSize: 19,
    lineHeight: 28,
    fontWeight: '700',
  },
  languageGrid: {
    width: '100%',
    marginTop: 40,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  languageCard: {
    minHeight: 50,
    minWidth: '30%',
    flexGrow: 1,
    borderWidth: 1,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  stepTitle: {
    marginTop: 36,
    marginBottom: 18,
    fontSize: 40,
    lineHeight: 48,
    fontWeight: '900',
    fontStyle: 'italic',
  },
  stepSubtitle: {
    marginBottom: 34,
    fontSize: 18,
    lineHeight: 26,
    fontWeight: '700',
  },
  sectionLabel: {
    marginTop: 18,
    marginBottom: 10,
    fontWeight: '800',
    letterSpacing: 2,
  },
  selectorSlider: {
    flexDirection: 'row',
    gap: 10,
    paddingRight: 24,
  },
  optionCard: {
    width: 118,
    minHeight: 48,
    borderWidth: 1,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  colorCard: {
    minHeight: 52,
    borderWidth: 1,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    gap: 10,
    alignSelf: 'flex-start',
  },
  colorSwatch: {
    width: 18,
    height: 18,
    borderRadius: 9,
  },
  accentCard: {
    minHeight: 52,
    borderWidth: 1,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    gap: 10,
    alignSelf: 'flex-start',
  },
  accentSwatch: {
    width: 18,
    height: 18,
    borderRadius: 9,
  },
  choiceText: { fontWeight: '800' },
  setupHint: {
    marginTop: 8,
    lineHeight: 18,
  },
  readyStep: {
    paddingTop: 56,
    alignItems: 'center',
  },
  readyHeroMark: {
    width: 74,
    height: 74,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 22,
  },
  readyKicker: {
    marginBottom: 16,
    fontWeight: '800',
    letterSpacing: 3,
    textAlign: 'center',
  },
  readyHeroTitle: {
    marginBottom: 18,
    textAlign: 'center',
    fontSize: 40,
    lineHeight: 48,
    fontWeight: '900',
    fontStyle: 'italic',
  },
  readyHeroSubtitle: {
    maxWidth: 330,
    marginBottom: 32,
    fontSize: 18,
    lineHeight: 26,
    fontWeight: '700',
    textAlign: 'center',
  },
  readyPanel: {
    width: '100%',
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 16,
  },
  readyRow: {
    minHeight: 86,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  readyIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  readyCopy: { flex: 1 },
  readyTitle: {
    fontWeight: '800',
    marginBottom: 6,
  },
  readyBody: { lineHeight: 21 },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 24,
    paddingTop: 12,
  },
  footerNote: {
    fontWeight: '700',
    marginBottom: 14,
  },
  startButton: {
    minHeight: 56,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  startButtonText: { fontWeight: '800' },
});
