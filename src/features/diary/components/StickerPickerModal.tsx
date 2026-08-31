/**
 * StickerPickerModal
 *
 * Redesigned sticker picker with:
 *   • BlurView glassmorphism background
 *   • Search bar (filters across all packs by name or category)
 *   • Horizontal category tabs
 *   • 4-column grid for project-authored PNG stickers
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
  useWindowDimensions,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { Modal } from '@shared/components/Modal';
import { IconCircleButton } from '@shared/components/IconCircleButton';
import { Text } from '@shared/components/Text';
import { useTheme } from '@providers/ThemeProvider';
import {
  STICKER_PACKS,
  type StickerAccessTier,
  type StickerItem,
} from '../domain/Sticker';
import { useTranslation } from '@/localization/i18n';
import { useSubscription } from '@/features/subscription/hooks/useSubscription';

const GRID_COLUMNS = 4;
const GRID_CELL_GAP = 6;

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
  const { width } = useWindowDimensions();
  const { isPro } = useSubscription();
  const [activePackId, setActivePackId] = useState(STICKER_PACKS[0]?.id ?? '');
  const [search, setSearch] = useState('');

  const activePack = STICKER_PACKS.find((p) => p.id === activePackId) ?? STICKER_PACKS[0]!;

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
  const cellSize = Math.max(
    64,
    Math.min(88, (width - theme.spacing.lg * 2 - GRID_CELL_GAP * GRID_COLUMNS * 2) / GRID_COLUMNS)
  );

  const renderSticker = ({ item, packId, accessTier }: SearchResult) => {
    const isLocked = accessTier === 'premium' && !isPro;

    return (
      <TouchableOpacity
        style={[styles.cell, { width: cellSize }]}
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
        <View
          style={[
            styles.previewBox,
            {
              width: cellSize,
              height: cellSize,
              backgroundColor: theme.colors.surface,
              borderColor: isLocked ? theme.colors.tint : theme.colors.border,
            },
            isLocked && styles.lockedCell,
          ]}
        >
          {item.source != null ? (
            <Image source={item.source} style={{ width: cellSize - 18, height: cellSize - 18 }} resizeMode="contain" />
          ) : null}
          {isLocked ? (
            <View style={[styles.lockBadge, { backgroundColor: theme.colors.background }]}>
              <MaterialCommunityIcons name="lock" size={13} color={theme.colors.tint} />
            </View>
          ) : null}
        </View>
        <Text
          preset="caption"
          numberOfLines={1}
          style={[styles.cellLabel, { color: isLocked ? theme.colors.textSecondary : theme.colors.text }]}
        >
          {item.name}
        </Text>
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
            <IconCircleButton
              icon="close"
              onPress={() => setSearch('')}
              accessibilityLabel={t('stickerClearSearchA11y')}
              size="sm"
              surface="transparent"
              iconSize={17}
            />
          )}
        </View>
      </View>

      {/* Category tabs — hidden during search */}
      {!isSearching && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={[styles.tabs, { borderBottomColor: theme.colors.border }]}
        >
          {STICKER_PACKS.map((pack) => {
            const active = pack.id === activePack.id;
            const categoryLocked = pack.accessTier === 'premium' && !isPro;
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
                {categoryLocked ? (
                  <MaterialCommunityIcons name="lock" size={12} color={active ? theme.colors.tint : theme.colors.textSecondary} />
                ) : null}
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
          extraData={cellSize}
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
  tabs: {
    flexDirection: 'row',
    gap: 8,
    paddingBottom: 10,
    paddingHorizontal: 2,
  },
  tab: {
    minHeight: 36,
    flexDirection: 'row',
    gap: 5,
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
    margin: 3,
    alignItems: 'center',
  },
  previewBox: {
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  lockedCell: {
    opacity: 0.74,
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
  cellLabel: {
    width: '100%',
    marginTop: 4,
    textAlign: 'center',
  },
  empty: {
    paddingVertical: 40,
    alignItems: 'center',
  },
});
