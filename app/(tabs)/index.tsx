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
import type { Journal } from '@/features/journal/domain/Journal';

function entryBelongsToJournal(entry: { readonly journalIds?: readonly string[]; readonly collectionIds?: readonly string[] }, journalId: string): boolean {
  return (entry.journalIds ?? entry.collectionIds ?? []).includes(journalId);
}

type JournalViewMode = 'list' | 'grid';

interface JournalHomeItem {
  readonly id: string;
  readonly title: string;
  readonly count: number;
  readonly canRename: boolean;
}

const PREMIUM_REMINDER_ENTRY_THRESHOLD = 5;
const PREMIUM_REMINDER_COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000;
const JOURNAL_VIEW_MODES = ['list', 'grid'] as const satisfies readonly JournalViewMode[];
const ALL_ENTRIES_JOURNAL_ID = 'all';
const UNASSIGNED_JOURNAL_ID = 'unassigned';

export default function JournalsScreen(): React.JSX.Element {
  const router = useRouter();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const t = useTranslation();
  const { entries, refresh: refreshEntries } = useDiary();
  const { journals, refresh: refreshJournals, createJournal, saveJournal, deleteJournal } = useJournals();
  const { isPro } = useSubscription();
  const isOnboarded = useAppStore((state) => state.isOnboarded);
  const premiumOnboardingPromptShown = useAppStore((state) => state.premiumOnboardingPromptShown);
  const premiumPromptDismissedAt = useAppStore((state) => state.premiumPromptDismissedAt);
  const markPremiumOnboardingPromptShown = useAppStore((state) => state.markPremiumOnboardingPromptShown);
  const markPremiumPromptDismissed = useAppStore((state) => state.markPremiumPromptDismissed);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [journalTitle, setJournalTitle] = useState('');
  const [renameJournalTitle, setRenameJournalTitle] = useState('');
  const [renamingJournal, setRenamingJournal] = useState<Journal | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [deletingJournalId, setDeletingJournalId] = useState<string | null>(null);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [journalViewMode, setJournalViewMode] = useState<JournalViewMode>('list');
  const [showPermanentJournals, setShowPermanentJournals] = useState(true);
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
      canRename: true,
    }));

    const permanentItems: JournalHomeItem[] = showPermanentJournals ? [
      {
        id: ALL_ENTRIES_JOURNAL_ID,
        title: t('journalAllEntriesTitle'),
        count: visibleEntries.length,
        canRename: false,
      },
    ] : [];

    if (unassignedEntries.length === 0) return [...permanentItems, ...assignedItems];

    return [
      ...permanentItems,
      ...assignedItems,
      ...(showPermanentJournals ? [{
        id: UNASSIGNED_JOURNAL_ID,
        title: t('journalUnassignedTitle'),
        count: unassignedEntries.length,
        canRename: false,
      }] : []),
    ];
  }, [journals, showPermanentJournals, t, unassignedEntries.length, visibleEntries]);

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

  const handleOpenRenameJournal = useCallback((journalId: string) => {
    const journal = journals.find((item) => item.id === journalId);
    if (!journal) return;
    setRenamingJournal(journal);
    setRenameJournalTitle(journal.title);
    setShowRenameModal(true);
  }, [journals]);

  const handleRenameJournal = async () => {
    const trimmed = renameJournalTitle.trim();
    if (!trimmed) {
      Alert.alert(t('journalTitleRequiredTitle'), t('journalTitleRequiredMessage'));
      return;
    }
    if (!renamingJournal) return;

    setIsRenaming(true);
    const result = await saveJournal({ ...renamingJournal, title: trimmed });
    setIsRenaming(false);
    if (!result.success) {
      Alert.alert(t('entryErrorTitle'), result.error.message);
      return;
    }

    setRenamingJournal(null);
    setRenameJournalTitle('');
    setShowRenameModal(false);
  };

  const handleDeleteJournal = useCallback((journalId: string) => {
    const journal = journals.find((item) => item.id === journalId);
    if (!journal) return;

    Alert.alert(
      t('journalDeleteTitle'),
      t('journalDeleteMessage').replace('{title}', journal.title),
      [
        { text: t('entryCancel'), style: 'cancel' },
        {
          text: t('entryDelete'),
          style: 'destructive',
          onPress: () => {
            void (async () => {
              setDeletingJournalId(journal.id);
              const result = await deleteJournal(journal.id);
              setDeletingJournalId(null);
              if (!result.success) {
                Alert.alert(t('entryErrorTitle'), result.error.message);
              }
            })();
          },
        },
      ],
    );
  }, [deleteJournal, journals, t]);

  const journalEntryLabelText = useCallback(
    (count: number) => count === 1 ? t('journalEntryLabelOne') : t('journalEntryLabelMany'),
    [t],
  );

  return (
    <View style={[styles.root, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.fixedHeader, { paddingTop: insets.top + 16, backgroundColor: theme.colors.background }]}>
        <View style={styles.titleRow}>
          <Text style={[styles.heading, { color: theme.colors.text }]}>{t('journalsTitle')}</Text>
          <View style={styles.headerActions}>
            <TouchableOpacity
              onPress={() => setShowPermanentJournals((current) => !current)}
              style={[
                styles.headerIconButton,
                showPermanentJournals && { backgroundColor: theme.colors.tint + '18' },
              ]}
              accessibilityRole="switch"
              accessibilityLabel={t('journalTogglePermanentGroupsA11y')}
              accessibilityState={{ checked: showPermanentJournals }}
            >
              <Ionicons name={showPermanentJournals ? 'albums-outline' : 'albums'} size={23} color={showPermanentJournals ? theme.colors.tint : theme.colors.text} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setShowCreateModal(true)}
              style={styles.headerIconButton}
              accessibilityRole="button"
              accessibilityLabel={t('journalCreateA11y')}
            >
              <Ionicons name="add-outline" size={24} color={theme.colors.text} />
            </TouchableOpacity>
          </View>
        </View>
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
            {journalItems.map((journal) => {
              const journalAccentColor = theme.colors.tint;
              return (
              <TouchableOpacity
                key={journal.id}
                onPress={() => router.push({ pathname: '/journal/[id]', params: { id: journal.id } })}
                style={[
                  journalViewMode === 'grid' ? styles.journalGridCard : styles.journalCard,
                  { borderColor: theme.colors.border, backgroundColor: theme.colors.surface },
                ]}
                accessibilityRole="button"
              >
                {journalViewMode === 'list' ? (
                  <View style={[styles.journalCountCircle, { backgroundColor: journalAccentColor }]}>
                    <Text
                      preset="label"
                      dynamicType={false}
                      adjustsFontSizeToFit
                      minimumFontScale={0.65}
                      numberOfLines={1}
                      style={styles.journalCountText}
                    >
                      {journal.count}
                    </Text>
                  </View>
                ) : null}
                <View style={journalViewMode === 'grid' ? styles.journalGridCopy : styles.journalCopy}>
                  {journalViewMode === 'grid' ? (
                    <View style={styles.journalGridHeader}>
                      <View style={[styles.journalCountCircle, { backgroundColor: journalAccentColor }]}>
                        <Text
                          preset="label"
                          dynamicType={false}
                          adjustsFontSizeToFit
                          minimumFontScale={0.65}
                          numberOfLines={1}
                          style={styles.journalCountText}
                        >
                          {journal.count}
                        </Text>
                      </View>
                      {journal.canRename ? (
                        <View style={styles.journalCardActions}>
                          <TouchableOpacity
                            onPress={(event) => {
                              event.stopPropagation();
                              handleDeleteJournal(journal.id);
                            }}
                            style={styles.journalEditButton}
                            accessibilityRole="button"
                            accessibilityLabel={t('journalDeleteA11y')}
                            disabled={deletingJournalId === journal.id}
                          >
                            <Ionicons name="trash-outline" size={18} color={theme.colors.error} />
                          </TouchableOpacity>
                          <TouchableOpacity
                            onPress={(event) => {
                              event.stopPropagation();
                              handleOpenRenameJournal(journal.id);
                            }}
                            style={styles.journalEditButton}
                            accessibilityRole="button"
                            accessibilityLabel={t('journalRenameA11y')}
                          >
                            <Ionicons name="pencil-outline" size={18} color={theme.colors.textSecondary} />
                          </TouchableOpacity>
                        </View>
                      ) : null}
                    </View>
                  ) : null}
                  <Text preset="h3" color="text" numberOfLines={journalViewMode === 'grid' ? 2 : 1} style={journalViewMode === 'grid' ? styles.journalGridTitle : undefined}>{journal.title}</Text>
                  <Text preset="caption" color="textSecondary">{journalEntryLabelText(journal.count)}</Text>
                </View>
                {journalViewMode === 'list' && journal.canRename ? (
                  <View style={styles.journalCardActions}>
                    <TouchableOpacity
                      onPress={(event) => {
                        event.stopPropagation();
                        handleDeleteJournal(journal.id);
                      }}
                      style={styles.journalEditButton}
                      accessibilityRole="button"
                      accessibilityLabel={t('journalDeleteA11y')}
                      disabled={deletingJournalId === journal.id}
                    >
                      <Ionicons name="trash-outline" size={18} color={theme.colors.error} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={(event) => {
                        event.stopPropagation();
                        handleOpenRenameJournal(journal.id);
                      }}
                      style={styles.journalEditButton}
                      accessibilityRole="button"
                      accessibilityLabel={t('journalRenameA11y')}
                    >
                      <Ionicons name="pencil-outline" size={18} color={theme.colors.textSecondary} />
                    </TouchableOpacity>
                  </View>
                ) : null}
                {journalViewMode === 'list' ? <Ionicons name="chevron-forward" size={18} color={theme.colors.textSecondary} /> : null}
              </TouchableOpacity>
              );
            })}
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

      <Modal visible={showRenameModal} animationType="fade" transparent onRequestClose={() => setShowRenameModal(false)}>
        <View style={[styles.modalOverlay, { backgroundColor: theme.colors.overlay }]}>
          <View style={[styles.modalCard, { backgroundColor: theme.colors.background, borderColor: theme.colors.border }]}>
            <Text preset="h2" color="text" style={styles.modalTitle}>{t('journalRename')}</Text>
            <TextInput
              value={renameJournalTitle}
              onChangeText={setRenameJournalTitle}
              placeholder={t('journalTitlePlaceholder')}
              placeholderTextColor={theme.colors.textSecondary}
              autoFocus
              style={[styles.modalInput, { borderColor: theme.colors.border, backgroundColor: theme.colors.surface, color: theme.colors.text, fontFamily: theme.fontFamily }]}
              returnKeyType="done"
              onSubmitEditing={() => { void handleRenameJournal(); }}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity onPress={() => setShowRenameModal(false)} style={styles.modalAction} disabled={isRenaming}>
                <Text preset="label" color="textSecondary">{t('entryCancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => { void handleRenameJournal(); }} style={[styles.modalActionPrimary, { backgroundColor: theme.colors.tint }]} disabled={isRenaming}>
                <Text preset="label" style={{ color: theme.isDark ? theme.colors.background : theme.colors.card }}>{t('journalRenameSave')}</Text>
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
  fixedHeader: { zIndex: 30, elevation: 30, paddingHorizontal: 20 },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  heading: { fontSize: 24, fontWeight: '700' },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  headerIconButton: { width: 38, height: 34, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
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
  journalGridCard: { width: '48%', minHeight: 138, borderWidth: 1, borderRadius: 8 },
  journalCountCircle: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
  journalCountText: { color: '#fff', fontSize: 15, lineHeight: 18, fontWeight: '800', textAlign: 'center' },
  journalCopy: { flex: 1 },
  journalGridCopy: { flex: 1, padding: 14, justifyContent: 'space-between', gap: 10 },
  journalGridHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  journalGridTitle: { fontWeight: '800', lineHeight: 22 },
  journalCardActions: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  journalEditButton: { width: 36, height: 36, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
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
