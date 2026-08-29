import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Image, Modal, ScrollView, StyleSheet, TextInput, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@providers/ThemeProvider';
import { Text } from '@shared/components/Text';
import { AccentPillButton } from '@shared/components/AccentPillButton';
import { IconCircleButton } from '@shared/components/IconCircleButton';
import { SectionLabel } from '@shared/components/SectionLabel';
import { AppFooterNavigation } from '@shared/components/AppFooterNavigation';
import { SlidingDrawer } from '@shared/components/SlidingDrawer';
import { useDiary } from '@/features/diary/hooks/useDiary';
import { useJournals } from '@/features/journal/hooks/useJournals';
import { useProfileForm } from '@/features/profile/hooks/useProfileForm';
import { resolveImportedProfilePhotoUri } from '@/features/profile/services/ProfilePhotoService';
import { isDiaryEntryVisible } from '@/features/diary/services/DiaryEntryVisibility';
import { PaywallModal } from '@/shared/components/PaywallModal';
import { useSubscription } from '@/features/subscription/hooks/useSubscription';
import { useAppStore } from '@/stores/useAppStore';
import { APP_IDENTITY } from '@/config/appIdentity';
import { premiumPaywallTitle, useTranslation, type TranslationKey } from '@/localization/i18n';
import type { Journal } from '@/features/journal/domain/Journal';
import { BUILTIN_JOURNAL_BACKGROUNDS, getJournalCoverImageSource } from '@/features/journal/domain/JournalBackgrounds';
import { chooseDiaryPhotos } from '@/features/diary/services/DiaryPhotoPickerService';
import { diaryPhotoService } from '@/features/diary/services/DiaryPhotoService';
import type { JournalColumnCount, SyntheticJournalId } from '@/stores/useAppStore';

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
const journalColumnOptions: readonly { readonly count: JournalColumnCount; readonly labelKey: TranslationKey }[] = [
  { count: 1, labelKey: 'journalLayoutSingle' },
  { count: 2, labelKey: 'journalLayoutTwoColumn' },
  { count: 3, labelKey: 'journalLayoutThreeColumn' },
  { count: 4, labelKey: 'journalLayoutFourColumn' },
];

function getNextJournalColumnCount(count: JournalColumnCount): JournalColumnCount {
  if (count === 1) return 2;
  if (count === 2) return 3;
  if (count === 3) return 4;
  return 1;
}

function isSyntheticJournalId(journalId: string): journalId is SyntheticJournalId {
  return journalId === ALL_ENTRIES_JOURNAL_ID || journalId === UNASSIGNED_JOURNAL_ID;
}

