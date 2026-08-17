import React from 'react';
import { View, TouchableOpacity, ScrollView } from 'react-native';
import { useTheme } from '@providers/ThemeProvider';
import { Modal } from '@shared/components/Modal';
import { Text } from '@shared/components/Text';
import { Ionicons } from '@expo/vector-icons';
import { CompanionType, COMPANION_OPTIONS } from '../domain/Companion';
import { useTranslation } from '@/localization/i18n';

interface CompanionPickerModalProps {
  readonly visible: boolean;
  readonly onClose: () => void;
  readonly selectedCompanion: CompanionType;
  readonly onSelectCompanion: (companion: CompanionType) => void;
}

export const CompanionPickerModal: React.FC<CompanionPickerModalProps> = ({
  visible,
  onClose,
  selectedCompanion,
  onSelectCompanion,
}) => {
  const theme = useTheme();
  const t = useTranslation();

  return (
    <Modal visible={visible} onDismiss={onClose} title={t('companionSelectTitle')} accessibilityLabel={t('companionPickerA11y')}>
      <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 420 }}>
        {COMPANION_OPTIONS.map((item) => {
          const isSelected = item.id === selectedCompanion;
          return (
            <TouchableOpacity
              key={item.id}
              style={{
                flexDirection: 'row',
                backgroundColor: isSelected ? `${theme.colors.tint}1A` : theme.colors.surface,
                borderRadius: theme.borderRadius.lg,
                padding: theme.spacing.md,
                marginBottom: theme.spacing.md,
                borderWidth: 1.5,
                borderColor: isSelected ? theme.colors.tint : theme.colors.border,
                alignItems: 'center',
              }}
              onPress={() => {
                onSelectCompanion(item.id);
                onClose();
              }}
              activeOpacity={0.8}
              accessibilityLabel={`${t('companionSelectA11y')}: ${item.name}${isSelected ? `, ${t('companionSelectedA11y')}` : ''}`}
              accessibilityRole="button"
              accessibilityState={{ selected: isSelected }}
            >
              <View
                style={{
                  width: 64,
                  height: 64,
                  marginRight: theme.spacing.lg,
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <Text style={{ fontSize: 42, lineHeight: 54, textAlign: 'center' }}>{item.avatar}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                  <Text preset="label" style={{ flex: 1 }}>{item.name}</Text>
                  {isSelected && (
                    <Ionicons name="checkmark-circle" size={20} color={theme.colors.tint} />
                  )}
                </View>
                <Text preset="caption" color="textSecondary" style={{ marginBottom: 4 }}>
                  {item.description}
                </Text>
                <Text preset="caption" color="tint" style={{ fontStyle: 'italic' }}>
                  &quot;{item.greeting}&quot;
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </Modal>
  );
};
