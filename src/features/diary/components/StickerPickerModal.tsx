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

import { Modal } from '@shared/components/Modal';
import { Text } from '@shared/components/Text';
import { useTheme } from '@providers/ThemeProvider';
import { STICKER_PACKS, StickerItem } from '../domain/Sticker';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
// 4 columns with 8px gap each side + outer padding
const CELL = (SCREEN_WIDTH * 0.9 - 48) / 4;

interface StickerPickerModalProps {
  readonly visible: boolean;
  readonly onClose: () => void;
  readonly onSelectSticker: (stickerId: string, category: string) => void;
}

type SearchResult = { item: StickerItem; packId: string };

export function StickerPickerModal({ visible, onClose, onSelectSticker }: StickerPickerModalProps) {
  const theme = useTheme();
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
          results.push({ item, packId: pack.id });
        }
      }
    }
    return results;
  }, [search]);

  const isSearching = search.trim().length > 0;

  const renderSticker = ({ item, packId }: SearchResult) => (
    <TouchableOpacity
      style={[styles.cell, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
      onPress={() => {
        onSelectSticker(item.id, packId);
        onClose();
      }}
      activeOpacity={0.65}
      accessibilityLabel={`Add ${item.name} sticker`}
      accessibilityRole="button"
    >
      {item.source != null ? (
        <Image source={item.source} style={styles.cellImage} resizeMode="contain" />
      ) : (
        <RNText style={styles.cellEmoji}>{item.icon}</RNText>
      )}
    </TouchableOpacity>
  );

  const flatData: SearchResult[] = isSearching
    ? searchResults
    : activePack.stickers.map((item) => ({ item, packId: activePack.id }));

  return (
    <Modal visible={visible} onDismiss={onClose} title="🎨 Choose a Sticker" accessibilityLabel="Sticker picker">
      {/* Search bar */}
      <View style={[styles.searchRow, { borderBottomColor: theme.colors.border }]}>
        <View style={[styles.searchBox, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
          <RNText style={{ fontSize: 14, marginRight: 6, color: theme.colors.textSecondary }}>🔍</RNText>
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search stickers…"
            placeholderTextColor={theme.colors.textSecondary}
            style={{ flex: 1, color: theme.colors.text, fontSize: 14, padding: 0 }}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')} accessibilityLabel="Clear search">
              <RNText style={{ color: theme.colors.textSecondary, fontSize: 16, paddingLeft: 6 }}>✕</RNText>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Category tabs — hidden during search */}
      {!isSearching && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabs}
        >
          {STICKER_PACKS.map((pack) => {
            const active = pack.id === activePackId;
            return (
              <TouchableOpacity
                key={pack.id}
                style={[
                  styles.tab,
                  {
                    backgroundColor: active ? theme.colors.tint : 'transparent',
                    borderColor: active ? theme.colors.tint : theme.colors.border,
                  },
                ]}
                onPress={() => setActivePackId(pack.id)}
                accessibilityLabel={`Category: ${pack.name}`}
              >
                <Text
                  preset="caption"
                  style={{ color: active ? '#fff' : theme.colors.text, fontWeight: '600' }}
                >
                  {pack.icon} {pack.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}

      {/* 4-col grid */}
      {isSearching && flatData.length === 0 ? (
        <View style={styles.empty}>
          <Text preset="caption" color="textSecondary">No stickers found for "{search}"</Text>
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
    paddingBottom: 10,
    borderBottomWidth: 1,
    marginBottom: 8,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  tabs: {
    flexDirection: 'row',
    gap: 6,
    paddingBottom: 10,
    paddingHorizontal: 2,
  },
  tab: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
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
    borderRadius: 12,
    borderWidth: 1,
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
