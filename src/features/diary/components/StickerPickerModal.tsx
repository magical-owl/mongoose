/**
 * StickerPickerModal
 *
 * Redesigned sticker picker with:
 *   • BlurView glassmorphism background
 *   • Search bar (filters across all packs by name or category)
 *   • Horizontal category tabs
 *   • 4-column grid — renders Image for PNG stickers, Text for emoji
 *
 * No native dependencies — works in Expo Go.
 */

import { useState, useMemo } from 'react';
import {
  View,
  TouchableOpacity,
  ScrollView,
  FlatList,
  TextInput,
  Image,
  StyleSheet,
  Dimensions,
  Text as RNText,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { Modal } from '@shared/components/Modal';
import { Text } from '@shared/components/Text';
import { SegmentedControl } from '@shared/components/SegmentedControl';
import { useTheme } from '@providers/ThemeProvider';
import {
  getStickerPacksByAccessTier,
  STICKER_PACKS,
  type StickerAccessTier,
  type StickerItem,
} from '../domain/Sticker';
import { useTranslation } from '@/localization/i18n';
import { useSubscription } from '@/features/subscription/hooks/useSubscription';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
// 4 columns with 8px gap each side + outer padding
const CELL = (SCREEN_WIDTH * 0.9 - 48) / 4;

interface StickerPickerModalProps {
  readonly visible: boolean;
  readonly onClose: () => void;
  readonly onSelectSticker: (stickerId: string, category: string) => void;
  readonly onRequestPremium?: () => void;
}

type SearchResult = { item: StickerItem; packId: string; accessTier: StickerAccessTier };

export function StickerPickerModal({ visible, onClose, onSelectSticker, onRequestPremium }: StickerPickerModalProps) {
  const theme = useTheme();
  const t = useTranslation();
  const { isPro } = useSubscription();
  const [activeAccessTier, setActiveAccessTier] = useState<StickerAccessTier>('free');
  const [activePackId, setActivePackId] = useState(STICKER_PACKS[0]?.id ?? '');
  const [search, setSearch] = useState('');
  const accessTiers: StickerAccessTier[] = ['free', 'premium'];

  const activeStickerPacks = useMemo(() => getStickerPacksByAccessTier(activeAccessTier), [activeAccessTier]);
  const activePack = activeStickerPacks.find((p) => p.id === activePackId) ?? activeStickerPacks[0] ?? STICKER_PACKS[0]!;

  // Search across all packs
  const searchResults: SearchResult[] = useMemo(() => {
    if (!search.trim()) return [];
    const q = search.toLowerCase();
    const results: SearchResult[] = [];
    for (const pack of STICKER_PACKS) {
      for (const item of pack.stickers) {
        if (
          item.name.toLowerCase().includes(q) ||
          pack.name.toLowerCase().includes(q)
        ) {
          results.push({ item, packId: pack.id, accessTier: pack.accessTier });
        }
      }
    }
    return results;
  }, [search]);

  const isSearching = search.trim().length > 0;

  const handleAccessTierChange = (accessTier: StickerAccessTier) => {
    setActiveAccessTier(accessTier);
    setActivePackId(getStickerPacksByAccessTier(accessTier)[0]?.id ?? '');
  };

  const renderSticker = ({ item, packId, accessTier }: SearchResult) => {
    const isLocked = accessTier === 'premium' && !isPro;

    return (
      <TouchableOpacity
        style={[styles.cell, isLocked && styles.lockedCell]}
        onPress={() => {
          if (isLocked) {
            onClose();
            setTimeout(() => onRequestPremium?.(), 250);
            return;
          }
          onSelectSticker(item.id, packId);
          onClose();
        }}
        activeOpacity={0.65}
        accessibilityLabel={`${isLocked ? t('stickerPremiumLockedA11y') : t('stickerAddA11y')}: ${item.name}`}
        accessibilityRole="button"
      >
        {item.source != null ? (
          <Image source={item.source} style={styles.cellImage} resizeMode="contain" />
        ) : (
          <RNText style={styles.cellEmoji}>{item.icon}</RNText>
        )}
        {isLocked ? (
          <View style={[styles.lockBadge, { backgroundColor: theme.colors.background }]}>
            <MaterialCommunityIcons name="lock" size={13} color={theme.colors.tint} />
          </View>
        ) : null}
      </TouchableOpacity>
    );
  };

  const flatData: SearchResult[] = isSearching
    ? searchResults
    : activePack.stickers.map((item) => ({ item, packId: activePack.id, accessTier: activePack.accessTier }));

  return (
    <Modal visible={visible} onDismiss={onClose} title={t('stickerChooseTitle')} accessibilityLabel={t('stickerPickerA11y')} scrollable={false}>
      {/* Search bar */}
      <View style={styles.searchRow}>
        <View style={[styles.searchBox, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
          <MaterialCommunityIcons name="magnify" size={19} color={theme.colors.textSecondary} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder={t('stickerSearchPlaceholder')}
            placeholderTextColor={theme.colors.textSecondary}
            style={[styles.searchInput, { color: theme.colors.text }]}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')} style={styles.clearSearch} accessibilityLabel={t('stickerClearSearchA11y')}>
              <MaterialCommunityIcons name="close" size={17} color={theme.colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {!isSearching && (
        <View style={styles.accessTabs}>
          <SegmentedControl
            segments={[t('stickerFreeGroup'), t('stickerPremiumGroup')]}
            selectedIndex={accessTiers.indexOf(activeAccessTier)}
            onSelect={(index) => handleAccessTierChange(accessTiers[index] ?? 'free')}
            accessibilityLabel={t('stickerAccessGroupA11y')}
          />
        </View>
      )}

      {/* Category tabs — hidden during search */}
      {!isSearching && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={[styles.tabs, { borderBottomColor: theme.colors.border }]}
        >
          {activeStickerPacks.map((pack) => {
            const active = pack.id === activePack.id;
            return (
              <TouchableOpacity
                key={pack.id}
                style={[
                  styles.tab,
                  {
                    borderColor: active ? theme.colors.tint : theme.colors.border,
                    backgroundColor: active ? theme.colors.tint + '18' : theme.colors.surface,
                  },
                ]}
                onPress={() => setActivePackId(pack.id)}
                accessibilityLabel={`${t('stickerCategoryA11y')}: ${pack.name}`}
              >
                <Text
                  preset="caption"
                  style={{ color: active ? theme.colors.tint : theme.colors.text, fontWeight: '600' }}
                >
                  {pack.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}

      {/* 4-col grid */}
      {isSearching && flatData.length === 0 ? (
        <View style={styles.empty}>
          <Text preset="caption" color="textSecondary">{t('stickerNoResultsPrefix')} &quot;{search}&quot;</Text>
        </View>
      ) : (
        <FlatList
          data={flatData}
          keyExtractor={(d, i) => `${d.packId}-${d.item.id}-${i}`}
          numColumns={4}
          contentContainerStyle={styles.grid}
          showsVerticalScrollIndicator={false}
          style={{ maxHeight: 320 }}
          renderItem={({ item: d }) => renderSticker(d)}
        />
      )}
    </Modal>
  );
}

const styles = StyleSheet.create({
  searchRow: {
    paddingHorizontal: 2,
    marginBottom: 12,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    padding: 0,
  },
  clearSearch: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  accessTabs: {
    marginBottom: 10,
  },
  tabs: {
    flexDirection: 'row',
    gap: 8,
    paddingBottom: 10,
    paddingHorizontal: 2,
  },
  tab: {
    minHeight: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  grid: {
    paddingTop: 4,
    paddingBottom: 8,
    gap: 6,
  },
  cell: {
    width: CELL,
    height: CELL,
    margin: 3,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockedCell: {
    opacity: 0.58,
  },
  lockBadge: {
    position: 'absolute',
    right: 8,
    top: 8,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cellEmoji: {
    fontSize: 32,
  },
  cellImage: {
    width: CELL - 16,
    height: CELL - 16,
  },
  empty: {
    paddingVertical: 40,
    alignItems: 'center',
  },
});
