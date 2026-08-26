import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Image, Modal, ScrollView, StyleSheet, TextInput, TouchableOpacity, useWindowDimensions, View } from 'react-native';
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
import { BUILTIN_JOURNAL_BACKGROUNDS, getJournalCoverImageSource } from '@/features/journal/domain/JournalBackgrounds';
import { chooseDiaryPhotos } from '@/features/diary/services/DiaryPhotoPickerService';
import { diaryPhotoService } from '@/features/diary/services/DiaryPhotoService';
import type { JournalColumnCount } from '@/stores/useAppStore';

function entryBelongsToJournal(entry: { readonly journalIds?: readonly string[]; readonly collectionIds?: readonly string[] }, journalId: string): boolean {
  return (entry.journalIds ?? entry.collectionIds ?? []).includes(journalId);
}

interface JournalHomeItem {
  readonly id: string;
  readonly title: string;
  readonly count: number;
  readonly canRename: boolean;
  readonly coverImageUri?: string;
  readonly coverImageWidth?: number;
  readonly coverImageHeight?: number;
}

const PREMIUM_REMINDER_ENTRY_THRESHOLD = 5;
const PREMIUM_REMINDER_COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000;
const ALL_ENTRIES_JOURNAL_ID = 'all';
const UNASSIGNED_JOURNAL_ID = 'unassigned';
const JOURNAL_GRID_GAP = 12;
const JOURNAL_GRID_HORIZONTAL_PADDING = 40;
const journalColumnOptions: readonly { readonly count: JournalColumnCount; readonly label: string }[] = [
  { count: 1, label: '12' },
  { count: 2, label: '6 6' },
  { count: 3, label: '4 4 4' },
  { count: 4, label: '3 3 3 3' },
];

function getNextJournalColumnCount(count: JournalColumnCount): JournalColumnCount {
  if (count === 1) return 2;
  if (count === 2) return 3;
  if (count === 3) return 4;
  return 1;
}

function getJournalLayoutIcon(count: JournalColumnCount): React.ComponentProps<typeof Ionicons>['name'] {
  if (count === 1) return 'square-outline';
  if (count === 2) return 'grid-outline';
  if (count === 3) return 'apps-outline';
  return 'keypad-outline';
}

