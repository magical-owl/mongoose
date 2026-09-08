import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@providers/ThemeProvider';
import { Text } from '@shared/components/Text';
import { APP_FOOTER_BOTTOM_OFFSET, AppFooterNavigation } from '@shared/components/AppFooterNavigation';
import { IconCircleButton } from '@shared/components/IconCircleButton';
import { AppPatternBackground } from '@shared/components/AppPatternBackground';
import { EntryCoverSummary } from '@/features/diary/components/EntryCoverSummary';
import { EntryViewHistoryModal } from '@/features/diary/components/EntryViewHistoryModal';
import type { DiaryEntry, DiaryPhoto } from '@/features/diary/domain/DiaryEntry';
import { getEntryManualMoods } from '@/features/diary/domain/DiaryEntry';
import { getDiaryEntryViewCount } from '@/features/diary/domain/DiaryEntryViewHistory';
import { useDiary } from '@/features/diary/hooks/useDiary';
import { getDiaryPhotoImageSource } from '@/features/diary/services/DiaryPhotoService';
import { buildRediscoverMemorySet } from '@/features/diary/services/RediscoverMemoryService';
import { useProfileForm } from '@/features/profile/hooks/useProfileForm';
import { resolveImportedProfilePhotoUri } from '@/features/profile/services/ProfilePhotoService';
import { SlidingDrawer } from '@/shared/components/SlidingDrawer';
import { appLockService } from '@/services/AppLockService';
import { useAppStore } from '@/stores/useAppStore';
import { useTranslation } from '@/localization/i18n';
import { formatDisplayDate } from '@/shared/utils/dateFormat';
import { stripHtml } from '@/shared/utils/html';
import { getTranslucentSurfaceColor } from '@/theme/surfaces';

function getEntryDisplayPhoto(entry: DiaryEntry): DiaryPhoto | undefined {
  return entry.coverPhoto ?? entry.photos[0];
}

interface MemoryCardProps {
  readonly entry: DiaryEntry;
  readonly variant?: 'featured' | 'compact';
  readonly onPress: (entry: DiaryEntry) => void | Promise<void>;
  readonly onShuffle?: () => void;
}

function MemoryCard({ entry, variant = 'compact', onPress, onShuffle }: MemoryCardProps): React.JSX.Element {
  const theme = useTheme();
  const t = useTranslation();
  const calendarDateFormat = useAppStore((state) => state.calendarDateFormat);
  const displayPhoto = getEntryDisplayPhoto(entry);
  const imageSource = displayPhoto ? getDiaryPhotoImageSource(displayPhoto.uri) : undefined;
  const isFeatured = variant === 'featured';
  const translucentSurfaceColor = getTranslucentSurfaceColor(theme);
  const viewCount = getDiaryEntryViewCount(entry);
  const viewCountA11y = t('entryViewCountA11y').replace('{count}', String(viewCount));
  const [isViewHistoryVisible, setIsViewHistoryVisible] = useState(false);

  return (
    <>
      <TouchableOpacity
        onPress={() => onPress(entry)}
        style={[
          styles.memoryCard,
          isFeatured && styles.featuredMemoryCard,
          { backgroundColor: translucentSurfaceColor, borderColor: theme.colors.border },
        ]}
        accessibilityRole="button"
        accessibilityLabel={`${t('rediscoverOpenEntryA11y')}: ${entry.title}`}
      >
        <EntryCoverSummary
          variant={isFeatured ? 'memoryFeatured' : 'memory'}
          title={entry.title}
          timestamp={formatDisplayDate(entry.date, calendarDateFormat)}
          imageSource={imageSource}
          isFavorite={entry.isFavorite}
          viewCount={viewCount}
          viewCountAccessibilityLabel={viewCountA11y}
          onViewCountPress={() => setIsViewHistoryVisible(true)}
          moods={getEntryManualMoods(entry)}
          tags={entry.tags}
          onShuffle={isFeatured ? onShuffle : undefined}
          shuffleAccessibilityLabel={t('rediscoverShuffle')}
          viewCountTestID="rediscover-entry-view-count"
        />
        <View style={styles.memoryCopy}>
          <Text preset="bodySmall" color="textSecondary" numberOfLines={isFeatured ? 3 : 2}>
            {stripHtml(entry.content)}
          </Text>
        </View>
      </TouchableOpacity>
      {isViewHistoryVisible ? (
        <EntryViewHistoryModal
          visible
          entry={entry}
          onDismiss={() => setIsViewHistoryVisible(false)}
        />
      ) : null}
    </>
  );
}

interface MemorySectionProps {
  readonly title: string;
  readonly icon: React.ComponentProps<typeof Ionicons>['name'];
  readonly entries: readonly DiaryEntry[];
  readonly emptyText?: string;
  readonly horizontal?: boolean;
  readonly onEntryPress: (entry: DiaryEntry) => void | Promise<void>;
}