export default function JournalsScreen(): React.JSX.Element {
  const router = useRouter();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { width: windowWidth } = useWindowDimensions();
  const t = useTranslation();
  const { entries, refresh: refreshEntries } = useDiary();
  const { journals, refresh: refreshJournals, createJournal, saveJournal, deleteJournal } = useJournals();
  const { profile } = useProfileForm();
  const { isPro } = useSubscription();
  const isOnboarded = useAppStore((state) => state.isOnboarded);
  const premiumOnboardingPromptShown = useAppStore((state) => state.premiumOnboardingPromptShown);
  const premiumPromptDismissedAt = useAppStore((state) => state.premiumPromptDismissedAt);
  const journalColumnCount = useAppStore((state) => state.journalColumnCount);
  const showPermanentJournals = useAppStore((state) => state.showPermanentJournals);
  const syntheticJournalCovers = useAppStore((state) => state.syntheticJournalCovers);
  const markPremiumOnboardingPromptShown = useAppStore((state) => state.markPremiumOnboardingPromptShown);
  const markPremiumPromptDismissed = useAppStore((state) => state.markPremiumPromptDismissed);
  const setJournalColumnCount = useAppStore((state) => state.setJournalColumnCount);
  const setShowPermanentJournals = useAppStore((state) => state.setShowPermanentJournals);
  const setSyntheticJournalCover = useAppStore((state) => state.setSyntheticJournalCover);
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
  const [coverPickerJournal, setCoverPickerJournal] = useState<JournalHomeItem | null>(null);
  const [journalSearchQuery, setJournalSearchQuery] = useState('');
  const [showJournalMenu, setShowJournalMenu] = useState(false);
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
  const closeJournalMenu = useCallback(() => {
    setShowJournalMenu(false);
  }, []);

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
        coverImageUri: syntheticJournalCovers.all?.coverImageUri,
        coverImageWidth: syntheticJournalCovers.all?.coverImageWidth,
        coverImageHeight: syntheticJournalCovers.all?.coverImageHeight,
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
        coverImageUri: syntheticJournalCovers.unassigned?.coverImageUri,
        coverImageWidth: syntheticJournalCovers.unassigned?.coverImageWidth,
        coverImageHeight: syntheticJournalCovers.unassigned?.coverImageHeight,
      }] : []),
    ];
  }, [journals, showPermanentJournals, syntheticJournalCovers, t, unassignedEntries.length, visibleEntries]);
  const filteredJournalItems = useMemo(() => {
    const query = journalSearchQuery.trim().toLocaleLowerCase();
    if (!query) return journalItems;
    return journalItems.filter((journal) => journal.title.toLocaleLowerCase().includes(query));
  }, [journalItems, journalSearchQuery]);
  const drawerProfile = useMemo(
    () => ({
      displayName: profile?.displayName.trim() || t('profileFallbackName'),
      avatarUri: profile?.avatarUri ? resolveImportedProfilePhotoUri(profile.avatarUri) : undefined,
    }),
    [profile, t],
  );

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
    const journal = journalItems.find((item) => item.id === journalId);
    if (!journal) return;
    setOpenJournalOptionsId(null);
    setCoverPickerJournal(journal);
  }, [journalItems]);

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
        if (isSyntheticJournalId(journal.id)) {
          setSyntheticJournalCover(journal.id, {
            coverImageUri: imported.uri,
            coverImageWidth: imported.width,
            coverImageHeight: imported.height,
          });
        } else {
          const persistedJournal = journals.find((item) => item.id === journal.id);
          if (!persistedJournal) return;
          const saveResult = await saveJournal({
            ...persistedJournal,
            coverImageUri: imported.uri,
            coverImageWidth: imported.width,
            coverImageHeight: imported.height,
          });
          if (!saveResult.success) Alert.alert(t('entryErrorTitle'), saveResult.error.message);
        }
      } catch {
        Alert.alert(t('entryPhotoImportFailedTitle'), t('entryPhotoImportFailedMessage'));
      } finally {
        setAssigningCoverJournalId(null);
        setCoverPickerJournal(null);
      }
    })();
  }, [coverPickerJournal, journals, saveJournal, setSyntheticJournalCover, t]);

  const handleAssignBuiltinCover = useCallback((backgroundUri: string) => {
    const journal = coverPickerJournal;
    const background = BUILTIN_JOURNAL_BACKGROUNDS.find((item) => item.uri === backgroundUri);
    if (!journal || !background) return;
    void (async () => {
      setAssigningCoverJournalId(journal.id);
      if (isSyntheticJournalId(journal.id)) {
        setSyntheticJournalCover(journal.id, {
          coverImageUri: background.uri,
          coverImageWidth: background.width,
          coverImageHeight: background.height,
        });
      } else {
        const persistedJournal = journals.find((item) => item.id === journal.id);
        if (persistedJournal) {
          const saveResult = await saveJournal({
            ...persistedJournal,
            coverImageUri: background.uri,
            coverImageWidth: background.width,
            coverImageHeight: background.height,
          });
          if (!saveResult.success) Alert.alert(t('entryErrorTitle'), saveResult.error.message);
        }
      }
      setAssigningCoverJournalId(null);
      setCoverPickerJournal(null);
    })();
  }, [coverPickerJournal, journals, saveJournal, setSyntheticJournalCover, t]);

  const handleRemoveJournalCover = useCallback((journalId: string) => {
    const journal = journalItems.find((item) => item.id === journalId);
    if (!journal) return;
    setOpenJournalOptionsId(null);
    if (isSyntheticJournalId(journal.id)) {
      setSyntheticJournalCover(journal.id, null);
      return;
    }
    const persistedJournal = journals.find((item) => item.id === journal.id);
    if (!persistedJournal) return;
    void (async () => {
      setAssigningCoverJournalId(journal.id);
      const saveResult = await saveJournal({
        ...persistedJournal,
        coverImageUri: undefined,
        coverImageWidth: undefined,
        coverImageHeight: undefined,
      });
      setAssigningCoverJournalId(null);
      if (!saveResult.success) Alert.alert(t('entryErrorTitle'), saveResult.error.message);
    })();
  }, [journalItems, journals, saveJournal, setSyntheticJournalCover, t]);

  const journalEntryLabelText = useCallback(
    (count: number) => count === 1 ? t('journalEntryLabelOne') : t('journalEntryLabelMany'),
    [t],
  );
  const activeJournalColumnLabel = t(journalColumnOptions.find((option) => option.count === journalColumnCount)?.labelKey ?? 'journalLayoutTwoColumn');

  const renderJournalOptions = (journal: JournalHomeItem) => {
    const isOpen = openJournalOptionsId === journal.id;
    return (
      <View style={styles.journalOptionsWrap}>
        <IconCircleButton
          icon="dots-horizontal"
          onPress={(event) => {
            event.stopPropagation();
            setOpenJournalOptionsId((current) => current === journal.id ? null : journal.id);
          }}
          accessibilityLabel={t('journalOptionsA11y')}
          accessibilityState={{ expanded: isOpen }}
          active={isOpen}
          size="sm"
          surface="overlay"
          iconSize={19}
        />
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
            {journal.canRename ? (
              <>
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
              </>
            ) : null}
          </View>
        ) : null}
      </View>
    );
  };

  return (
    <View style={[styles.root, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.fixedHeader, { paddingTop: insets.top + 16, backgroundColor: theme.colors.background }]}>
        <View style={styles.titleRow}>
          <View style={styles.headerSide}>
            <IconCircleButton
              icon="menu"
              onPress={() => setShowJournalMenu(true)}
              accessibilityLabel={t('homeDrawerOpenA11y')}
            />
          </View>
          <Text preset="label" color="text" numberOfLines={1} style={styles.headerTitle}>
            {t('journalsTitle')}
          </Text>
          <View style={[styles.headerSide, styles.headerSideRight]}>
            <IconCircleButton
              icon="plus"
              onPress={() => setShowCreateModal(true)}
              accessibilityLabel={t('journalCreateA11y')}
              iconSize={24}
            />
          </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 88 }]} showsVerticalScrollIndicator={false}>
        {journalItems.length === 0 ? (
          <View style={[styles.emptyState, { borderColor: theme.colors.border, backgroundColor: theme.colors.surface }]}>
            <Ionicons name="journal-outline" size={34} color={theme.colors.tint} />
            <Text preset="label" color="text" style={styles.emptyTitle}>{t('journalsEmptyTitle')}</Text>
            <Text preset="bodySmall" color="textSecondary" style={styles.emptyBody}>{t('journalsEmptyMessage')}</Text>
            <AccentPillButton label={t('journalCreate')} onPress={() => setShowCreateModal(true)} style={styles.emptyButton} />
          </View>
        ) : filteredJournalItems.length === 0 ? (
          <View style={[styles.emptyState, { borderColor: theme.colors.border, backgroundColor: theme.colors.surface }]}>
            <Ionicons name="search-outline" size={34} color={theme.colors.tint} />
            <Text preset="label" color="text" style={styles.emptyTitle}>{t('journalNoMatchingJournals')}</Text>
          </View>
        ) : (
          <View style={styles.journalCoverGrid}>
            {filteredJournalItems.map((journal) => {
              const journalCoverSource = getJournalCoverImageSource(journal.coverImageUri);
              const coverCountMeta = (
                <View style={[
                  styles.journalCoverCountMeta,
                  compactJournalCover && styles.journalCoverCountMetaCompact,
                  denseJournalCover && styles.journalCoverCountMetaDense,
                ]}>
                  <Text
                    preset="caption"
                    dynamicType={false}
                    adjustsFontSizeToFit
                    minimumFontScale={0.75}
                    numberOfLines={1}
                    style={[
                      styles.journalCoverCountLabel,
                      compactJournalCover && styles.journalCoverCountLabelCompact,
                      denseJournalCover && styles.journalCoverCountLabelDense,
                      { color: theme.colors.stickerControlText },
                    ]}
                  >
                    {denseJournalCover ? journal.count : `${journal.count} ${journalEntryLabelText(journal.count)}`}
                  </Text>
                </View>
              );
              return (
              <TouchableOpacity
                key={journal.id}
                onPress={() => router.push({ pathname: '/journal/[id]', params: { id: journal.id, title: journal.title } })}
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
                  {journalCoverSource ? (
                    <Image source={journalCoverSource} style={styles.journalCoverImage} resizeMode="cover" />
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
      <AppFooterNavigation activeItem="journal" bottom={insets.bottom + 12} />

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

      <SlidingDrawer
        visible={showJournalMenu}
        onClose={closeJournalMenu}
        accessibilityCloseLabel={t('homeDrawerCloseA11y')}
        profile={drawerProfile}
        onProfilePress={() => {
          closeJournalMenu();
          router.push('/profile/edit');
        }}
        profileAccessibilityLabel={t('settingsProfileTitle')}
        drawerStyle={[styles.drawer, { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 16 }]}
        testID="journal-sliding-drawer"
      >
            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              <SectionLabel style={styles.drawerSectionLabel}>{t('homeHeaderSearch')}</SectionLabel>
              <View style={[styles.drawerSearchBar, { borderColor: theme.colors.border, backgroundColor: theme.colors.surface }]}>
                <Ionicons name="search-outline" size={18} color={theme.colors.textSecondary} />
                <TextInput
                  value={journalSearchQuery}
                  onChangeText={setJournalSearchQuery}
                  placeholder={t('journalSearchPlaceholder')}
                  placeholderTextColor={theme.colors.textSecondary}
                  style={[styles.drawerSearchInput, { color: theme.colors.text }]}
                  returnKeyType="search"
                  accessibilityLabel={t('homeHeaderSearch')}
                />
                {journalSearchQuery ? (
                  <IconCircleButton
                    icon="close-circle"
                    size="sm"
                    surface="transparent"
                    onPress={() => setJournalSearchQuery('')}
                    accessibilityLabel={t('homeHeaderCloseSearch')}
                    iconSize={18}
                  />
                ) : null}
              </View>
              <SectionLabel style={styles.drawerSectionLabel}>{t('journalsTitle')}</SectionLabel>
              <TouchableOpacity
                onPress={() => {
                  setOpenJournalOptionsId(null);
                  setJournalColumnCount(getNextJournalColumnCount(journalColumnCount));
                }}
                style={[styles.drawerRow, { borderBottomColor: theme.colors.border }]}
                accessibilityRole="button"
                accessibilityLabel={`${t('journalLayoutA11y')}: ${activeJournalColumnLabel}`}
              >
                <Ionicons name="grid-outline" size={20} color={theme.colors.textSecondary} />
                <View style={styles.drawerRowCopy}>
                  <Text preset="bodySmall" color="text" style={styles.drawerRowTitle}>{t('journalLayoutA11y')}</Text>
                  <Text preset="caption" color="textSecondary">{activeJournalColumnLabel}</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={theme.colors.textSecondary} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setShowPermanentJournals(!showPermanentJournals)}
                style={[styles.drawerRow, { borderBottomColor: theme.colors.border }]}
                accessibilityRole="switch"
                accessibilityState={{ checked: showPermanentJournals }}
                accessibilityLabel={t('journalTogglePermanentGroupsA11y')}
              >
                <Ionicons name="book-outline" size={20} color={showPermanentJournals ? theme.colors.tint : theme.colors.textSecondary} />
                <View style={styles.drawerRowCopy}>
                  <Text preset="bodySmall" color="text" style={styles.drawerRowTitle}>{t('journalTogglePermanentGroupsA11y')}</Text>
                </View>
                <Ionicons name={showPermanentJournals ? 'checkbox' : 'square-outline'} size={20} color={showPermanentJournals ? theme.colors.tint : theme.colors.textSecondary} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  closeJournalMenu();
                  router.push('/(tabs)/settings');
                }}
                style={[styles.drawerRow, { borderBottomColor: theme.colors.border }]}
                accessibilityRole="button"
                accessibilityLabel={t('settingsTitle')}
              >
                <Ionicons name="settings-outline" size={20} color={theme.colors.textSecondary} />
                <View style={styles.drawerRowCopy}>
                  <Text preset="bodySmall" color="text" style={styles.drawerRowTitle}>{t('settingsTitle')}</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={theme.colors.textSecondary} />
              </TouchableOpacity>
            </ScrollView>
      </SlidingDrawer>

      <Modal visible={Boolean(coverPickerJournal)} animationType="fade" transparent onRequestClose={() => setCoverPickerJournal(null)}>
        <View style={[styles.modalOverlay, { backgroundColor: theme.colors.overlay }]}>
          <View style={[styles.modalCard, styles.coverPickerCard, { backgroundColor: theme.colors.background, borderColor: theme.colors.border }]}>
            <View style={styles.coverPickerHeader}>
              <Text preset="h2" color="text" style={styles.modalTitle}>{t('journalSetCover')}</Text>
              <IconCircleButton
                icon="close"
                size="sm"
                onPress={() => setCoverPickerJournal(null)}
                accessibilityLabel={t('modalCloseA11y')}
              />
            </View>
            <ScrollView
              style={styles.coverPickerScroll}
              contentContainerStyle={styles.coverPickerScrollContent}
              showsVerticalScrollIndicator={false}
            >
              <TouchableOpacity
                onPress={handleAssignGalleryCover}
                style={[styles.coverPickerGalleryButton, { borderColor: theme.colors.border, backgroundColor: theme.colors.surface }]}
                accessibilityRole="button"
                accessibilityLabel={t('journalSetCoverFromGalleryA11y')}
                disabled={Boolean(assigningCoverJournalId)}
              >
                <View style={[styles.coverPickerGalleryIcon, { backgroundColor: theme.colors.tint + '18' }]}>
                  <Ionicons name="image-outline" size={20} color={theme.colors.tint} />
                </View>
                <Text preset="label" color="text" style={styles.coverPickerGalleryText}>{t('journalSetCoverFromGallery')}</Text>
                <Ionicons name="chevron-forward" size={17} color={theme.colors.textSecondary} />
              </TouchableOpacity>
              <SectionLabel style={styles.coverPickerSectionLabel}>{t('journalAppBackgrounds')}</SectionLabel>
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
                      <View style={styles.coverPickerTileShade} />
                      <Text preset="caption" numberOfLines={1} style={[styles.coverPickerTileTitle, { color: theme.colors.stickerControlText }]}>
                        {background.title}
                      </Text>
                      {selected ? (
                        <View style={[styles.coverPickerSelectedBadge, { backgroundColor: theme.colors.tint }]}>
                          <Ionicons name="checkmark" size={14} color={theme.colors.background} />
                        </View>
                      ) : null}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>
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
              <AccentPillButton label={t('journalCreate')} onPress={() => { void handleCreateJournal(); }} disabled={isCreating} style={styles.modalActionPrimary} />
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
              <AccentPillButton label={t('journalRenameSave')} onPress={() => { void handleRenameJournal(); }} disabled={isRenaming} style={styles.modalActionPrimary} />
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
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  headerSide: { width: 44, flexDirection: 'row', alignItems: 'center' },
  headerSideRight: { justifyContent: 'flex-end' },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 18, lineHeight: 22, fontWeight: '800' },
  headerSearchBar: {
    flex: 1,
    minHeight: 38,
    borderWidth: 1,
    borderRadius: 8,
    paddingLeft: 10,
    paddingRight: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  headerSearchInput: {
    flex: 1,
    minWidth: 0,
    paddingVertical: 7,
    fontSize: 15,
    lineHeight: 19,
    fontWeight: '600',
  },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  drawer: {
    paddingHorizontal: 20,
  },
  drawerSectionLabel: { marginTop: 18, marginBottom: 8, fontWeight: '800' },
  drawerSearchBar: {
    minHeight: 44,
    borderWidth: 1,
    borderRadius: 8,
    paddingLeft: 10,
    paddingRight: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  drawerSearchInput: {
    flex: 1,
    minWidth: 0,
    paddingVertical: 8,
    fontSize: 15,
    lineHeight: 19,
    fontWeight: '600',
  },
  drawerRow: {
    minHeight: 54,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  drawerRowCopy: { flex: 1, minWidth: 0 },
  drawerRowTitle: { fontWeight: '700' },
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
    left: 10,
    bottom: 10,
    maxWidth: '82%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.34)',
  },
  journalCoverCountMetaCompact: {
    left: 8,
    bottom: 8,
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  journalCoverCountMetaDense: {
    left: 6,
    bottom: 6,
  },
  journalCoverCountLabel: {
    flexShrink: 1,
    fontWeight: '800',
    fontSize: 13,
    lineHeight: 16,
    textShadowColor: 'rgba(0, 0, 0, 0.62)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  journalCoverCountLabelCompact: { fontSize: 11, lineHeight: 13 },
  journalCoverCountLabelDense: { fontSize: 10, lineHeight: 12 },
  journalCoverFooter: { minHeight: 76, flexDirection: 'row', alignItems: 'center', padding: 10, gap: 6 },
  journalCoverFooterWide: { minHeight: 56, paddingHorizontal: 12, paddingVertical: 8 },
  journalCoverFooterCompact: { minHeight: 48, padding: 7 },
  journalCoverCopy: { flex: 1, minWidth: 0 },
  journalCoverTitle: { fontWeight: '800', lineHeight: 22 },
  journalCoverTitleWide: { fontSize: 18, lineHeight: 23 },
  journalCoverTitleCompact: { fontSize: 14, lineHeight: 18 },
  journalCoverTitleDense: { fontSize: 12, lineHeight: 15 },
  journalOptionsWrap: { position: 'absolute', top: 6, right: 6, zIndex: 30, elevation: 30, alignItems: 'flex-end' },
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
  emptyButton: { marginTop: 18 },
  modalOverlay: { flex: 1, justifyContent: 'center', paddingHorizontal: 24 },
  modalCard: { width: '100%', maxWidth: 456, alignSelf: 'center', borderWidth: 1, borderRadius: 12, padding: 18 },
  modalTitle: { marginBottom: 14 },
  coverPickerCard: { maxHeight: '82%' },
  coverPickerHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 },
  coverPickerScroll: { marginTop: 2 },
  coverPickerScrollContent: { paddingBottom: 2 },
  coverPickerGalleryButton: { minHeight: 48, borderWidth: 1, borderRadius: 8, paddingHorizontal: 10, flexDirection: 'row', alignItems: 'center', gap: 10 },
  coverPickerGalleryIcon: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  coverPickerGalleryText: { flex: 1, fontWeight: '700' },
  coverPickerSectionLabel: { marginTop: 16, marginBottom: 8, fontWeight: '800' },
  coverPickerGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 10 },
  coverPickerOption: { width: '48.5%', aspectRatio: 1.24, borderWidth: 1, borderRadius: 8, overflow: 'hidden' },
  coverPickerPreview: { width: '100%', height: '100%' },
  coverPickerTileShade: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 34, backgroundColor: 'rgba(0, 0, 0, 0.38)' },
  coverPickerTileTitle: { position: 'absolute', left: 9, right: 34, bottom: 8, fontWeight: '800' },
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
  modalActionPrimary: {},
});
