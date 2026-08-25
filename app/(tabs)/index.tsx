import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Modal, ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@providers/ThemeProvider';
import { Text } from '@shared/components/Text';
import { useDiary } from '@/features/diary/hooks/useDiary';
import { useJournals } from '@/features/journal/hooks/useJournals';
import { isDiaryEntryVisible } from '@/features/diary/services/DiaryEntryVisibility';
import { PaywallModal } from '@/shared/components/PaywallModal';
import { useSubscription } from '@/features/subscription/hooks/useSubscription';
import { useAppStore } from '@/stores/useAppStore';
import { APP_IDENTITY } from '@/config/appIdentity';
import { premiumPaywallTitle, useTranslation } from '@/localization/i18n';

function entryBelongsToJournal(entry: { readonly journalIds?: readonly string[]; readonly collectionIds?: readonly string[] }, journalId: string): boolean {
  return (entry.journalIds ?? entry.collectionIds ?? []).includes(journalId);
}

type JournalViewMode = 'list' | 'grid';

interface JournalHomeItem {
  readonly id: string;
  readonly title: string;
  readonly count: number;
  readonly color: string;
}

const PREMIUM_REMINDER_ENTRY_THRESHOLD = 5;
const PREMIUM_REMINDER_COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000;
const JOURNAL_VIEW_MODES = ['list', 'grid'] as const satisfies readonly JournalViewMode[];