function MemorySection({
  title,
  icon,
  entries,
  emptyText,
  horizontal = false,
  onEntryPress,
}: MemorySectionProps): React.JSX.Element {
  const theme = useTheme();
  const translucentSurfaceColor = getTranslucentSurfaceColor(theme);

  if (entries.length === 0 && !emptyText) {
    return <></>;
  }

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Ionicons name={icon} size={17} color={theme.colors.textSecondary} />
        <Text preset="caption" color="textSecondary" style={styles.sectionTitle}>
          {title}
        </Text>
      </View>
      {entries.length > 0 ? (
        horizontal ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalSection}>
            {entries.map((entry) => (
              <View key={entry.id} style={styles.horizontalCardWrap}>
                <MemoryCard entry={entry} onPress={onEntryPress} />
              </View>
            ))}
          </ScrollView>
        ) : (
          <View style={styles.verticalSection}>
            {entries.map((entry) => (
              <MemoryCard key={entry.id} entry={entry} onPress={onEntryPress} />
            ))}
          </View>
        )
      ) : emptyText ? (
        <View style={[styles.emptyInline, { backgroundColor: translucentSurfaceColor, borderColor: theme.colors.border }]}>
          <Text preset="bodySmall" color="textSecondary">{emptyText}</Text>
        </View>
      ) : null}
    </View>
  );
}

