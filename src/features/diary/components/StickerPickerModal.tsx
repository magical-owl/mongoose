import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { STICKER_PACKS } from '../domain/Sticker';

interface StickerPickerModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectSticker: (stickerId: string, category: string) => void;
}

export const StickerPickerModal: React.FC<StickerPickerModalProps> = ({
  visible,
  onClose,
  onSelectSticker,
}) => {
  const [activePackId, setActivePackId] = useState<string>(STICKER_PACKS[0]?.id || 'animals');
  const activePack = STICKER_PACKS.find((p) => p.id === activePackId) || STICKER_PACKS[0]!;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Choose a Sticker</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeText}>✕</Text>
          </TouchableOpacity>
        </View>

        {/* Category Tabs */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabContainer}>
          {STICKER_PACKS.map((pack) => {
            const isActive = pack.id === activePackId;
            return (
              <TouchableOpacity
                key={pack.id}
                style={[styles.tab, isActive && styles.tabActive]}
                onPress={() => setActivePackId(pack.id)}
              >
                <Text style={styles.tabIcon}>{pack.icon}</Text>
                <Text style={[styles.tabText, isActive && styles.tabTextActive]}>{pack.name}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Sticker Grid */}
        <ScrollView contentContainerStyle={styles.gridContainer}>
          {activePack.stickers.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.stickerCard}
              onPress={() => {
                onSelectSticker(item.id, activePack.id);
                onClose();
              }}
              activeOpacity={0.7}
            >
              <Text style={styles.stickerEmoji}>{item.icon}</Text>
              <Text style={styles.stickerName}>{item.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  title: {
    color: '#F8FAFC',
    fontSize: 20,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 4,
  },
  closeText: {
    color: '#94A3B8',
    fontSize: 20,
    fontWeight: 'bold',
  },
  tabContainer: {
    flexGrow: 0,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(30, 41, 59, 0.6)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 10,
  },
  tabActive: {
    backgroundColor: '#10B981',
  },
  tabIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  tabText: {
    color: '#94A3B8',
    fontSize: 14,
    fontWeight: '600',
  },
  tabTextActive: {
    color: '#0F172A',
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    justifyContent: 'space-between',
  },
  stickerCard: {
    width: '30%',
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  stickerEmoji: {
    fontSize: 40,
    marginBottom: 8,
  },
  stickerName: {
    color: '#F8FAFC',
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
});