export default function JournalsScreen(): React.JSX.Element {
  const router = useRouter();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const t = useTranslation();
  const { entries, refresh: refreshEntries } = useDiary();
  const { journals, refresh: refreshJournals, createJournal } = useJournals();
  const { isPro } = useSubscription();
  const isOnboarded = useAppStore((state) => state.isOnboarded);
  const premiumOnboardingPromptShown = useAppStore((state) => state.premiumOnboardingPromptShown);
  const premiumPromptDismissedAt = useAppStore((state) => state.premiumPromptDismissedAt);
  const markPremiumOnboardingPromptShown = useAppStore((state) => state.markPremiumOnboardingPromptShown);
  const markPremiumPromptDismissed = useAppStore((state) => state.markPremiumPromptDismissed);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [journalTitle, setJournalTitle] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [journalViewMode, setJournalViewMode] = useState<JournalViewMode>('list');
  const premiumPromptShownThisSession = useRef(false);

  useFocusEffect(
    useCallback(() => {
      void refreshEntries();
      void refreshJournals();
    }, [refreshEntries, refreshJournals]),
  );

  useEffect(() => {
    if (!isOnboarded || isPro || showPremiumModal) return;

    const now = Date.now();
    let timeout: ReturnType<typeof setTimeout> | undefined;
    if (!premiumOnboardingPromptShown) {
      premiumPromptShownThisSession.current = true;
      markPremiumOnboardingPromptShown(new Date(now).toISOString());
      timeout = setTimeout(() => setShowPremiumModal(true), 0);
      return () => {
        if (timeout) clearTimeout(timeout);
      };
    }

    const dismissedAtMs = premiumPromptDismissedAt ? new Date(premiumPromptDismissedAt).getTime() : 0;
    const cooldownElapsed = !dismissedAtMs || Number.isNaN(dismissedAtMs) || now - dismissedAtMs >= PREMIUM_REMINDER_COOLDOWN_MS;
    if (!premiumPromptShownThisSession.current && entries.length >= PREMIUM_REMINDER_ENTRY_THRESHOLD && cooldownElapsed) {
      premiumPromptShownThisSession.current = true;
      timeout = setTimeout(() => setShowPremiumModal(true), 0);
    }
    return () => {
      if (timeout) clearTimeout(timeout);
    };
  }, [
    entries.length,
    isOnboarded,
    isPro,
    markPremiumOnboardingPromptShown,
    premiumOnboardingPromptShown,
    premiumPromptDismissedAt,
    showPremiumModal,
  ]);

  const closePremiumModal = useCallback(() => {
    markPremiumPromptDismissed(new Date().toISOString());
    setShowPremiumModal(false);
  }, [markPremiumPromptDismissed]);

  const visibleEntries = useMemo(() => entries.filter((entry) => isDiaryEntryVisible(entry)), [entries]);
  const unassignedEntries = useMemo(() => visibleEntries.filter((entry) => (entry.journalIds?.length ?? entry.collectionIds.length) === 0), [visibleEntries]);
  const journalItems = useMemo<JournalHomeItem[]>(() => {
    const assignedItems = journals.map((journal) => ({
      id: journal.id,
      title: journal.title,
      count: visibleEntries.filter((entry) => entryBelongsToJournal(entry, journal.id)).length,
      color: journal.color,
    }));

    if (unassignedEntries.length === 0) return assignedItems;

    return [
      ...assignedItems,
      {
        id: 'unassigned',
        title: t('journalUnassignedTitle'),
        count: unassignedEntries.length,
        color: theme.colors.textTertiary,
      },
    ];
  }, [journals, t, theme.colors.textTertiary, unassignedEntries.length, visibleEntries]);

  const handleCreateJournal = async () => {
    const trimmed = journalTitle.trim();
    if (!trimmed) {
      Alert.alert(t('journalTitleRequiredTitle'), t('journalTitleRequiredMessage'));
      return;
    }
    setIsCreating(true);
    const result = await createJournal(trimmed);
    setIsCreating(false);
    if (!result.success) {
      Alert.alert(t('entryErrorTitle'), result.error.message);
      return;
    }
    setJournalTitle('');
    setShowCreateModal(false);
    router.push({ pathname: '/journal/[id]', params: { id: result.data.id } });
  };

  return (
    <View style={[styles.root, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 16, backgroundColor: theme.colors.background }]}>
        <View>
          <Text preset="h1" color="text" style={styles.title}>{t('journalsTitle')}</Text>
          <Text preset="caption" color="textSecondary" style={styles.subtitle}>{t('journalsSubtitle')}</Text>
        </View>
        <TouchableOpacity
          onPress={() => setShowCreateModal(true)}
          style={[styles.addButton, { backgroundColor: theme.colors.tint }]}
          accessibilityRole="button"
          accessibilityLabel={t('journalCreateA11y')}
        >
          <Ionicons name="add" size={22} color={theme.isDark ? theme.colors.background : theme.colors.card} />
        </TouchableOpacity>
      </View>

      <View style={[styles.viewModePill, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
        {JOURNAL_VIEW_MODES.map((mode) => {
          const selected = journalViewMode === mode;
          return (
            <TouchableOpacity
              key={mode}
              onPress={() => setJournalViewMode(mode)}
              style={[styles.viewModeButton, selected && { backgroundColor: theme.colors.tint }]}
              accessibilityRole="button"
              accessibilityLabel={mode === 'list' ? t('journalViewList') : t('journalViewGrid')}
              accessibilityState={{ selected }}
            >
              <Text
                preset="caption"
                style={[
                  styles.viewModeButtonText,
                  { color: selected ? '#fff' : theme.colors.textSecondary },
                ]}
                numberOfLines={1}
              >
                {mode === 'list' ? t('journalViewList') : t('journalViewGrid')}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 88 }]} showsVerticalScrollIndicator={false}>
        {journalItems.length === 0 ? (
          <View style={[styles.emptyState, { borderColor: theme.colors.border, backgroundColor: theme.colors.surface }]}>
            <Ionicons name="journal-outline" size={34} color={theme.colors.tint} />
            <Text preset="label" color="text" style={styles.emptyTitle}>{t('journalsEmptyTitle')}</Text>
            <Text preset="bodySmall" color="textSecondary" style={styles.emptyBody}>{t('journalsEmptyMessage')}</Text>
            <TouchableOpacity onPress={() => setShowCreateModal(true)} style={[styles.emptyButton, { backgroundColor: theme.colors.tint }]} accessibilityRole="button">
              <Text preset="label" style={{ color: theme.isDark ? theme.colors.background : theme.colors.card }}>{t('journalCreate')}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={journalViewMode === 'grid' ? styles.journalGrid : styles.journalList}>
            {journalItems.map((journal) => (
              <TouchableOpacity
                key={journal.id}
                onPress={() => router.push({ pathname: '/journal/[id]', params: { id: journal.id } })}
                style={[
                  journalViewMode === 'grid' ? styles.journalGridCard : styles.journalCard,
                  { borderColor: theme.colors.border, backgroundColor: theme.colors.surface },
                ]}
                accessibilityRole="button"
              >
                <View style={[journalViewMode === 'grid' ? styles.journalGridColor : styles.journalColor, { backgroundColor: journal.color }]} />
                <View style={journalViewMode === 'grid' ? styles.journalGridCopy : styles.journalCopy}>
                  {journalViewMode === 'grid' ? <Ionicons name="journal-outline" size={22} color={theme.colors.textSecondary} /> : null}
                  <Text preset="h3" color="text" numberOfLines={journalViewMode === 'grid' ? 2 : 1} style={journalViewMode === 'grid' ? styles.journalGridTitle : undefined}>{journal.title}</Text>
                  <Text preset="caption" color="textSecondary">{journal.count === 1 ? t('journalEntryCountOne') : t('journalEntryCountMany').replace('{count}', String(journal.count))}</Text>
                </View>
                {journalViewMode === 'list' ? <Ionicons name="chevron-forward" size={18} color={theme.colors.textSecondary} /> : null}
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      <PaywallModal
        visible={showPremiumModal}
        onClose={closePremiumModal}
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

      <Modal visible={showCreateModal} animationType="fade" transparent onRequestClose={() => setShowCreateModal(false)}>
        <View style={[styles.modalOverlay, { backgroundColor: theme.colors.overlay }]}>
          <View style={[styles.modalCard, { backgroundColor: theme.colors.background, borderColor: theme.colors.border }]}>
            <Text preset="h2" color="text" style={styles.modalTitle}>{t('journalCreate')}</Text>
            <TextInput
              value={journalTitle}
              onChangeText={setJournalTitle}
              placeholder={t('journalTitlePlaceholder')}
              placeholderTextColor={theme.colors.textSecondary}
              autoFocus
              style={[styles.modalInput, { borderColor: theme.colors.border, backgroundColor: theme.colors.surface, color: theme.colors.text, fontFamily: theme.fontFamily }]}
              returnKeyType="done"
              onSubmitEditing={() => { void handleCreateJournal(); }}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity onPress={() => setShowCreateModal(false)} style={styles.modalAction} disabled={isCreating}>
                <Text preset="label" color="textSecondary">{t('entryCancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => { void handleCreateJournal(); }} style={[styles.modalActionPrimary, { backgroundColor: theme.colors.tint }]} disabled={isCreating}>
                <Text preset="label" style={{ color: theme.isDark ? theme.colors.background : theme.colors.card }}>{t('journalCreate')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { paddingHorizontal: 20, paddingBottom: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 16 },
  title: { fontWeight: '800' },
  subtitle: { marginTop: 4 },
  addButton: { width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  viewModePill: {
    alignSelf: 'center',
    flexDirection: 'row',
    borderWidth: 1,
    borderRadius: 18,
    padding: 2,
    marginBottom: 14,
  },
  viewModeButton: {
    minWidth: 68,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 15,
    paddingHorizontal: 12,
  },
  viewModeButtonText: { fontWeight: '700' },
  content: { paddingHorizontal: 20, paddingTop: 2 },
  journalList: { gap: 10 },
  journalGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  journalCard: { minHeight: 74, borderWidth: 1, borderRadius: 8, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, gap: 12 },
  journalGridCard: { width: '48%', minHeight: 138, borderWidth: 1, borderRadius: 8, overflow: 'hidden' },
  journalColor: { width: 12, height: 42, borderRadius: 6 },
  journalGridColor: { height: 8, width: '100%' },
  journalCopy: { flex: 1 },
  journalGridCopy: { flex: 1, padding: 14, justifyContent: 'space-between', gap: 10 },
  journalGridTitle: { fontWeight: '800', lineHeight: 22 },
  emptyState: { borderWidth: 1, borderRadius: 8, padding: 22, alignItems: 'center' },
  emptyTitle: { marginTop: 12, marginBottom: 6, fontWeight: '800' },
  emptyBody: { textAlign: 'center', lineHeight: 20 },
  emptyButton: { minHeight: 42, borderRadius: 10, paddingHorizontal: 18, alignItems: 'center', justifyContent: 'center', marginTop: 18 },
  modalOverlay: { flex: 1, justifyContent: 'center', paddingHorizontal: 24 },
  modalCard: { borderWidth: 1, borderRadius: 12, padding: 18 },
  modalTitle: { marginBottom: 14 },
  modalInput: { height: 46, borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, fontSize: 16 },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 18 },
  modalAction: { minHeight: 40, paddingHorizontal: 14, alignItems: 'center', justifyContent: 'center' },
  modalActionPrimary: { minHeight: 40, borderRadius: 8, paddingHorizontal: 16, alignItems: 'center', justifyContent: 'center' },
});