export default function RediscoverScreen(): React.JSX.Element {
  const router = useRouter();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const t = useTranslation();
  const { entries, isLoading, refresh } = useDiary();
  const { profile } = useProfileForm();
  const translucentSurfaceColor = getTranslucentSurfaceColor(theme);
  const [shuffleSeed, setShuffleSeed] = useState(0);
  const [now, setNow] = useState(() => new Date());
  const [showRediscoverMenu, setShowRediscoverMenu] = useState(false);

  useFocusEffect(
    useCallback(() => {
      setNow(new Date());
      void refresh();
    }, [refresh]),
  );

  const memories = useMemo(
    () => buildRediscoverMemorySet(entries, now, shuffleSeed),
    [entries, now, shuffleSeed],
  );
  const hasMemories = Boolean(memories.surpriseEntry)
    || memories.onThisDayEntries.length > 0
    || memories.oneYearAgoEntries.length > 0
    || memories.oldPhotoEntries.length > 0
    || memories.lookingBackEntries.length > 0
    || memories.favoriteEntries.length > 0
    || memories.reflectionEntries.length > 0
    || memories.sameMonthEntries.length > 0
    || memories.moodRewindEntries.length > 0
    || memories.mostViewedEntries.length > 0;
  const drawerProfile = useMemo(
    () => ({
      displayName: profile?.displayName.trim() || t('profileFallbackName'),
      avatarUri: profile?.avatarUri ? resolveImportedProfilePhotoUri(profile.avatarUri) : undefined,
    }),
    [profile, t],
  );

  const closeRediscoverMenu = useCallback(() => {
    setShowRediscoverMenu(false);
  }, []);

  const handleEntryPress = useCallback(async (entry: DiaryEntry) => {
    if (entry.isLockbox && !(await appLockService.authenticate())) return;
    router.push(`/entry/${entry.id}`);
  }, [router]);

  return (
    <AppPatternBackground style={styles.container} testID="rediscover-pattern-background">
      <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
        <IconCircleButton
          icon="menu"
          onPress={() => setShowRediscoverMenu(true)}
          accessibilityLabel={t('homeDrawerOpenA11y')}
        />
        <Text preset="label" color="text" numberOfLines={1} style={styles.headerTitle}>
          {t('rediscoverTitle')}
        </Text>
        <View style={styles.headerSpacer} />
      </View>
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 88 }]}
        showsVerticalScrollIndicator={false}
      >
        {isLoading ? (
          <View style={styles.loadingPanel} accessibilityRole="progressbar">
            <ActivityIndicator color={theme.colors.tint} />
          </View>
        ) : hasMemories ? (
          <>
            {memories.surpriseEntry ? (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Ionicons name="sparkles-outline" size={17} color={theme.colors.textSecondary} />
                  <Text preset="caption" color="textSecondary" style={styles.sectionTitle}>
                    {t('rediscoverSurpriseTitle').toUpperCase()}
                  </Text>
                </View>
                <MemoryCard
                  entry={memories.surpriseEntry}
                  variant="featured"
                  onPress={handleEntryPress}
                  onShuffle={() => setShuffleSeed((value) => value + 1)}
                />
              </View>
            ) : null}
            <MemorySection
              title={t('rediscoverOnThisDayTitle')}
              icon="today-outline"
              entries={memories.onThisDayEntries}
              horizontal
              onEntryPress={handleEntryPress}
            />
            <MemorySection
              title={t('rediscoverMostViewedTitle')}
              icon="eye-outline"
              entries={memories.mostViewedEntries}
              horizontal
              onEntryPress={handleEntryPress}
            />
            <MemorySection
              title={t('rediscoverOneYearAgoTitle')}
              icon="return-up-back-outline"
              entries={memories.oneYearAgoEntries}
              horizontal
              onEntryPress={handleEntryPress}
            />
            <MemorySection
              title={t('rediscoverOldPhotosTitle')}
              icon="images-outline"
              entries={memories.oldPhotoEntries}
              horizontal
              onEntryPress={handleEntryPress}
            />
            <MemorySection
              title={t('rediscoverFavoriteMemoriesTitle')}
              icon="star-outline"
              entries={memories.favoriteEntries}
              horizontal
              onEntryPress={handleEntryPress}
            />
            <MemorySection
              title={t('rediscoverReflectionsTitle')}
              icon="chatbubble-ellipses-outline"
              entries={memories.reflectionEntries}
              horizontal
              onEntryPress={handleEntryPress}
            />
            <MemorySection
              title={t('rediscoverThisMonthBeforeTitle')}
              icon="calendar-clear-outline"
              entries={memories.sameMonthEntries}
              horizontal
              onEntryPress={handleEntryPress}
            />
            <MemorySection
              title={t('rediscoverMoodRewindTitle')}
              icon="color-palette-outline"
              entries={memories.moodRewindEntries}
              horizontal
              onEntryPress={handleEntryPress}
            />
            <MemorySection
              title={t('rediscoverLookingBackTitle')}
              icon="time-outline"
              entries={memories.lookingBackEntries}
              horizontal
              onEntryPress={handleEntryPress}
            />
          </>
        ) : (
          <View style={[styles.emptyPanel, { backgroundColor: translucentSurfaceColor, borderColor: theme.colors.border }]}>
            <View style={[styles.emptyIconHalo, { backgroundColor: theme.colors.tint + '16' }]}>
              <Ionicons name="sparkles-outline" size={28} color={theme.colors.tint} />
            </View>
            <Text preset="label" color="text" style={styles.emptyTitle}>
              {t('rediscoverEmptyTitle')}
            </Text>
            <Text preset="bodySmall" color="textSecondary" style={styles.emptyMessage}>
              {t('rediscoverEmptyMessage')}
            </Text>
          </View>
        )}
      </ScrollView>
      <SlidingDrawer
        visible={showRediscoverMenu}
        onClose={closeRediscoverMenu}
        accessibilityCloseLabel={t('homeDrawerCloseA11y')}
        profile={drawerProfile}
        onProfilePress={() => {
          closeRediscoverMenu();
          router.push('/profile/edit');
        }}
        profileAccessibilityLabel={t('settingsProfileTitle')}
        drawerStyle={[styles.drawer, { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 16 }]}
        testID="rediscover-sliding-drawer"
      >
        <TouchableOpacity
          onPress={() => {
            closeRediscoverMenu();
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
      </SlidingDrawer>
      <AppFooterNavigation activeItem="rediscover" bottom={insets.bottom + APP_FOOTER_BOTTOM_OFFSET} />
    </AppPatternBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    minHeight: 82,
    paddingHorizontal: 20,
    paddingBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 18,
    lineHeight: 22,
    fontWeight: '800',
  },
  headerSpacer: {
    width: 44,
    height: 44,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  section: {
    marginBottom: 18,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginBottom: 8,
  },
  sectionTitle: {
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  verticalSection: {
    gap: 10,
  },
  horizontalSection: {
    gap: 10,
    paddingRight: 20,
  },
  horizontalCardWrap: {
    width: 248,
  },
  memoryCard: {
    borderWidth: 1,
    borderRadius: 8,
    overflow: 'hidden',
  },
  featuredMemoryCard: {
    borderRadius: 8,
  },
  memoryCopy: {
    padding: 12,
  },
  emptyInline: {
    minHeight: 54,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 14,
    justifyContent: 'center',
  },
  emptyPanel: {
    minHeight: 260,
    borderWidth: 1,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    marginTop: 24,
  },
  emptyIconHalo: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptyMessage: {
    textAlign: 'center',
  },
  loadingPanel: {
    minHeight: 260,
    alignItems: 'center',
    justifyContent: 'center',
  },
  drawer: {
    paddingHorizontal: 20,
  },
  drawerRow: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  drawerRowCopy: {
    flex: 1,
    marginLeft: 12,
  },
  drawerRowTitle: {
    fontWeight: '700',
  },
});
