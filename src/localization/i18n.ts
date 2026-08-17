import { useAppStore, type AppLanguage, type HomeViewMode } from '@/stores/useAppStore';

export const APP_LANGUAGES: readonly { readonly value: AppLanguage; readonly label: string; readonly nativeLabel: string }[] = [
  { value: 'en', label: 'English', nativeLabel: 'English' },
  { value: 'ja', label: 'Japanese', nativeLabel: '日本語' },
];

const translations = {
  en: {
    tabsHome: 'Home',
    tabsCalendar: 'Calendar',
    tabsInsights: 'Insights',
    tabsSettings: 'Settings',
    homeTimeline: 'Timeline',
    homeCard: 'Card',
    homeFeed: 'Feed',
    homeHeaderOptions: 'Header options',
    homeHeaderHierarchy: 'Hierarchy',
    homeHeaderSearch: 'Search',
    homeHeaderCloseSearch: 'Close search',
    timelineUnavailableTitle: 'Timeline unavailable',
    timelineUnavailableMessage: 'Enable Timeline in Display settings to view reflections inline.',
    calendarTitle: 'Calendar',
    calendarToday: 'Today',
    insightsTitle: 'Insights',
    archiveTitle: 'Personal Archive',
    settingsTitle: 'Settings',
    settingsAppearanceTitle: 'Appearance',
    settingsAppearanceSubtitle: 'Dark mode, theme',
    settingsDisplayTitle: 'Display',
    settingsDisplaySubtitle: 'Calendar, time, and accessibility',
    settingsLanguageTitle: 'Language',
    settingsLanguageSubtitle: 'UI language',
    settingsCompanionTitle: 'AI Companion',
    settingsProfileTitle: 'Profile Details',
    settingsProfileSubtitle: 'Set display name and bio',
    settingsSecurityTitle: 'Security & Privacy',
    settingsSecuritySubtitle: 'Biometric lock and AI privacy controls',
    settingsDataTitle: 'Data & Storage',
    settingsResetTitle: 'Reset App',
    displayModalTitle: 'Display',
    languageModalTitle: 'Language',
    displayLanguageSection: 'LANGUAGE',
    displayLanguageHint: 'Choose the language used for app navigation and supported UI labels.',
    reflection: 'Reflection',
    reflections: 'Reflections',
    noReflections: 'No reflections yet.',
    addReflectionPlaceholder: 'Add a reflection...',
  },
  ja: {
    tabsHome: 'ホーム',
    tabsCalendar: 'カレンダー',
    tabsInsights: 'インサイト',
    tabsSettings: '設定',
    homeTimeline: 'タイムライン',
    homeCard: 'カード',
    homeFeed: 'フィード',
    homeHeaderOptions: 'ヘッダーオプション',
    homeHeaderHierarchy: '階層',
    homeHeaderSearch: '検索',
    homeHeaderCloseSearch: '検索を閉じる',
    timelineUnavailableTitle: 'タイムラインを利用できません',
    timelineUnavailableMessage: 'リフレクションを表示するには、表示設定でタイムラインを有効にしてください。',
    calendarTitle: 'カレンダー',
    calendarToday: '今日',
    insightsTitle: 'インサイト',
    archiveTitle: '個人アーカイブ',
    settingsTitle: '設定',
    settingsAppearanceTitle: '外観',
    settingsAppearanceSubtitle: 'ダークモード、テーマ',
    settingsDisplayTitle: '表示',
    settingsDisplaySubtitle: 'カレンダー、時刻、アクセシビリティ',
    settingsLanguageTitle: '言語',
    settingsLanguageSubtitle: 'UI言語',
    settingsCompanionTitle: 'AIコンパニオン',
    settingsProfileTitle: 'プロフィール詳細',
    settingsProfileSubtitle: '表示名と自己紹介を設定',
    settingsSecurityTitle: 'セキュリティとプライバシー',
    settingsSecuritySubtitle: '生体認証ロックとAIプライバシー設定',
    settingsDataTitle: 'データとストレージ',
    settingsResetTitle: 'アプリをリセット',
    displayModalTitle: '表示',
    languageModalTitle: '言語',
    displayLanguageSection: '言語',
    displayLanguageHint: 'ナビゲーションと対応済みUIラベルで使う言語を選択します。',
    reflection: 'リフレクション',
    reflections: 'リフレクション',
    noReflections: 'リフレクションはまだありません。',
    addReflectionPlaceholder: 'リフレクションを追加...',
  },
} as const;

export type TranslationKey = keyof typeof translations.en;

export function translate(language: AppLanguage, key: TranslationKey): string {
  return translations[language][key] ?? translations.en[key];
}

export function useTranslation(): (key: TranslationKey) => string {
  const language = useAppStore((state) => state.appLanguage);
  return (key: TranslationKey) => translate(language, key);
}

export function homeViewModeLabel(mode: HomeViewMode, t: (key: TranslationKey) => string): string {
  if (mode === 'timeline') return t('homeTimeline');
  if (mode === 'feed') return t('homeFeed');
  return t('homeCard');
}

export function reflectionCountLabel(count: number, t: (key: TranslationKey) => string): string {
  return `${count} ${count === 1 ? t('reflection') : t('reflections')}`;
}
