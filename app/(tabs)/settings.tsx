/**
 * Settings Screen
 *
 * Consolidated Settings & Profile screen:
 * - Title: ⚙️ Settings (24px bold)
 * - Defined option rows: Appearance, Data & Storage, Reset App
 * - Modals for Appearance and Data Export
 */

import { useCallback, useEffect, useState } from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Switch,
  Alert,
  TextInput,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/providers/ThemeProvider';
import { Text } from '@shared/components/Text';
import { Icon, type IconProps } from '@shared/components/Icon';
import { Modal } from '@shared/components/Modal';
import { PaywallModal } from '@/shared/components/PaywallModal';
import { useDiary } from '@/features/diary/hooks/useDiary';
import { useProfileForm } from '@/features/profile/hooks/useProfileForm';
import { useAppStore, type CalendarDateFormat, type FontFamily, type FontScale, type HomeViewMode, type TimeFormat } from '@/stores/useAppStore';
import { appLockService } from '@/services/AppLockService';
import { dataDeletionService } from '@/services/DataDeletionService';
import { diaryBackupService } from '@/services/DiaryBackupService';
import { useJournalExtras } from '@/features/journal/hooks/useJournalExtras';
import { accentColors, type AccentColor } from '@/theme/accents';
import { colorThemes, type ColorTheme } from '@/theme/colorThemes';
import { APP_LANGUAGES, homeViewModeLabel, premiumPaywallTitle, useTranslation } from '@/localization/i18n';
import { APP_IDENTITY } from '@/config/appIdentity';
import { FREE_PLAN_LIMITS, getLocalDateKey, getNextLocalPlanResetDate } from '@/features/subscription/services/PlanLimitService';
import { formatDisplayMonthDayYearTime, formatDisplayTime } from '@/shared/utils/timeFormat';
import { formatDisplayDate } from '@/shared/utils/dateFormat';
import { planUsageRepository } from '@/features/subscription/repositories/PlanUsageRepository';
import { useSubscription } from '@/features/subscription/hooks/useSubscription';

function withCount(value: string, count: number): string {
  return value.replace('{count}', String(count));
}

