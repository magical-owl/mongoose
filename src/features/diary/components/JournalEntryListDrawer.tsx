import { Fragment } from 'react';
import { ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';

import { useTheme } from '@providers/ThemeProvider';
import { IconCircleButton } from '@shared/components/IconCircleButton';
import { SectionLabel } from '@shared/components/SectionLabel';
import { SlidingDrawer } from '@shared/components/SlidingDrawer';
import { Text } from '@shared/components/Text';
import type { EntryHierarchyMode } from '@/stores/useAppStore';
import { homeFilterAllLabel, homeFilterKindLabel, manualMoodLabel, useTranslation } from '@/localization/i18n';
import { getTranslucentSurfaceColor } from '@/theme/surfaces';

const HIERARCHY_MODES: EntryHierarchyMode[] = ['year-month-date', 'month-date', 'date', 'none'];

export type JournalEntryFilterKind = 'date' | 'tag' | 'mood';
export type JournalEntryDrawerPanel = JournalEntryFilterKind | 'hierarchy' | null;
type IoniconName = ComponentProps<typeof Ionicons>['name'];

export interface JournalEntryFilterOptions {
  readonly date: readonly string[];
  readonly tag: readonly string[];
  readonly mood: readonly string[];
}

interface JournalEntryListDrawerProps {
  readonly visible: boolean;
  readonly profile: {
    readonly displayName: string;
    readonly avatarUri?: string;
  };
  readonly topInset: number;
  readonly bottomInset: number;
  readonly entryHierarchyMode: EntryHierarchyMode;
  readonly expandedPanel: JournalEntryDrawerPanel;
  readonly filterOptions: JournalEntryFilterOptions;
  readonly search: string;
  readonly filterDate: string;
  readonly filterTag: string;
  readonly filterMood: string;
  readonly favoritesOnly: boolean;
  readonly moodColor: (mood: string) => string;
  readonly onClose: () => void;
  readonly onProfilePress: () => void;
  readonly onNavigateSettings: () => void;
  readonly onChangeExpandedPanel: (panel: JournalEntryDrawerPanel) => void;
  readonly onChangeSearch: (search: string) => void;
  readonly onChangeEntryHierarchyMode: (mode: EntryHierarchyMode) => void;
  readonly onChangeFilterDate: (date: string) => void;
  readonly onChangeFilterTag: (tag: string) => void;
  readonly onChangeFilterMood: (mood: string) => void;
  readonly onToggleFavoritesOnly: () => void;
  readonly onClearFilters: () => void;
}

function hierarchyModeLabel(mode: EntryHierarchyMode): string {
  if (mode === 'month-date') return 'Month / Date';
  if (mode === 'date') return 'Date';
  if (mode === 'none') return 'Flat list';
  return 'Year / Month / Date';
}

function capitalizeFilterLabel(value: string): string {
  return value
    .split(/(\s+|-)/)
    .map((part) => /^[A-Za-z]/.test(part) ? `${part.charAt(0).toUpperCase()}${part.slice(1)}` : part)
    .join('');
}

function drawerFilterValue(kind: JournalEntryFilterKind, values: { readonly date: string; readonly tag: string; readonly mood: string }): string {
  if (kind === 'date') return values.date;
  if (kind === 'tag') return values.tag;
  return values.mood;
}

function drawerFilterIcon(kind: JournalEntryFilterKind): IoniconName {
  if (kind === 'date') return 'calendar-outline';
  if (kind === 'tag') return 'pricetag-outline';
  return 'heart-outline';
}

export function JournalEntryListDrawer({
  visible,
  profile,
  topInset,
  bottomInset,
  entryHierarchyMode,
  expandedPanel,
  filterOptions,
  search,
  filterDate,
  filterTag,
  filterMood,
  favoritesOnly,
  moodColor,
  onClose,
  onProfilePress,
  onNavigateSettings,
  onChangeExpandedPanel,
  onChangeSearch,
  onChangeEntryHierarchyMode,
  onChangeFilterDate,
  onChangeFilterTag,
  onChangeFilterMood,
  onToggleFavoritesOnly,
  onClearFilters,
}: JournalEntryListDrawerProps): React.JSX.Element {
  const theme = useTheme();
  const t = useTranslation();
  const translucentSurfaceColor = getTranslucentSurfaceColor(theme);

  const renderFilterOptions = (kind: JournalEntryFilterKind, value: string) => (
    <View style={[styles.inlineOptions, { borderBottomColor: theme.colors.border }]}>
      <TouchableOpacity
        onPress={() => {
          if (kind === 'date') onChangeFilterDate('');
          if (kind === 'tag') onChangeFilterTag('');
          if (kind === 'mood') onChangeFilterMood('');
          onChangeExpandedPanel(null);
        }}
        style={styles.inlineOption}
      >
        <Text preset="caption" color={!value ? 'tint' : 'textSecondary'}>{homeFilterAllLabel(kind, t)}</Text>
      </TouchableOpacity>
      {filterOptions[kind].map((option) => {
        const selected = option === value;
        const optionMoodColor = kind === 'mood' ? moodColor(option) : theme.colors.text;
        return (
          <TouchableOpacity
            key={option}
            onPress={() => {
              if (kind === 'date') onChangeFilterDate(option);
              if (kind === 'tag') onChangeFilterTag(option);
              if (kind === 'mood') onChangeFilterMood(option);
              onChangeExpandedPanel(null);
            }}
            style={[styles.inlineOption, selected && { backgroundColor: theme.colors.tint + '18' }]}
          >
            {kind === 'mood' ? (
              <View style={[styles.filterMoodBadge, { backgroundColor: optionMoodColor + '18', borderColor: optionMoodColor }]}>
                <Text preset="caption" style={[styles.filterMoodBadgeText, { color: optionMoodColor }]}>{manualMoodLabel(option, t)}</Text>
              </View>
            ) : (
              <Text preset="caption" color={selected ? 'tint' : 'text'}>{capitalizeFilterLabel(option)}</Text>
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );

  return (
    <SlidingDrawer
      visible={visible}
      onClose={onClose}
      accessibilityCloseLabel={t('homeDrawerCloseA11y')}
      profile={profile}
      onProfilePress={onProfilePress}
      profileAccessibilityLabel={t('settingsProfileTitle')}
      drawerStyle={[styles.drawer, { paddingTop: topInset + 12, paddingBottom: bottomInset + 16 }]}
      testID="journal-entry-list-drawer"
    >
      <ScrollView showsVerticalScrollIndicator={false}>
        <SectionLabel style={styles.drawerSectionLabel}>{t('homeHeaderSearch')}</SectionLabel>
        <View style={[styles.drawerSearchBar, { borderColor: theme.colors.border, backgroundColor: translucentSurfaceColor }]}>
          <Ionicons name="search-outline" size={18} color={theme.colors.textSecondary} />
          <TextInput
            value={search}
            onChangeText={onChangeSearch}
            placeholder={t('homeSearchPlaceholder')}
            placeholderTextColor={theme.colors.textSecondary}
            style={[styles.drawerSearchInput, { color: theme.colors.text }]}
            returnKeyType="search"
            accessibilityLabel={t('homeHeaderSearch')}
          />
          {search ? (
            <IconCircleButton
              icon="close-circle"
              size="sm"
              surface="transparent"
              onPress={() => onChangeSearch('')}
              accessibilityLabel={t('homeHeaderCloseSearch')}
              iconSize={18}
            />
          ) : null}
        </View>

        <TouchableOpacity
          onPress={() => onChangeExpandedPanel(expandedPanel === 'hierarchy' ? null : 'hierarchy')}
          style={[styles.drawerRow, { borderBottomColor: theme.colors.border }]}
          accessibilityRole="button"
          accessibilityLabel={`Entry hierarchy: ${hierarchyModeLabel(entryHierarchyMode)}. Open options.`}
          accessibilityState={{ expanded: expandedPanel === 'hierarchy' }}
        >
          <Ionicons name="calendar-outline" size={20} color={theme.colors.textSecondary} />
          <Text preset="bodySmall" color="text" style={styles.drawerRowText}>{hierarchyModeLabel(entryHierarchyMode)}</Text>
          <Ionicons name={expandedPanel === 'hierarchy' ? 'chevron-down' : 'chevron-forward'} size={16} color={theme.colors.textSecondary} />
        </TouchableOpacity>
        {expandedPanel === 'hierarchy' ? (
          <View style={[styles.inlineOptions, { borderBottomColor: theme.colors.border }]}>
            {HIERARCHY_MODES.map((mode) => (
              <TouchableOpacity
                key={mode}
                onPress={() => {
                  onChangeEntryHierarchyMode(mode);
                  onChangeExpandedPanel(null);
                }}
                style={[styles.inlineOption, mode === entryHierarchyMode && { backgroundColor: theme.colors.tint + '18' }]}
                accessibilityRole="radio"
                accessibilityState={{ selected: mode === entryHierarchyMode }}
              >
                <Text preset="caption" color={mode === entryHierarchyMode ? 'tint' : 'text'}>{hierarchyModeLabel(mode)}</Text>
              </TouchableOpacity>
            ))}
          </View>
        ) : null}

        <SectionLabel style={styles.drawerSectionLabel}>{t('homeDrawerFilterEntries')}</SectionLabel>
        {(['date', 'tag', 'mood'] as const).map((kind) => {
          const value = drawerFilterValue(kind, { date: filterDate, tag: filterTag, mood: filterMood });
          const icon = drawerFilterIcon(kind);
          return (
            <Fragment key={kind}>
              <TouchableOpacity
                onPress={() => onChangeExpandedPanel(expandedPanel === kind ? null : kind)}
                style={[styles.drawerRow, { borderBottomColor: theme.colors.border }]}
                accessibilityRole="button"
                accessibilityLabel={`${t('homeDrawerFilterBy')} ${homeFilterKindLabel(kind, t)}`}
              >
                <Ionicons name={icon} size={20} color={value ? theme.colors.tint : theme.colors.textSecondary} />
                <Text preset="bodySmall" color="text" style={styles.drawerRowText}>
                  {value ? (kind === 'mood' ? manualMoodLabel(value, t) : capitalizeFilterLabel(value)) : homeFilterKindLabel(kind, t)}
                </Text>
                <Ionicons name={expandedPanel === kind ? 'chevron-down' : 'chevron-forward'} size={16} color={theme.colors.textSecondary} />
              </TouchableOpacity>
              {expandedPanel === kind ? renderFilterOptions(kind, value) : null}
            </Fragment>
          );
        })}

        <TouchableOpacity
          onPress={onToggleFavoritesOnly}
          style={[styles.drawerRow, { borderBottomColor: theme.colors.border }]}
          accessibilityRole="switch"
          accessibilityState={{ checked: favoritesOnly }}
        >
          <Ionicons name="star-outline" size={20} color={favoritesOnly ? theme.colors.tint : theme.colors.textSecondary} />
          <Text preset="bodySmall" color="text" style={styles.drawerRowText}>{t('homeFavoritesOnly')}</Text>
          <Ionicons name={favoritesOnly ? 'checkbox' : 'square-outline'} size={20} color={favoritesOnly ? theme.colors.tint : theme.colors.textSecondary} />
        </TouchableOpacity>
        <TouchableOpacity onPress={onClearFilters} style={styles.clearFilters} accessibilityRole="button">
          <Text preset="bodySmall" color="tint">{t('homeClearAllFilters')}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={onNavigateSettings}
          style={[styles.drawerRow, { borderBottomColor: theme.colors.border }]}
          accessibilityRole="button"
          accessibilityLabel={t('settingsTitle')}
        >
          <Ionicons name="settings-outline" size={20} color={theme.colors.textSecondary} />
          <Text preset="bodySmall" color="text" style={styles.drawerRowText}>{t('settingsTitle')}</Text>
          <Ionicons name="chevron-forward" size={16} color={theme.colors.textSecondary} />
        </TouchableOpacity>
      </ScrollView>
    </SlidingDrawer>
  );
}

const styles = StyleSheet.create({
  drawer: {
    paddingHorizontal: 20,
  },
  drawerSearchBar: {
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 7,
    minHeight: 44,
    paddingLeft: 10,
    paddingRight: 4,
  },
  drawerSearchInput: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 19,
    minWidth: 0,
    paddingVertical: 8,
  },
  drawerSectionLabel: {
    fontWeight: '700',
    letterSpacing: 0.6,
    marginBottom: 8,
    marginTop: 18,
  },
  drawerRow: {
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: 12,
    minHeight: 54,
  },
  drawerRowText: {
    flex: 1,
  },
  clearFilters: {
    paddingVertical: 14,
  },
  inlineOptions: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingBottom: 6,
    paddingLeft: 32,
  },
  inlineOption: {
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  filterMoodBadge: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderRadius: 14,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 28,
    paddingHorizontal: 10,
  },
  filterMoodBadgeText: {
    fontWeight: '700',
  },
});