export default function JournalsScreen(): React.JSX.Element {
  const router = useRouter();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { width: windowWidth } = useWindowDimensions();
  const t = useTranslation();
  const { entries, refresh: refreshEntries } = useDiary();
  const { journals, refresh: refreshJournals, createJournal, saveJournal, deleteJournal } = useJournals();
  const { isPro } = useSubscription();
  const isOnboarded = useAppStore((state) => state.isOnboarded);
  const premiumOnboardingPromptShown = useAppStore((state) => state.premiumOnboardingPromptShown);
  const premiumPromptDismissedAt = useAppStore((state) => state.premiumPromptDismissedAt);
  const journalColumnCount = useAppStore((state) => state.journalColumnCount);
  const showPermanentJournals = useAppStore((state) => state.showPermanentJournals);
  const markPremiumOnboardingPromptShown = useAppStore((state) => state.markPremiumOnboardingPromptShown);
  const markPremiumPromptDismissed = useAppStore((state) => state.markPremiumPromptDismissed);
  const setJournalColumnCount = useAppStore((state) => state.setJournalColumnCount);
  const setShowPermanentJournals = useAppStore((state) => state.setShowPermanentJournals);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [journalTitle, setJournalTitle] = useState('');
  const [renameJournalTitle, setRenameJournalTitle] = useState('');
  const [renamingJournal, setRenamingJournal] = useState<Journal | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [deletingJournalId, setDeletingJournalId] = useState<string | null>(null);
  const [assigningCoverJournalId, setAssigningCoverJournalId] = useState<string | null>(null);
  const [openJournalOptionsId, setOpenJournalOptionsId] = useState<string | null>(null);
  const [coverPickerJournal, setCoverPickerJournal] = useState<Journal | null>(null);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
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
  const journalCardWidth = useMemo(() => {
    const availableWidth = Math.max(240, windowWidth - JOURNAL_GRID_HORIZONTAL_PADDING);
    const totalGap = JOURNAL_GRID_GAP * (journalColumnCount - 1);
    return Math.floor((availableWidth - totalGap) / journalColumnCount);
  }, [journalColumnCount, windowWidth]);
  const wideJournalCover = journalColumnCount === 1;
  const compactJournalCover = journalColumnCount >= 3;
  const denseJournalCover = journalColumnCount >= 4;
  const unassignedEntries = useMemo(() => visibleEntries.filter((entry) => (entry.journalIds?.length ?? entry.collectionIds.length) === 0), [visibleEntries]);
  const journalItems = useMemo<JournalHomeItem[]>(() => {
    const assignedItems = journals.map((journal) => ({
      id: journal.id,
      title: journal.title,
      count: visibleEntries.filter((entry) => entryBelongsToJournal(entry, journal.id)).length,
      canRename: true,
      coverImageUri: journal.coverImageUri,
      coverImageWidth: journal.coverImageWidth,
      coverImageHeight: journal.coverImageHeight,
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
  };

  const handleOpenRenameJournal = useCallback((journalId: string) => {
    const journal = journals.find((item) => item.id === journalId);
    if (!journal) return;
    setOpenJournalOptionsId(null);
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
    setOpenJournalOptionsId(null);

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

  const handleOpenCoverPicker = useCallback((journalId: string) => {
    const journal = journals.find((item) => item.id === journalId);
    if (!journal) return;
    setOpenJournalOptionsId(null);
    setCoverPickerJournal(journal);
  }, [journals]);

  const handleAssignGalleryCover = useCallback(() => {
    const journal = coverPickerJournal;
    if (!journal) return;
    void (async () => {
      const result = await chooseDiaryPhotos();
      if (!result.success) {
        if (result.error === 'native-module-missing') {
          Alert.alert(t('entryPhotoImportFailedTitle'), t('entryPhotoNativeModuleMissingMessage'));
        } else {
          Alert.alert(t('entryPhotoPermissionTitle'), t('entryPhotoLibraryPermissionMessage'));
        }
        return;
      }
      const asset = result.assets[0];
      if (!asset) return;
      setAssigningCoverJournalId(journal.id);
      try {
        const imported = await diaryPhotoService.importAsset(asset);
        const saveResult = await saveJournal({
          ...journal,
          coverImageUri: imported.uri,
          coverImageWidth: imported.width,
          coverImageHeight: imported.height,
        });
        if (!saveResult.success) Alert.alert(t('entryErrorTitle'), saveResult.error.message);
      } catch {
        Alert.alert(t('entryPhotoImportFailedTitle'), t('entryPhotoImportFailedMessage'));
      } finally {
        setAssigningCoverJournalId(null);
        setCoverPickerJournal(null);
      }
    })();
  }, [coverPickerJournal, saveJournal, t]);

  const handleAssignBuiltinCover = useCallback((backgroundUri: string) => {
    const journal = coverPickerJournal;
    const background = BUILTIN_JOURNAL_BACKGROUNDS.find((item) => item.uri === backgroundUri);
    if (!journal || !background) return;
    void (async () => {
      setAssigningCoverJournalId(journal.id);
      const saveResult = await saveJournal({
        ...journal,
        coverImageUri: background.uri,
        coverImageWidth: background.width,
        coverImageHeight: background.height,
      });
      setAssigningCoverJournalId(null);
      setCoverPickerJournal(null);
      if (!saveResult.success) Alert.alert(t('entryErrorTitle'), saveResult.error.message);
    })();
  }, [coverPickerJournal, saveJournal, t]);

  const handleRemoveJournalCover = useCallback((journalId: string) => {
    const journal = journals.find((item) => item.id === journalId);
    if (!journal) return;
    setOpenJournalOptionsId(null);
    void (async () => {
      setAssigningCoverJournalId(journal.id);
      const saveResult = await saveJournal({
        ...journal,
        coverImageUri: undefined,
        coverImageWidth: undefined,
        coverImageHeight: undefined,
      });
      setAssigningCoverJournalId(null);
      if (!saveResult.success) Alert.alert(t('entryErrorTitle'), saveResult.error.message);
    })();
  }, [journals, saveJournal, t]);

  const journalEntryLabelText = useCallback(
    (count: number) => count === 1 ? t('journalEntryLabelOne') : t('journalEntryLabelMany'),
    [t],
  );

  const renderJournalOptions = (journal: JournalHomeItem) => {
    if (!journal.canRename) return null;
    const isOpen = openJournalOptionsId === journal.id;
    return (
      <View style={styles.journalOptionsWrap}>
        <TouchableOpacity
          onPress={(event) => {
            event.stopPropagation();
            setOpenJournalOptionsId((current) => current === journal.id ? null : journal.id);
          }}
          style={[styles.journalOptionsButton, isOpen && { backgroundColor: theme.colors.tint + '18' }]}
          accessibilityRole="button"
          accessibilityLabel={t('journalOptionsA11y')}
          accessibilityState={{ expanded: isOpen }}
        >
          <Ionicons name="ellipsis-horizontal" size={19} color={isOpen ? theme.colors.tint : theme.colors.text} />
        </TouchableOpacity>
        {isOpen ? (
          <View style={[styles.journalOptionsMenu, { backgroundColor: theme.colors.background, borderColor: theme.colors.border }]}>
            <TouchableOpacity
              onPress={(event) => {
                event.stopPropagation();
                handleOpenCoverPicker(journal.id);
              }}
              style={styles.journalOptionsItem}
              accessibilityRole="button"
              accessibilityLabel={t('journalSetCoverA11y')}
              disabled={assigningCoverJournalId === journal.id}
            >
              <Ionicons name="image-outline" size={17} color={theme.colors.textSecondary} />
              <Text preset="caption" color="text" style={styles.journalOptionsText}>{t('journalSetCover')}</Text>
            </TouchableOpacity>
            {journal.coverImageUri ? (
              <TouchableOpacity
                onPress={(event) => {
                  event.stopPropagation();
                  handleRemoveJournalCover(journal.id);
                }}
                style={styles.journalOptionsItem}
                accessibilityRole="button"
                accessibilityLabel={t('journalRemoveCoverA11y')}
                disabled={assigningCoverJournalId === journal.id}
              >
                <Ionicons name="close-circle-outline" size={17} color={theme.colors.textSecondary} />
                <Text preset="caption" color="text" style={styles.journalOptionsText}>{t('journalRemoveCover')}</Text>
              </TouchableOpacity>
            ) : null}
            <TouchableOpacity
              onPress={(event) => {
                event.stopPropagation();
                handleOpenRenameJournal(journal.id);
              }}
              style={styles.journalOptionsItem}
              accessibilityRole="button"
              accessibilityLabel={t('journalRenameA11y')}
            >
              <Ionicons name="pencil-outline" size={17} color={theme.colors.textSecondary} />
              <Text preset="caption" color="text" style={styles.journalOptionsText}>{t('journalRename')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={(event) => {
                event.stopPropagation();
                handleDeleteJournal(journal.id);
              }}
              style={styles.journalOptionsItem}
              accessibilityRole="button"
              accessibilityLabel={t('journalDeleteA11y')}
              disabled={deletingJournalId === journal.id}
            >
              <Ionicons name="trash-outline" size={17} color={theme.colors.error} />
              <Text preset="caption" style={[styles.journalOptionsText, { color: theme.colors.error }]}>{t('entryDelete')}</Text>
            </TouchableOpacity>
          </View>
        ) : null}
      </View>
    );
  };

  return (
    <View style={[styles.root, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.fixedHeader, { paddingTop: insets.top + 16, backgroundColor: theme.colors.background }]}>
        <View style={styles.titleRow}>
          <Text style={[styles.heading, { color: theme.colors.text }]}>{t('journalsTitle')}</Text>
          <View style={styles.headerActions}>
            <TouchableOpacity
              onPress={() => {
                setOpenJournalOptionsId(null);
                setJournalColumnCount(getNextJournalColumnCount(journalColumnCount));
              }}
              style={styles.headerIconButton}
              accessibilityRole="button"
              accessibilityLabel={`${t('journalLayoutA11y')}: ${journalColumnOptions.find((option) => option.count === journalColumnCount)?.label ?? '6 6'}`}
            >
              <Ionicons name={getJournalLayoutIcon(journalColumnCount)} size={22} color={theme.colors.text} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setShowPermanentJournals(!showPermanentJournals)}
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
          <View style={styles.journalCoverGrid}>
            {journalItems.map((journal) => {
              const journalAccentColor = theme.colors.tint;
              const coverCountMeta = (
                <View style={[
                  styles.journalCoverCountMeta,
                  compactJournalCover && styles.journalCoverCountMetaCompact,
                  denseJournalCover && styles.journalCoverCountMetaDense,
                ]}>
                  <View style={[
                    styles.journalCountCircle,
                    compactJournalCover && styles.journalCountCircleCompact,
                    denseJournalCover && styles.journalCountCircleDense,
                    { backgroundColor: journalAccentColor },
                  ]}>
                    <Text
                      preset="label"
                      dynamicType={false}
                      adjustsFontSizeToFit
                      minimumFontScale={0.65}
                      numberOfLines={1}
                      style={[
                        styles.journalCountText,
                        compactJournalCover && styles.journalCountTextCompact,
                        denseJournalCover && styles.journalCountTextDense,
                      ]}
                    >
                      {journal.count}
                    </Text>
                  </View>
                  {!denseJournalCover ? (
                    <Text
                      preset="caption"
                      dynamicType={false}
                      numberOfLines={1}
                      style={[styles.journalCoverCountLabel, compactJournalCover && styles.journalCoverCountLabelCompact]}
                    >
                      {journalEntryLabelText(journal.count)}
                    </Text>
                  ) : null}
                </View>
              );
              return (
              <TouchableOpacity
                key={journal.id}
                onPress={() => router.push({ pathname: '/journal/[id]', params: { id: journal.id } })}
                style={[
                  styles.journalCoverCard,
                  openJournalOptionsId === journal.id && styles.journalCardRaised,
                  { width: journalCardWidth },
                  { borderColor: theme.colors.border, backgroundColor: theme.colors.surface },
                ]}
                accessibilityRole="button"
              >
                {renderJournalOptions(journal)}
                <View style={[
                  styles.journalCoverImageFrame,
                  wideJournalCover && styles.journalCoverImageFrameWide,
                  { backgroundColor: theme.colors.tint + '18' },
                ]}>
                  {journal.coverImageUri ? (
                    <Image source={getJournalCoverImageSource(journal.coverImageUri)} style={styles.journalCoverImage} resizeMode="cover" />
                  ) : (
                    <View style={styles.journalCoverPlaceholder}>
                      <Ionicons name="book-outline" size={34} color={theme.colors.tint} />
                    </View>
                  )}
                  {coverCountMeta}
                </View>
                <View style={[
                  styles.journalCoverFooter,
                  wideJournalCover && styles.journalCoverFooterWide,
                  compactJournalCover && styles.journalCoverFooterCompact,
                ]}>
                  <View style={styles.journalCoverCopy}>
                    <Text
                      preset="h3"
                      color="text"
                      numberOfLines={denseJournalCover ? 1 : 2}
                      style={[
                        styles.journalCoverTitle,
                        wideJournalCover && styles.journalCoverTitleWide,
                        compactJournalCover && styles.journalCoverTitleCompact,
                        denseJournalCover && styles.journalCoverTitleDense,
                      ]}
                    >
                      {journal.title}
                    </Text>
                  </View>
                </View>
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

      <Modal visible={Boolean(coverPickerJournal)} animationType="fade" transparent onRequestClose={() => setCoverPickerJournal(null)}>
        <View style={[styles.modalOverlay, { backgroundColor: theme.colors.overlay }]}>
          <View style={[styles.modalCard, { backgroundColor: theme.colors.background, borderColor: theme.colors.border }]}>
            <View style={styles.coverPickerHeader}>
              <Text preset="h2" color="text" style={styles.modalTitle}>{t('journalSetCover')}</Text>
              <TouchableOpacity
                onPress={() => setCoverPickerJournal(null)}
                style={styles.coverPickerClose}
                accessibilityRole="button"
                accessibilityLabel={t('modalCloseA11y')}
              >
                <Ionicons name="close" size={22} color={theme.colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              onPress={handleAssignGalleryCover}
              style={[styles.coverPickerGalleryButton, { borderColor: theme.colors.border, backgroundColor: theme.colors.surface }]}
              accessibilityRole="button"
              accessibilityLabel={t('journalSetCoverFromGalleryA11y')}
              disabled={Boolean(assigningCoverJournalId)}
            >
              <Ionicons name="image-outline" size={20} color={theme.colors.tint} />
              <Text preset="label" color="text" style={styles.coverPickerGalleryText}>{t('journalSetCoverFromGallery')}</Text>
            </TouchableOpacity>
            <Text preset="caption" color="textSecondary" style={styles.coverPickerSectionLabel}>{t('journalAppBackgrounds')}</Text>
            <View style={styles.coverPickerGrid}>
              {BUILTIN_JOURNAL_BACKGROUNDS.map((background) => {
                const selected = coverPickerJournal?.coverImageUri === background.uri;
                return (
                  <TouchableOpacity
                    key={background.id}
                    onPress={() => handleAssignBuiltinCover(background.uri)}
                    style={[
                      styles.coverPickerOption,
                      {
                        borderColor: selected ? theme.colors.tint : theme.colors.border,
                        backgroundColor: theme.colors.surface,
                      },
                    ]}
                    accessibilityRole="radio"
                    accessibilityState={{ selected }}
                    accessibilityLabel={`${t('journalSetCoverA11y')} ${background.title}`}
                    disabled={Boolean(assigningCoverJournalId)}
                  >
                    <Image source={background.source} style={styles.coverPickerPreview} resizeMode="cover" />
                    {selected ? (
                      <View style={[styles.coverPickerSelectedBadge, { backgroundColor: theme.colors.tint }]}>
                        <Ionicons name="checkmark" size={14} color="#fff" />
                      </View>
                    ) : null}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>
      </Modal>

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
  content: { paddingHorizontal: 20, paddingTop: 12 },
  journalCoverGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: JOURNAL_GRID_GAP },
  journalCoverCard: { position: 'relative', borderWidth: 1, borderRadius: 8 },
  journalCardRaised: { zIndex: 20, elevation: 20 },
  journalCoverImageFrame: {
    width: '100%',
    aspectRatio: 0.72,
    alignItems: 'center',
    justifyContent: 'center',
    borderTopLeftRadius: 7,
    borderTopRightRadius: 7,
    overflow: 'hidden',
  },
  journalCoverImageFrameWide: {
    aspectRatio: 1.58,
  },
  journalCoverImage: {
    width: '100%',
    height: '100%',
  },
  journalCoverPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  journalCoverCountMeta: {
    position: 'absolute',
    left: 8,
    bottom: 8,
    minHeight: 36,
    maxWidth: '82%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    borderRadius: 18,
    paddingRight: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.42)',
  },
  journalCoverCountMetaCompact: {
    left: 6,
    bottom: 6,
    minHeight: 30,
    gap: 5,
    paddingRight: 7,
  },
  journalCoverCountMetaDense: {
    left: 5,
    bottom: 5,
    minHeight: 26,
    paddingRight: 0,
  },
  journalCountCircle: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
  journalCountCircleCompact: { width: 30, height: 30, borderRadius: 15 },
  journalCountCircleDense: { width: 26, height: 26, borderRadius: 13 },
  journalCountText: { color: '#fff', fontSize: 15, lineHeight: 18, fontWeight: '800', textAlign: 'center' },
  journalCountTextCompact: { fontSize: 12, lineHeight: 14 },
  journalCountTextDense: { fontSize: 11, lineHeight: 13 },
  journalCoverCountLabel: { flexShrink: 1, color: '#fff', fontWeight: '700' },
  journalCoverCountLabelCompact: { fontSize: 11, lineHeight: 13 },
  journalCoverFooter: { minHeight: 76, flexDirection: 'row', alignItems: 'center', padding: 10, gap: 6 },
  journalCoverFooterWide: { minHeight: 56, paddingHorizontal: 12, paddingVertical: 8 },
  journalCoverFooterCompact: { minHeight: 48, padding: 7 },
  journalCoverCopy: { flex: 1, minWidth: 0 },
  journalCoverTitle: { fontWeight: '800', lineHeight: 22 },
  journalCoverTitleWide: { fontSize: 18, lineHeight: 23 },
  journalCoverTitleCompact: { fontSize: 14, lineHeight: 18 },
  journalCoverTitleDense: { fontSize: 12, lineHeight: 15 },
  journalOptionsWrap: { position: 'absolute', top: 6, right: 6, zIndex: 30, elevation: 30, alignItems: 'flex-end' },
  journalOptionsButton: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  journalOptionsMenu: {
    minWidth: 154,
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 24,
  },
  journalOptionsItem: { minHeight: 36, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 10 },
  journalOptionsText: { flex: 1, fontWeight: '700' },
  emptyState: { borderWidth: 1, borderRadius: 8, padding: 22, alignItems: 'center' },
  emptyTitle: { marginTop: 12, marginBottom: 6, fontWeight: '800' },
  emptyBody: { textAlign: 'center', lineHeight: 20 },
  emptyButton: { minHeight: 42, borderRadius: 10, paddingHorizontal: 18, alignItems: 'center', justifyContent: 'center', marginTop: 18 },
  modalOverlay: { flex: 1, justifyContent: 'center', paddingHorizontal: 24 },
  modalCard: { borderWidth: 1, borderRadius: 12, padding: 18 },
  modalTitle: { marginBottom: 14 },
  coverPickerHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 },
  coverPickerClose: { width: 34, height: 34, alignItems: 'center', justifyContent: 'center' },
  coverPickerGalleryButton: { minHeight: 44, borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 10 },
  coverPickerGalleryText: { fontWeight: '700' },
  coverPickerSectionLabel: { marginTop: 16, marginBottom: 8, fontWeight: '800' },
  coverPickerGrid: { flexDirection: 'row', gap: 8 },
  coverPickerOption: { flex: 1, aspectRatio: 1.2, borderWidth: 1, borderRadius: 8, overflow: 'hidden' },
  coverPickerPreview: { width: '100%', height: '100%' },
  coverPickerSelectedBadge: { position: 'absolute', top: 6, right: 6, width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  modalInput: {
    height: 46,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingTop: 0,
    paddingBottom: 0,
    fontSize: 16,
    lineHeight: 20,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 18 },
  modalAction: { minHeight: 40, paddingHorizontal: 14, alignItems: 'center', justifyContent: 'center' },
  modalActionPrimary: { minHeight: 40, borderRadius: 8, paddingHorizontal: 16, alignItems: 'center', justifyContent: 'center' },
});
