import { useState, useCallback, useMemo, useRef } from 'react';
import {
  Animated,
  Alert,
  View,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Modal as NativeModal,
  Pressable,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@providers/ThemeProvider';
import { Text } from '@shared/components/Text';
import { AccentPillButton } from '@shared/components/AccentPillButton';
import { IconCircleButton } from '@shared/components/IconCircleButton';
import { APP_FOOTER_BOTTOM_OFFSET, AppFooterNavigation } from '@shared/components/AppFooterNavigation';
import { SlidingDrawer } from '@shared/components/SlidingDrawer';
import { AppPatternBackground } from '@shared/components/AppPatternBackground';
import { useDiary } from '@/features/diary/hooks/useDiary';
import { useProfileForm } from '@/features/profile/hooks/useProfileForm';
import { resolveImportedProfilePhotoUri } from '@/features/profile/services/ProfilePhotoService';
import { useAppStore } from '@/stores/useAppStore';
import { DiaryTimelineList } from '@/features/diary/components/DiaryTimelineList';
import { appLockService } from '@/services/AppLockService';
import { getManualMoodColor } from '@/features/diary/domain/moodColors';
import { getEntryManualMoods, type ManualMood } from '@/features/diary/domain/DiaryEntry';
import type { MemoryReaction } from '@/features/diary/domain/MemoryReaction';
import { useTranslation } from '@/localization/i18n';
import { useScrollCollapse } from '@/shared/hooks/useScrollCollapse';

const CALENDAR_COLLAPSED_HEIGHT = 0;
const CALENDAR_HEADER_TOP_PADDING = 16;
const CALENDAR_NAV_HEIGHT = 38;
const CALENDAR_HEADER_GAP = 10;
const CALENDAR_BOTTOM_GAP = 12;

export default function CalendarScreen() {
  const router = useRouter();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const t = useTranslation();
  const { height: windowHeight } = useWindowDimensions();
  const { entries, refresh, toggleMemoryReaction } = useDiary();
  const { profile } = useProfileForm();
  const setSelectedCalendarDate = useAppStore((state) => state.setSelectedCalendarDate);
  const calendarDateFormat = useAppStore((state) => state.calendarDateFormat);
  const calendarFirstDay = useAppStore((state) => state.calendarFirstDay);

  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [selectedDateStr, setSelectedDateStr] = useState<string>(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  });
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [showCalendarMenu, setShowCalendarMenu] = useState(false);
  const [pickerYear, setPickerYear] = useState(() => new Date().getFullYear());
  const touchStartX = useRef<number | null>(null);
  const {
    scrollRef,
    scrollY,
    handleScroll,
    resetScrollCollapse,
  } = useScrollCollapse();

  useFocusEffect(
    useCallback(() => {
      resetScrollCollapse();
      refresh();
      setSelectedCalendarDate(selectedDateStr);
    }, [refresh, resetScrollCollapse, selectedDateStr, setSelectedCalendarDate])
  );

  const handleSelectDate = (dateStr: string) => {
    setSelectedDateStr(dateStr);
    setSelectedCalendarDate(dateStr);
  };

  const handlePrevMonth = () => {
    setCurrentDate((prev) => {
      const next = new Date(prev.getFullYear(), prev.getMonth() - 1, 1);
      const key = `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, '0')}-01`;
      setSelectedDateStr(key);
      setSelectedCalendarDate(key);
      return next;
    });
  };

  const handleNextMonth = () => {
    setCurrentDate((prev) => {
      const next = new Date(prev.getFullYear(), prev.getMonth() + 1, 1);
      const key = `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, '0')}-01`;
      setSelectedDateStr(key);
      setSelectedCalendarDate(key);
      return next;
    });
  };

  const handleSwipe = (endX: number) => {
    if (touchStartX.current === null) return;
    const distance = endX - touchStartX.current;
    if (Math.abs(distance) > 60) {
      if (distance > 0) handlePrevMonth();
      else handleNextMonth();
    }
    touchStartX.current = null;
  };

  const handleJumpToToday = () => {
    const today = new Date();
    const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    setCurrentDate(new Date(today.getFullYear(), today.getMonth(), 1));
    handleSelectDate(todayKey);
  };
  const closeCalendarMenu = useCallback(() => {
    setShowCalendarMenu(false);
  }, []);
  const handleToggleMemoryReaction = useCallback(
    async (entryId: string, reaction: MemoryReaction) => {
      const result = await toggleMemoryReaction(entryId, reaction);
      if (!result.success) {
        Alert.alert(t('memoryReactionNotSavedTitle'), result.error.message);
        return false;
      }
      return true;
    },
    [toggleMemoryReaction, t],
  );

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = (new Date(year, month, 1).getDay() - calendarFirstDay + 7) % 7;
  const calendarWeekRows = Math.ceil((firstDayOfWeek + daysInMonth) / 7);
  const calendarExpandedHeight = 104 + calendarWeekRows * 46;
  const expandedHeaderHeight = insets.top + CALENDAR_HEADER_TOP_PADDING + CALENDAR_NAV_HEIGHT + CALENDAR_HEADER_GAP + calendarExpandedHeight + CALENDAR_BOTTOM_GAP;
  const collapsedHeaderHeight = insets.top + CALENDAR_HEADER_TOP_PADDING + CALENDAR_NAV_HEIGHT + CALENDAR_BOTTOM_GAP;

  const monthName = currentDate.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });
  const monthLabel = currentDate.toLocaleDateString('en-US', {
    month: 'long',
  });

  const entryDateMap = useMemo(() => {
    const map = new Map<string, typeof entries>();
    for (const e of entries) {
      const list = map.get(e.date) || [];
      list.push(e);
      map.set(e.date, list);
    }
    return map;
  }, [entries]);

  const selectedDayEntries = useMemo(
    () => entryDateMap.get(selectedDateStr) || [],
    [entryDateMap, selectedDateStr],
  );
  const selectedDayGroupedEntries = useMemo(
    () => [[selectedDateStr, selectedDayEntries] as const],
    [selectedDateStr, selectedDayEntries],
  );
  const drawerProfile = useMemo(
    () => ({
      displayName: profile?.displayName.trim() || t('profileFallbackName'),
      avatarUri: profile?.avatarUri ? resolveImportedProfilePhotoUri(profile.avatarUri) : undefined,
    }),
    [profile, t],
  );

  const moodColor = (mood: string) => {
    return getManualMoodColor(mood as ManualMood, theme.colors);
  };
  const calendarHeight = scrollY.interpolate({
    inputRange: [0, calendarExpandedHeight],
    outputRange: [calendarExpandedHeight, CALENDAR_COLLAPSED_HEIGHT],
    extrapolate: 'clamp',
  });
  const calendarOpacity = scrollY.interpolate({
    inputRange: [0, calendarExpandedHeight * 0.65],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  const calendarCard = (
    <View
      style={[
        styles.calendarCard,
        { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
      ]}
      onTouchStart={(event) => { touchStartX.current = event.nativeEvent.pageX; }}
      onTouchEnd={(event) => handleSwipe(event.nativeEvent.pageX)}
    >
      <View style={styles.calendarControlsRow}>
        <View style={styles.calendarPeriodRow}>
          <IconCircleButton
            icon="chevron-left"
            onPress={handlePrevMonth}
            accessibilityLabel={t('calendarPreviousMonthA11y')}
            size="sm"
            surface="transparent"
            iconSize={20}
          />
          <TouchableOpacity
            onPress={() => { setPickerYear(year); setShowMonthPicker(true); }}
            style={styles.calendarPeriodValueButton}
            accessibilityRole="button"
            accessibilityLabel={t('calendarChooseMonthYearA11y')}
          >
            <Text preset="label" color="text" style={styles.calendarPeriodValue} numberOfLines={1}>
              {monthLabel} {year}
            </Text>
          </TouchableOpacity>
          <IconCircleButton
            icon="chevron-right"
            onPress={handleNextMonth}
            accessibilityLabel={t('calendarNextMonthA11y')}
            size="sm"
            surface="transparent"
            iconSize={20}
          />
        </View>
      </View>
      <View style={styles.gridRow}>
        {(['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].slice(calendarFirstDay).concat(['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].slice(0, calendarFirstDay))).map((d) => (
          <Text key={d} style={[styles.gridCellHeader, { color: theme.colors.textSecondary }]}>
            {d}
          </Text>
        ))}
      </View>

      <View style={styles.gridRow}>
        {Array.from({ length: firstDayOfWeek }).map((_, i) => (
          <View key={`empty-${i}`} style={styles.gridCell} />
        ))}

        {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
          const dayNumStr = day < 10 ? `0${day}` : `${day}`;
          const monthNumStr = month + 1 < 10 ? `0${month + 1}` : `${month + 1}`;
          const dateStr = `${year}-${monthNumStr}-${dayNumStr}`;

          const isSelected = dateStr === selectedDateStr;
          const dayEntries = entryDateMap.get(dateStr) || [];
          const hasEntries = dayEntries.length > 0;
          const moodKeys = Array.from(new Set(dayEntries.flatMap((entry) => getEntryManualMoods(entry)))).slice(0, 3);
          const hasFavorite = dayEntries.some((entry) => entry.isFavorite);

          return (
            <TouchableOpacity
              key={day}
              style={[
                styles.gridCell,
                {
                  backgroundColor: isSelected
                    ? theme.colors.tint
                    : hasEntries
                      ? `${theme.colors.tint}22`
                      : 'transparent',
                  borderColor: isSelected
                    ? theme.colors.tint
                    : hasEntries
                      ? theme.colors.tint
                      : 'transparent',
                  borderWidth: hasEntries || isSelected ? 1 : 0,
                },
              ]}
              onPress={() => handleSelectDate(dateStr)}
              accessibilityRole="button"
              accessibilityState={{ selected: isSelected }}
              accessibilityLabel={`${day} ${monthName}${hasEntries ? `, ${t('calendarHasEntriesA11y')}` : ''}`}
            >
              <Text
                style={[
                  styles.dayText,
                  {
                    fontWeight: isSelected || hasEntries ? '700' : '400',
                    color: isSelected
                      ? theme.colors.background
                      : hasEntries
                        ? theme.colors.tint
                        : theme.colors.text,
                  },
                ]}
              >
                {day}
              </Text>
              {hasEntries && (
                <View style={styles.markerRow}>
                  {moodKeys.length > 0 ? moodKeys.map((mood) => <View key={mood} style={[styles.dot, { backgroundColor: isSelected ? theme.colors.background : moodColor(mood) }]} />) : <View style={[styles.dot, { backgroundColor: isSelected ? theme.colors.background : theme.colors.tint }]} />}
                  {dayEntries.length > 1 && <Text style={[styles.entryCount, { color: isSelected ? theme.colors.background : theme.colors.textSecondary }]}>{dayEntries.length}</Text>}
                  {hasFavorite && <Ionicons name="star" size={8} color={isSelected ? theme.colors.background : theme.colors.warning} />}
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );

  return (
    <AppPatternBackground style={styles.outerContainer} testID="calendar-pattern-background">
      <View style={[styles.fixedHeader, { paddingTop: insets.top + CALENDAR_HEADER_TOP_PADDING }]}>
        <View style={styles.headerNavRow}>
          <View style={styles.headerSide}>
            <IconCircleButton
              icon="menu"
              onPress={() => setShowCalendarMenu(true)}
              accessibilityLabel={t('homeDrawerOpenA11y')}
            />
          </View>
          <Text preset="label" color="text" numberOfLines={1} style={styles.headerTitle}>{t('calendarTitle')}</Text>
          <View style={[styles.headerSide, styles.headerSideRight]}>
            <AccentPillButton
              label={t('calendarToday')}
              onPress={handleJumpToToday}
              accessibilityLabel={t('calendarJumpTodayA11y')}
              style={styles.todayButton}
              labelStyle={styles.todayButtonText}
            />
          </View>
        </View>
        <Animated.View style={[styles.calendarCollapseWrap, { height: calendarHeight, opacity: calendarOpacity }]}>
          {calendarCard}
        </Animated.View>
      </View>
      <ScrollView
        ref={scrollRef}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        contentContainerStyle={[
          styles.container,
          {
            minHeight: windowHeight + calendarExpandedHeight,
            paddingTop: expandedHeaderHeight,
            paddingBottom: insets.bottom + 80 + collapsedHeaderHeight,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {selectedDayEntries.length === 0 ? (
          <View style={[styles.emptyState, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
            <Ionicons name="book-outline" size={28} color={theme.colors.textSecondary} />
            <Text preset="bodySmall" color="textSecondary" style={styles.emptyStateText}>{t('calendarNoEntriesOnDate')}</Text>
          </View>
        ) : (
          <DiaryTimelineList
            groupedEntries={selectedDayGroupedEntries}
            mode="timeline"
            profile={profile}
            calendarDateFormat={calendarDateFormat}
            entryHierarchyMode="date"
            collapsible={false}
            onEntryPress={async (entry) => {
              if (entry.isLockbox && !(await appLockService.authenticate())) return;
              router.push(`/entry/${entry.id}`);
            }}
            onToggleMemoryReaction={handleToggleMemoryReaction}
          />
        )}
      </ScrollView>
      <SlidingDrawer
        visible={showCalendarMenu}
        onClose={closeCalendarMenu}
        accessibilityCloseLabel={t('homeDrawerCloseA11y')}
        profile={drawerProfile}
        onProfilePress={() => {
          closeCalendarMenu();
          router.push('/profile/edit');
        }}
        profileAccessibilityLabel={t('settingsProfileTitle')}
        drawerStyle={[styles.drawer, { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 16 }]}
        testID="calendar-sliding-drawer"
      >
        <TouchableOpacity
          onPress={() => {
            closeCalendarMenu();
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
      <AppFooterNavigation activeItem="calendar" bottom={insets.bottom + APP_FOOTER_BOTTOM_OFFSET} />
      <NativeModal visible={showMonthPicker} transparent animationType="fade" onRequestClose={() => setShowMonthPicker(false)}>
        <Pressable style={styles.pickerBackdrop} onPress={() => setShowMonthPicker(false)}>
          <Pressable style={[styles.monthPicker, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]} onPress={(event) => event.stopPropagation()}>
            <View style={styles.pickerHeader}>
              <Text preset="h2" color="text">{t('calendarChooseMonth')}</Text>
              <IconCircleButton icon="close" onPress={() => setShowMonthPicker(false)} accessibilityLabel={t('calendarCloseMonthPickerA11y')} size="sm" />
            </View>
            <View style={styles.yearRow}>
              <IconCircleButton icon="chevron-left" onPress={() => setPickerYear((value) => value - 1)} accessibilityLabel={t('insightsPreviousYearA11y')} size="sm" />
              <Text preset="label" color="text">{pickerYear}</Text>
              <IconCircleButton icon="chevron-right" onPress={() => setPickerYear((value) => value + 1)} accessibilityLabel={t('insightsNextYearA11y')} size="sm" />
            </View>
            <View style={styles.monthGrid}>
              {Array.from({ length: 12 }, (_, index) => index).map((monthIndex) => {
                const selected = pickerYear === year && monthIndex === month;
                const label = new Date(2000, monthIndex, 1).toLocaleDateString('en-US', { month: 'long' });
                return (
                  <TouchableOpacity
                    key={monthIndex}
                    onPress={() => { const key = `${pickerYear}-${String(monthIndex + 1).padStart(2, '0')}-01`; setCurrentDate(new Date(pickerYear, monthIndex, 1)); setSelectedDateStr(key); setSelectedCalendarDate(key); setShowMonthPicker(false); }}
                    style={[styles.monthChoice, { borderColor: selected ? theme.colors.tint : theme.colors.border, backgroundColor: selected ? theme.colors.tint : 'transparent' }]}
                    accessibilityRole="radio"
                    accessibilityState={{ selected }}
                    accessibilityLabel={label}
                  >
                    <Text preset="caption" style={{ color: selected ? theme.colors.background : theme.colors.text }}>
                      {new Date(2000, monthIndex, 1).toLocaleDateString('en-US', { month: 'short' })}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </Pressable>
        </Pressable>
      </NativeModal>
    </AppPatternBackground>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    flex: 1,
  },
  fixedHeader: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 30, elevation: 30, paddingHorizontal: 20 },
  container: {
    paddingHorizontal: 20,
  },
  headerNavRow: { minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerSide: { width: 44, flexDirection: 'row', alignItems: 'center' },
  headerSideRight: { width: 96, justifyContent: 'flex-end' },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 18, lineHeight: 22, fontWeight: '800' },
  calendarCollapseWrap: { overflow: 'hidden', marginTop: 10 },
  todayButton: {
    minWidth: 92,
    height: 44,
    borderRadius: 22,
    paddingHorizontal: 18,
    paddingVertical: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  todayButtonText: {
    fontSize: 16,
    lineHeight: 19,
    fontWeight: '800',
    textAlign: 'center',
    includeFontPadding: false,
  },
  calendarCard: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 10,
    marginBottom: 15,
  },
  calendarControlsRow: {
    minHeight: 38,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  calendarPeriodRow: {
    flex: 1,
    minHeight: 38,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  calendarPeriodValueButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 0,
  },
  calendarPeriodValue: {
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '700',
  },
  drawer: {
    paddingHorizontal: 20,
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
  gridRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  gridCellHeader: {
    width: '14.28%',
    textAlign: 'center',
    marginBottom: 6,
    fontWeight: '600',
    fontSize: 13,
  },
  gridCell: {
    width: '14.28%',
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
    borderRadius: 8,
  },
  dayText: {
    fontSize: 14,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  markerRow: { height: 10, flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 2 },
  entryCount: { fontSize: 8, fontWeight: '700' },
  card: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 14,
    marginBottom: 12,
  },
  feedEntry: {
    borderWidth: 0,
    padding: 14,
    marginBottom: 12,
  },
  timelineEntry: {
    borderWidth: 0,
    borderLeftWidth: 2,
    borderRadius: 0,
    paddingLeft: 12,
    paddingVertical: 8,
    marginBottom: 12,
  },
  timelineContent: {
    flex: 1,
  },
  dateGroup: { marginBottom: 6 },
  dateHeading: { fontSize: 15, fontWeight: '700', marginTop: 4, marginBottom: 10 },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  emptyState: { alignItems: 'center', borderWidth: 1, borderRadius: 10, padding: 22, marginBottom: 12 },
  emptyStateText: { marginTop: 8 },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  date: {
    fontSize: 12,
  },
  content: {
    fontSize: 14,
    lineHeight: 20,
  },
  moodIndicator: {
    marginLeft: 8,
  },
  emptyText: {
    fontSize: 14,
  },
  pickerBackdrop: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.45)', justifyContent: 'center', padding: 20 },
  monthPicker: { borderWidth: 1, borderRadius: 14, padding: 18 },
  pickerHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 },
  yearRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, paddingHorizontal: 8 },
  monthGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  monthChoice: { width: '30%', alignItems: 'center', borderWidth: 1, borderRadius: 8, paddingVertical: 11 },
});
