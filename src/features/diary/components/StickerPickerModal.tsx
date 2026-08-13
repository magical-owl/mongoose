import React, { useState } from 'react';
import { View, TouchableOpacity, ScrollView } from 'react-native';
import { useTheme } from '@providers/ThemeProvider';
import { Modal } from '@shared/components/Modal';
import { Text } from '@shared/components/Text';
import { Chip } from '@shared/components/Chip';
import { STICKER_PACKS } from '../domain/Sticker';

interface StickerPickerModalProps {
  readonly visible: boolean;
  readonly onClose: () => void;
  readonly onSelectSticker: (stickerId: string, category: string) => void;
}

export const StickerPickerModal: React.FC<StickerPickerModalProps> = ({
  visible,
  onClose,
  onSelectSticker,
}) => {
  const theme = useTheme();
  const [activePackId, setActivePackId] = useState<string>(STICKER_PACKS[0]?.id || 'animals');
  const activePack = STICKER_PACKS.find((p) => p.id === activePackId) || STICKER_PACKS[0]!;

  return (
    <Modal visible={visible} onDismiss={onClose} title="Choose a Sticker" accessibilityLabel="Sticker picker">
      {/* Category tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: theme.spacing.sm, paddingBottom: theme.spacing.md }}
      >
        {STICKER_PACKS.map((pack) => (
          <Chip
            key={pack.id}
            label={`${pack.icon} ${pack.name}`}
            variant={pack.id === activePackId ? 'primary' : 'secondary'}
            onPress={() => setActivePackId(pack.id)}
            accessibilityLabel={`Category: ${pack.name}`}
          />
        ))}
      </ScrollView>

      {/* Sticker grid */}
      <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 340 }}>
        <View
          style={{
            flexDirection: 'row',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            paddingTop: theme.spacing.sm,
          }}
        >
          {activePack.stickers.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={{
                width: '30%',
                backgroundColor: theme.colors.surface,
                borderRadius: theme.borderRadius.lg,
                padding: theme.spacing.md,
                alignItems: 'center',
                marginBottom: theme.spacing.md,
                borderWidth: 1,
                borderColor: theme.colors.border,
              }}
              onPress={() => {
                onSelectSticker(item.id, activePack.id);
                onClose();
              }}
              activeOpacity={0.7}
              accessibilityLabel={`Add ${item.name} sticker`}
              accessibilityRole="button"
            >
              <Text style={{ fontSize: 40, marginBottom: theme.spacing.xs }}>{item.icon}</Text>
              <Text preset="caption" color="textSecondary" style={{ textAlign: 'center' }}>
                {item.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </Modal>
  );
};