export default function SettingsScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const t = useTranslation();
  const { entries, saveDiaryEntry } = useDiary();
  const biometricLockEnabled = useAppStore((state) => state.biometricLockEnabled);
  const calendarDateFormat = useAppStore((state) => state.calendarDateFormat);
  const timeFormat = useAppStore((state) => state.timeFormat);
  const calendarFirstDay = useAppStore((state) => state.calendarFirstDay);
  const fontScale = useAppStore((state) => state.fontScale);
  const fontFamily = useAppStore((state) => state.fontFamily);
  const homeViewModes = useAppStore((state) => state.homeViewModes);
  const appLanguage = useAppStore((state) => state.appLanguage);
  const {
    isPro,
    activeTier,
  } = useSubscription();
  const setCalendarDateFormat = useAppStore((state) => state.setCalendarDateFormat);
  const setTimeFormat = useAppStore((state) => state.setTimeFormat);
  const setCalendarFirstDay = useAppStore((state) => state.setCalendarFirstDay);
  const setFontScale = useAppStore((state) => state.setFontScale);
  const setFontFamily = useAppStore((state) => state.setFontFamily);
  const setHomeViewModeEnabled = useAppStore((state) => state.setHomeViewModeEnabled);
  const setAppLanguage = useAppStore((state) => state.setAppLanguage);
  const { profile, saveProfile } = useProfileForm();
  const { state: journalExtras, replace: replaceJournalExtras } = useJournalExtras();
  const activeLanguage = APP_LANGUAGES.find((language) => language.value === appLanguage) ?? APP_LANGUAGES[0]!;
  const deviceDateKey = getLocalDateKey(new Date());
  const nextFreeTierResetDate = getNextLocalPlanResetDate();
  const nextFreeTierResetDateKey = getLocalDateKey(nextFreeTierResetDate);
  const nextFreeTierResetText = `${formatDisplayDate(nextFreeTierResetDateKey, calendarDateFormat)}, ${formatDisplayTime(nextFreeTierResetDate.toISOString(), timeFormat)}`;
  const entriesCreatedToday = entries
    .filter((entry) => getLocalDateKey(new Date(entry.createdAt)) === deviceDateKey)
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  const createdTodayCount = entriesCreatedToday.length;
  const entryUsageText = `${Math.min(createdTodayCount, FREE_PLAN_LIMITS.entriesPerDay)}/${FREE_PLAN_LIMITS.entriesPerDay}`;

  // Modals
  const [showAppearanceModal, setShowAppearanceModal] = useState(false);
  const [showDataModal, setShowDataModal] = useState(false);
  const [showSecurityModal, setShowSecurityModal] = useState(false);
  const [showDisplayModal, setShowDisplayModal] = useState(false);
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [showFreeTierModal, setShowFreeTierModal] = useState(false);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [backupPassword, setBackupPassword] = useState('');
  const [stickersUsedToday, setStickersUsedToday] = useState(0);
  const [stickerLimitExhaustedAt, setStickerLimitExhaustedAt] = useState<string | undefined>(undefined);
  const [nowMs, setNowMs] = useState(() => Date.now());
  const stickerUsageText = `${Math.min(stickersUsedToday, FREE_PLAN_LIMITS.stickersPerDay)}/${FREE_PLAN_LIMITS.stickersPerDay}`;
  const entryLimitExhaustedAt = entriesCreatedToday[FREE_PLAN_LIMITS.entriesPerDay - 1]?.createdAt;
  const exhaustedAtCandidates = [entryLimitExhaustedAt, stickerLimitExhaustedAt]
    .filter((value): value is string => Boolean(value))
    .sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
  const limitExhaustedAt = exhaustedAtCandidates[0];
  const freeLimitExhausted = !isPro && (
    createdTodayCount >= FREE_PLAN_LIMITS.entriesPerDay
    || stickersUsedToday >= FREE_PLAN_LIMITS.stickersPerDay
  );
  const freeLimitExhaustedText = freeLimitExhausted
    ? formatDisplayMonthDayYearTime(limitExhaustedAt ?? new Date().toISOString(), timeFormat)
    : t('freeTierNotExhausted');
  const timeLeftUntilResetMs = Math.max(0, nextFreeTierResetDate.getTime() - nowMs);
  const timeLeftHours = Math.floor(timeLeftUntilResetMs / 3_600_000);
  const timeLeftMinutes = Math.floor((timeLeftUntilResetMs % 3_600_000) / 60_000);
  const timeLeftSeconds = Math.floor((timeLeftUntilResetMs % 60_000) / 1000);
  const timeLeftUntilResetText = `${String(timeLeftHours).padStart(2, '0')}:${String(timeLeftMinutes).padStart(2, '0')}:${String(timeLeftSeconds).padStart(2, '0')}`;

  useEffect(() => {
    if (!showFreeTierModal || isPro) return undefined;
    const timer = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [isPro, showFreeTierModal]);

  useFocusEffect(
    useCallback(() => {
      let isMounted = true;
      void planUsageRepository.getDailyUsage(deviceDateKey).then((result) => {
        if (isMounted && result.success) {
          setStickersUsedToday(result.data.stickersUsed);
          setStickerLimitExhaustedAt(result.data.stickerLimitExhaustedAt);
        }
      });
      return () => {
        isMounted = false;
      };
    }, [deviceDateKey, setStickerLimitExhaustedAt, setStickersUsedToday])
  );

  const handleExportData = async () => {
    try {
      await diaryBackupService.exportJson(entries, profile, journalExtras);
      Alert.alert(t('settingsExportedTitle'), t('settingsExportedMessage'));
    } catch {
      Alert.alert(t('entryErrorTitle'), t('settingsExportFailedMessage'));
    }
  };

  const handleEncryptedExport = async () => {
    try {
      await diaryBackupService.exportEncrypted(backupPassword, entries, profile, journalExtras);
      Alert.alert(t('settingsEncryptedBackupCreatedTitle'), t('settingsEncryptedBackupCreatedMessage'));
    } catch (error) {
      Alert.alert(t('entryErrorTitle'), error instanceof Error ? error.message : t('settingsEncryptedBackupFailedMessage'));
    }
  };

  const handleEncryptedImport = async () => {
    try {
      const imported = await diaryBackupService.importEncrypted(backupPassword);
      if (!imported) return;
      Alert.alert(t('settingsRestoreBackupPromptTitle'), withCount(t('settingsRestoreBackupPromptMessage'), imported.entries.length), [
        { text: t('entryCancel'), style: 'cancel' },
        {
          text: t('settingsRestoreAction'),
          onPress: async () => {
            const mergedEntries = new Map(entries.map((entry) => [entry.id, entry]));
            imported.entries.forEach((entry) => mergedEntries.set(entry.id, entry));
            for (const entry of mergedEntries.values()) await saveDiaryEntry(entry);
            if (imported.profile) {
              await saveProfile({
                displayName: imported.profile.displayName,
                email: imported.profile.email,
                bio: imported.profile.bio,
              });
            }
            if (imported.journalExtras) await replaceJournalExtras(imported.journalExtras);
            Alert.alert(t('settingsRestoredTitle'), t('settingsRestoredMessage'));
          },
        },
      ]);
    } catch (error) {
      Alert.alert(t('entryErrorTitle'), error instanceof Error ? error.message : t('settingsRestoreFailedMessage'));
    }
  };

  const handleBiometricToggle = async (enabled: boolean) => {
    if (enabled) {
      const activated = await appLockService.enable();
      if (!activated) Alert.alert(t('settingsBiometricsUnavailableTitle'), t('settingsBiometricsUnavailableMessage'));
    } else {
      appLockService.disable();
    }
  };

  const handleResetApp = () => {
    Alert.alert(
      t('settingsResetPromptTitle'),
      t('settingsResetPromptMessage'),
      [
        { text: t('entryCancel'), style: 'cancel' },
        {
          text: t('settingsResetConfirm'),
          style: 'destructive',
          onPress: async () => {
            await dataDeletionService.deleteAll();
            Alert.alert(t('settingsResetDoneTitle'), t('settingsResetDoneMessage'));
          },
        },
      ]
    );
  };

  const settingsOptions = [
    {
      id: 'appearance',
      title: t('settingsAppearanceTitle'),
      subtitle: t('settingsAppearanceSubtitle'),
      icon: 'color-palette-outline' as IconProps['name'],
      onPress: () => setShowAppearanceModal(true),
    },
    {
      id: 'display',
      title: t('settingsDisplayTitle'),
      subtitle: t('settingsDisplaySubtitle'),
      icon: 'options-outline' as IconProps['name'],
      onPress: () => setShowDisplayModal(true),
    },
    {
      id: 'language',
      title: t('settingsLanguageTitle'),
      subtitle: `${t('settingsLanguageSubtitle')}: ${activeLanguage.nativeLabel}`,
      icon: 'language-outline' as IconProps['name'],
      onPress: () => setShowLanguageModal(true),
    },
    {
      id: 'free-tier',
      title: t('settingsFreeTierTitle'),
      subtitle: isPro
        ? t('settingsFreeTierProSubtitle')
        : `${t('settingsFreeTierSubtitle')} ${nextFreeTierResetText}`,
      icon: 'hourglass-outline' as IconProps['name'],
      onPress: () => {
        setNowMs(Date.now());
        setShowFreeTierModal(true);
      },
    },
    {
      id: 'premium',
      title: t('settingsPremiumTitle'),
      subtitle: isPro ? `${t('settingsPremiumActiveSubtitle')}: ${activeTier}` : t('settingsPremiumSubtitle'),
      icon: 'sparkles-outline' as IconProps['name'],
      onPress: () => setShowPremiumModal(true),
    },
    {
      id: 'security',
      title: t('settingsSecurityTitle'),
      subtitle: t('settingsSecuritySubtitle'),
      icon: 'lock-closed-outline' as IconProps['name'],
      onPress: () => setShowSecurityModal(true),
    },
    {
      id: 'data',
      title: t('settingsDataTitle'),
      subtitle: withCount(t('settingsDataSubtitle'), entries.length),
      icon: 'archive-outline' as IconProps['name'],
      onPress: () => setShowDataModal(true),
    },
    {
      id: 'reset',
      title: t('settingsResetTitle'),
      subtitle: t('settingsResetSubtitle'),
      icon: 'trash-outline' as IconProps['name'],
      onPress: handleResetApp,
      isDestructive: true,
    },
  ];

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.fixedHeader, { paddingTop: insets.top + 16, backgroundColor: theme.colors.background }]}>
        <Text style={[styles.title, { color: theme.colors.text }]}>
          {t('settingsTitle')}
        </Text>
      </View>
      <ScrollView
        contentContainerStyle={{
          paddingTop: 4,
          paddingBottom: insets.bottom + 80,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.optionsContainer}>
          {settingsOptions.map((option) => (
            <TouchableOpacity
              key={option.id}
              style={[
                styles.optionRow,
                { borderBottomColor: theme.colors.border },
              ]}
              onPress={option.onPress}
              activeOpacity={0.7}
              accessibilityLabel={`${option.title}, ${option.subtitle}`}
              accessibilityRole="button"
            >
              <View style={styles.optionLeft}>
                <Icon name={option.icon} size={22} color={option.isDestructive ? 'error' : 'textSecondary'} style={styles.optionIcon} />
                <View style={styles.optionText}>
                  <Text
                    style={[
                      styles.optionTitle,
                      { color: option.isDestructive ? theme.colors.error : theme.colors.text },
                    ]}
                  >
                    {option.title}
                  </Text>
                  <Text style={[styles.optionSubtitle, { color: theme.colors.textSecondary }]}>
                    {option.subtitle}
                  </Text>
                </View>
              </View>
              <Text style={[styles.arrow, { color: theme.colors.textSecondary }]}>
                ›
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* ── 1. Appearance Modal ───────────────────────────────────────────── */}
      <Modal
        visible={showAppearanceModal}
        onDismiss={() => setShowAppearanceModal(false)}
        title={t('settingsAppearanceModalTitle')}
        accessibilityLabel={t('settingsAppearanceA11y')}
      >
        <View style={[styles.modalRow, { borderBottomColor: theme.colors.border }]}>
          <View style={{ flex: 1 }}>
            <Text preset="label" color="text" style={{ fontSize: 16, fontWeight: '600' }}>
              {t('settingsDarkMode')}
            </Text>
          <Text preset="caption" color="textSecondary" style={{ marginTop: 2 }}>
              {t('settingsDarkModeHint')}
            </Text>
          </View>

          <Switch
            value={theme.isDark}
            onValueChange={(value) => theme.setThemeMode(value ? 'dark' : 'light')}
            trackColor={{ false: theme.colors.border, true: theme.colors.tint }}
            thumbColor="#fff"
          />
        </View>

        <View style={{ paddingTop: 16 }}>
          <Text preset="caption" color="textSecondary" style={{ fontWeight: '700', marginBottom: 10 }}>
            {t('settingsThemeModeSection')}
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
            {(['light', 'dark', 'system'] as const).map((m) => {
              const active = theme.mode === m;
              return (
                <TouchableOpacity
                  key={m}
                  onPress={() => theme.setThemeMode(m)}
                  style={{
                    flex: 1,
                    paddingVertical: 12,
                    borderRadius: 10,
                    borderWidth: active ? 2 : 1,
                    borderColor: active ? theme.colors.tint : theme.colors.border,
                    backgroundColor: active ? theme.colors.tint + '18' : theme.colors.surface,
                    alignItems: 'center',
                  }}
                >
                  <Text
                    preset="caption"
                    style={{
                      fontWeight: '700',
                      textTransform: 'capitalize',
                      color: active ? theme.colors.tint : theme.colors.text,
                    }}
                  >
                    {m === 'light' ? t('settingsThemeLight') : m === 'dark' ? t('settingsThemeDark') : t('settingsThemeSystem')}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={{ paddingTop: 20 }}>
          <Text preset="caption" color="textSecondary" style={{ fontWeight: '700', marginBottom: 10 }}>
            {t('settingsColorThemeSection')}
          </Text>
          <View style={styles.themeOptions}>
            {(Object.keys(colorThemes) as ColorTheme[]).map((colorThemeKey) => {
              const active = theme.colorTheme === colorThemeKey;
              return (
                <TouchableOpacity
                  key={colorThemeKey}
                  onPress={() => theme.setColorTheme(colorThemeKey)}
                  style={[
                    styles.themeOption,
                    {
                      backgroundColor: theme.colors.surface,
                      borderColor: active ? theme.colors.tint : theme.colors.border,
                    },
                  ]}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: active }}
                  accessibilityLabel={`${colorThemes[colorThemeKey].label} color theme${active ? ', selected' : ''}`}
                >
                  <View style={[styles.themePreview, { backgroundColor: colorThemes[colorThemeKey].preview }]} />
                  <Text preset="bodySmall" color={active ? 'tint' : 'text'} style={styles.themeOptionLabel}>
                    {colorThemes[colorThemeKey].label}
                  </Text>
                  {active ? <Icon name="checkmark" size={18} color="tint" /> : null}
                </TouchableOpacity>
              );
            })}
          </View>
          <Text preset="caption" color="textSecondary" style={{ marginTop: 8 }}>
            {t('settingsColorThemeHint')}
          </Text>
        </View>

        <View style={{ paddingTop: 20 }}>
          <Text preset="caption" color="textSecondary" style={{ fontWeight: '700', marginBottom: 10 }}>
            {t('settingsAccentColorSection')}
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
            {(['red', 'orange', 'yellow', 'green', 'blue', 'indigo', 'violet', 'teal', 'coral', 'rose', 'plum', 'mint', 'slate'] as AccentColor[]).map((color) => {
              const active = theme.accentColor === color;
              return (
                <TouchableOpacity
                  key={color}
                  onPress={() => theme.setAccentColor(color)}
                  accessibilityRole="button"
                  accessibilityLabel={`${accentColors[color].label} accent color${active ? ', selected' : ''}`}
                  style={[styles.colorSwatch, { backgroundColor: accentColors[color][theme.isDark ? 'dark' : 'light'], borderColor: active ? theme.colors.text : theme.colors.border, borderWidth: active ? 3 : 1 }]}
                />
              );
            })}
          </View>
          <Text preset="caption" color="textSecondary" style={{ marginTop: 8 }}>
            {t('settingsAccentColorHint')}
          </Text>
        </View>
      </Modal>

      <Modal
        visible={showDisplayModal}
        onDismiss={() => setShowDisplayModal(false)}
        title={t('displayModalTitle')}
        accessibilityLabel={t('settingsDisplayA11y')}
      >
        <Text preset="caption" color="textSecondary" style={styles.displaySectionLabel}>{t('settingsCalendarDateFormatSection')}</Text>
        <View style={styles.displayOptions}>
          {([
            ['month-day-year', 'Aug 16, 2026'],
            ['day-month-year', '16 Aug 2026'],
            ['year-month-day', '2026-08-16'],
          ] as const satisfies (readonly [CalendarDateFormat, string])[]).map(([value, label]) => (
            <TouchableOpacity
              key={value}
              onPress={() => setCalendarDateFormat(value)}
              style={[styles.displayOption, { borderColor: calendarDateFormat === value ? theme.colors.tint : theme.colors.border, backgroundColor: calendarDateFormat === value ? theme.colors.tint + '18' : theme.colors.surface }]}
              accessibilityRole="radio"
              accessibilityState={{ selected: calendarDateFormat === value }}
            >
              <Text preset="bodySmall" color={calendarDateFormat === value ? 'tint' : 'text'}>{label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text preset="caption" color="textSecondary" style={styles.displaySectionLabel}>{t('settingsWeekStartsOnSection')}</Text>
        <View style={styles.displayOptions}>
          {([[0, t('settingsWeekStartsSunday')], [1, t('settingsWeekStartsMonday')]] as const).map(([value, label]) => (
            <TouchableOpacity
              key={value}
              onPress={() => setCalendarFirstDay(value)}
              style={[styles.displayOption, { borderColor: calendarFirstDay === value ? theme.colors.tint : theme.colors.border, backgroundColor: calendarFirstDay === value ? theme.colors.tint + '18' : theme.colors.surface }]}
              accessibilityRole="radio"
              accessibilityState={{ selected: calendarFirstDay === value }}
            >
              <Text preset="bodySmall" color={calendarFirstDay === value ? 'tint' : 'text'}>{label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text preset="caption" color="textSecondary" style={styles.displaySectionLabel}>{t('settingsTimeFormatSection')}</Text>
        <View style={styles.displayOptions}>
          {([['24-hour', '24-hour'], ['12-hour', '12-hour (AM/PM)']] as const satisfies (readonly [TimeFormat, string])[]).map(([value, label]) => (
            <TouchableOpacity
              key={value}
              onPress={() => setTimeFormat(value)}
              style={[styles.displayOption, { borderColor: timeFormat === value ? theme.colors.tint : theme.colors.border, backgroundColor: timeFormat === value ? theme.colors.tint + '18' : theme.colors.surface }]}
              accessibilityRole="radio"
              accessibilityState={{ selected: timeFormat === value }}
            >
              <Text preset="bodySmall" color={timeFormat === value ? 'tint' : 'text'}>{label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text preset="caption" color="textSecondary" style={styles.displaySectionLabel}>{t('settingsGlobalFontSizeSection')}</Text>
        <View style={styles.displayOptions}>
          {([['small', t('settingsFontSmall')], ['default', t('settingsFontDefault')], ['large', t('settingsFontLarge')]] as const satisfies (readonly [FontScale, string])[]).map(([value, label]) => (
            <TouchableOpacity
              key={value}
              onPress={() => setFontScale(value)}
              style={[styles.displayOption, { borderColor: fontScale === value ? theme.colors.tint : theme.colors.border, backgroundColor: fontScale === value ? theme.colors.tint + '18' : theme.colors.surface }]}
              accessibilityRole="radio"
              accessibilityState={{ selected: fontScale === value }}
            >
              <Text preset="bodySmall" color={fontScale === value ? 'tint' : 'text'}>{label}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <Text preset="caption" color="textSecondary" style={styles.displayHint}>{t('settingsGlobalFontSizeHint')}</Text>

        <Text preset="caption" color="textSecondary" style={styles.displaySectionLabel}>{t('settingsFontStyleSection')}</Text>
        <View style={styles.displayOptions}>
          {([['system', t('settingsFontSystem')], ['serif', t('settingsFontSerif')], ['monospace', t('settingsFontMonospace')]] as const satisfies (readonly [FontFamily, string])[]).map(([value, label]) => (
            <TouchableOpacity
              key={value}
              onPress={() => setFontFamily(value)}
              style={[styles.displayOption, { borderColor: fontFamily === value ? theme.colors.tint : theme.colors.border, backgroundColor: fontFamily === value ? theme.colors.tint + '18' : theme.colors.surface }]}
              accessibilityRole="radio"
              accessibilityState={{ selected: fontFamily === value }}
            >
              <Text preset="bodySmall" color={fontFamily === value ? 'tint' : 'text'} style={{ fontFamily: value === 'serif' ? 'serif' : value === 'monospace' ? 'monospace' : undefined }}>{label}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <Text preset="caption" color="textSecondary" style={styles.displaySectionLabel}>{t('settingsHomeViewsSection')}</Text>
        <View>
          {(['timeline', 'detailed', 'feed'] as const satisfies readonly HomeViewMode[]).map((value) => (
            <View
              key={value}
              style={[styles.displayToggleRow, { borderBottomColor: theme.colors.border }]}
            >
              <Text preset="bodySmall" color="text">{homeViewModeLabel(value, t)}</Text>
              <Switch
                value={homeViewModes[value]}
                onValueChange={(enabled) => {
                  const enabledCount = (['timeline', 'detailed', 'feed'] as const).filter((view) => homeViewModes[view]).length;
                  if (!enabled && enabledCount === 1) return;
                  setHomeViewModeEnabled(value, enabled);
                }}
                trackColor={{ false: theme.colors.border, true: theme.colors.tint }}
                thumbColor="#fff"
                accessibilityLabel={`${homeViewModeLabel(value, t)} ${t('settingsHomeViewToggleA11ySuffix')}`}
              />
            </View>
          ))}
        </View>
        <Text preset="caption" color="textSecondary" style={styles.displayHint}>{t('settingsHomeViewsHint')}</Text>
      </Modal>

      <Modal
        visible={showLanguageModal}
        onDismiss={() => setShowLanguageModal(false)}
        title={t('languageModalTitle')}
        accessibilityLabel={t('settingsLanguageTitle')}
      >
        <Text preset="caption" color="textSecondary" style={styles.displaySectionLabel}>{t('displayLanguageSection')}</Text>
        <View style={styles.displayOptions}>
          {APP_LANGUAGES.map(({ value, nativeLabel }) => (
            <TouchableOpacity
              key={value}
              onPress={() => setAppLanguage(value)}
              style={[styles.displayOption, { borderColor: appLanguage === value ? theme.colors.tint : theme.colors.border, backgroundColor: appLanguage === value ? theme.colors.tint + '18' : theme.colors.surface }]}
              accessibilityRole="radio"
              accessibilityState={{ selected: appLanguage === value }}
            >
              <Text preset="bodySmall" color={appLanguage === value ? 'tint' : 'text'}>{nativeLabel}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <Text preset="caption" color="textSecondary" style={styles.displayHint}>{t('displayLanguageHint')}</Text>
      </Modal>

      <Modal
        visible={showFreeTierModal}
        onDismiss={() => setShowFreeTierModal(false)}
        accessibilityLabel={t('settingsFreeTierTitle')}
      >
        <View style={styles.limitSectionHeader}>
          <Text preset="caption" color="textSecondary" style={styles.displaySectionLabel}>
            {t('premiumStatusLabel')}
          </Text>
          <Text preset="caption" color="textSecondary" style={styles.limitSectionDescriptor}>
            {t('premiumStatusDescriptor')}
          </Text>
        </View>
        <View style={[styles.limitSummary, { borderColor: theme.colors.border, backgroundColor: theme.colors.surface }]}>
          <View style={{ flex: 1 }}>
            <Text preset="h2" color="text" style={styles.limitResetTime}>
              {isPro ? t('premiumStatusActive') : t('premiumStatusFree')}
            </Text>
          </View>
          <Icon name={isPro ? 'sparkles-outline' : 'hourglass-outline'} size={24} color="tint" />
        </View>

        <View style={styles.limitSectionHeader}>
          <Text preset="caption" color="textSecondary" style={styles.displaySectionLabel}>
            {t('freeTierExhaustedSection')}
          </Text>
          <Text preset="caption" color="textSecondary" style={styles.limitSectionDescriptor}>
            {t('freeTierExhaustedDate')}
          </Text>
        </View>
        <View style={[styles.limitSummary, { borderColor: theme.colors.border, backgroundColor: theme.colors.surface }]}>
          <View style={{ flex: 1 }}>
            <Text preset="h2" color="text" style={styles.limitResetTime}>
              {isPro ? t('freeTierUnlimited') : freeLimitExhaustedText}
            </Text>
          </View>
          <Icon name={isPro ? 'infinite-outline' : freeLimitExhausted ? 'alert-circle-outline' : 'checkmark-circle-outline'} size={24} color="tint" />
        </View>

        <View style={styles.limitSectionHeader}>
          <Text preset="caption" color="textSecondary" style={styles.displaySectionLabel}>
            {t('freeTierResetSection')}
          </Text>
          <Text preset="caption" color="textSecondary" style={styles.limitSectionDescriptor}>
            {t('freeTierNextResetDateTime')}
          </Text>
        </View>
        <View style={[styles.limitSummary, { borderColor: theme.colors.border, backgroundColor: theme.colors.surface }]}>
          <View style={{ flex: 1 }}>
            <Text preset="h2" color="text" style={styles.limitResetTime}>
              {isPro ? t('freeTierUnlimited') : nextFreeTierResetText}
            </Text>
          </View>
          <Icon name={isPro ? 'infinite-outline' : 'time-outline'} size={24} color="tint" />
        </View>

        <View style={styles.limitSectionHeader}>
          <Text preset="caption" color="textSecondary" style={styles.displaySectionLabel}>
            {t('freeTierTimeLeftSection')}
          </Text>
          <Text preset="caption" color="textSecondary" style={styles.limitSectionDescriptor}>
            {t('freeTierTimeLeftDescriptor')}
          </Text>
        </View>
        <View style={[styles.limitSummary, { borderColor: theme.colors.border, backgroundColor: theme.colors.surface }]}>
          <View style={{ flex: 1 }}>
            <Text preset="h2" color="text" style={styles.limitResetTime}>
              {isPro ? t('freeTierUnlimited') : timeLeftUntilResetText}
            </Text>
          </View>
          <Icon name={isPro ? 'infinite-outline' : 'timer-outline'} size={24} color="tint" />
        </View>

        <Text preset="caption" color="textSecondary" style={styles.displaySectionLabel}>
          {t('freeTierCurrentLimitsSection')}
        </Text>
        <View style={{ gap: 10 }}>
          <View style={[styles.limitRow, { borderColor: theme.colors.border, backgroundColor: theme.colors.surface }]}>
            <Text preset="bodySmall" color="text">{t('freeTierEntriesLimit')}</Text>
            <Text preset="bodySmall" color="tint" style={styles.limitValue}>
              {isPro ? t('freeTierUnlimited') : entryUsageText}
            </Text>
          </View>
          <View style={[styles.limitRow, { borderColor: theme.colors.border, backgroundColor: theme.colors.surface }]}>
            <Text preset="bodySmall" color="text">{t('freeTierStickersLimit')}</Text>
            <Text preset="bodySmall" color="tint" style={styles.limitValue}>
              {isPro ? t('freeTierUnlimited') : stickerUsageText}
            </Text>
          </View>
        </View>
        <Text preset="caption" color="textSecondary" style={styles.displayHint}>
          {t('freeTierResetHint')}
        </Text>
      </Modal>

      <PaywallModal
        visible={showPremiumModal}
        onClose={() => setShowPremiumModal(false)}
        appName={APP_IDENTITY.codename}
        title={premiumPaywallTitle(t)}
        subtitle={t('premiumPaywallSubtitle')}
        features={[
          t('premiumPaywallFeatureEntries'),
          t('premiumPaywallFeatureStickers'),
          t('premiumPaywallFeatureInsights'),
          t('premiumPaywallFeatureThemes'),
          t('premiumPaywallFeatureOffline'),
        ]}
      />

      <Modal
        visible={showSecurityModal}
        onDismiss={() => setShowSecurityModal(false)}
        title={t('settingsSecurityTitle')}
        accessibilityLabel={t('settingsSecurityTitle')}
      >
        <View style={{ gap: 16, paddingVertical: 8 }}>
          <View style={[styles.modalRow, { borderBottomColor: theme.colors.border }]}>
            <View style={{ flex: 1 }}>
              <Text preset="label" color="text" style={{ fontSize: 16, fontWeight: '600' }}>{t('settingsBiometricLockTitle')}</Text>
              <Text preset="caption" color="textSecondary" style={{ marginTop: 2 }}>{t('settingsBiometricLockHint')}</Text>
            </View>
            <Switch value={biometricLockEnabled} onValueChange={handleBiometricToggle} trackColor={{ false: theme.colors.border, true: theme.colors.tint }} thumbColor="#fff" />
          </View>
        </View>
      </Modal>

      {/* ── 4. Data & Storage Modal ─────────────────────────────────────── */}
      <Modal
        visible={showDataModal}
        onDismiss={() => setShowDataModal(false)}
        title={t('settingsDataTitle')}
        accessibilityLabel={t('settingsDataA11y')}
      >
        <View style={{ gap: 12, paddingVertical: 8 }}>
          <View>
            <Text preset="caption" color="textSecondary" style={{ marginBottom: 4 }}>{t('settingsBackupPassword')}</Text>
            <TextInput
              value={backupPassword}
              onChangeText={setBackupPassword}
              placeholder={t('settingsBackupPasswordPlaceholder')}
              placeholderTextColor={theme.colors.textSecondary}
              secureTextEntry
              autoCapitalize="none"
              style={[styles.modalInput, { color: theme.colors.text, borderColor: theme.colors.border, backgroundColor: theme.colors.surface }]}
            />
            <Text preset="caption" color="textSecondary" style={{ marginTop: 4 }}>{t('settingsBackupPasswordHint')}</Text>
          </View>
          <TouchableOpacity
            style={[styles.modalRowBtn, { borderColor: theme.colors.border, backgroundColor: theme.colors.surface }]}
            onPress={() => { void handleExportData(); }}
          >
            <Text style={{ fontSize: 22, marginRight: 12 }}>📋</Text>
            <View style={{ flex: 1 }}>
              <Text preset="label" color="text">{t('settingsExportJsonTitle')}</Text>
              <Text preset="caption" color="textSecondary">{t('settingsExportJsonSubtitle')}</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.modalRowBtn, { borderColor: theme.colors.border, backgroundColor: theme.colors.surface }]}
            onPress={() => { void handleEncryptedExport(); }}
          >
            <Text style={{ fontSize: 22, marginRight: 12 }}>🔐</Text>
            <View style={{ flex: 1 }}>
              <Text preset="label" color="text">{t('settingsEncryptedBackupTitle')}</Text>
              <Text preset="caption" color="textSecondary">{t('settingsEncryptedBackupSubtitle')}</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.modalRowBtn, { borderColor: theme.colors.border, backgroundColor: theme.colors.surface }]}
            onPress={() => { void handleEncryptedImport(); }}
          >
            <Text style={{ fontSize: 22, marginRight: 12 }}>📥</Text>
            <View style={{ flex: 1 }}>
              <Text preset="label" color="text">{t('settingsRestoreBackupTitle')}</Text>
              <Text preset="caption" color="textSecondary">{t('settingsRestoreBackupSubtitle')}</Text>
            </View>
          </TouchableOpacity>
        </View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  fixedHeader: {
    zIndex: 30,
    elevation: 30,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 16,
  },
  optionsContainer: {
    flex: 1,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  optionIcon: {
    fontSize: 24,
    marginRight: 16,
    width: 30,
    textAlign: 'center',
  },
  optionText: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  optionSubtitle: {
    fontSize: 14,
  },
  colorSwatch: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  themeOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  themeOption: {
    width: '48%',
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  themePreview: {
    width: 26,
    height: 26,
    borderRadius: 6,
    marginRight: 10,
  },
  themeOptionLabel: {
    flex: 1,
    fontWeight: '600',
  },
  arrow: {
    fontSize: 20,
    fontWeight: '300',
  },
  modalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  modalInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
  },
  modalRowBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  displaySectionLabel: { fontWeight: '700', marginTop: 12, marginBottom: 8 },
  displayOptions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  displayOption: { flexGrow: 1, minWidth: '30%', alignItems: 'center', borderWidth: 1, borderRadius: 8, paddingVertical: 11, paddingHorizontal: 10 },
  displayHint: { marginTop: 16, lineHeight: 18 },
  displayToggleRow: { minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: StyleSheet.hairlineWidth, paddingHorizontal: 4 },
  limitSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  limitSectionDescriptor: {
    flexShrink: 1,
    marginTop: 12,
    marginBottom: 8,
    textAlign: 'right',
  },
  limitSummary: {
    minHeight: 58,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  limitResetTime: {
    marginTop: 0,
    fontSize: 24,
    fontWeight: '800',
  },
  limitRow: {
    minHeight: 46,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  limitValue: {
    fontWeight: '800',
  },
});
