import { type ComponentProps } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '@providers/ThemeProvider';
import { Modal } from '@shared/components/Modal';
import { Text } from '@shared/components/Text';

type MaterialIconName = ComponentProps<typeof MaterialCommunityIcons>['name'];

export interface EntryEditToolMenuAction {
  readonly id: string;
  readonly icon: MaterialIconName;
  readonly label: string;
  readonly description: string;
  readonly onPress: () => void;
  readonly testID?: string;
}

interface EntryEditToolMenuModalProps {
  readonly visible: boolean;
  readonly title: string;
  readonly accessibilityLabel: string;
  readonly actions: readonly EntryEditToolMenuAction[];
  readonly onDismiss: () => void;
}

export function EntryEditToolMenuModal({
  visible,
  title,
  accessibilityLabel,
  actions,
  onDismiss,
}: EntryEditToolMenuModalProps): React.JSX.Element {
  const theme = useTheme();

  return (
    <Modal
      visible={visible}
      onDismiss={onDismiss}
      title={title}
      accessibilityLabel={accessibilityLabel}
    >
      <View style={styles.list}>
        {actions.map((action) => (
          <TouchableOpacity
            key={action.id}
            onPress={() => {
              onDismiss();
              setTimeout(action.onPress, 220);
            }}
            activeOpacity={0.72}
            accessibilityRole="button"
            accessibilityLabel={action.label}
            testID={action.testID}
            style={[
              styles.action,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
              },
            ]}
          >
            <View style={[styles.iconFrame, { backgroundColor: theme.colors.tint + '1F' }]}>
              <MaterialCommunityIcons name={action.icon} size={23} color={theme.colors.tint} />
            </View>
            <View style={styles.actionText}>
              <Text preset="body" style={styles.actionLabel}>
                {action.label}
              </Text>
              <Text preset="caption" style={{ color: theme.colors.textSecondary }}>
                {action.description}
              </Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={22} color={theme.colors.textSecondary} />
          </TouchableOpacity>
        ))}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: 10,
    paddingBottom: 10,
  },
  action: {
    minHeight: 72,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconFrame: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionText: {
    flex: 1,
    gap: 2,
  },
  actionLabel: {
    fontSize: 16,
    lineHeight: 21,
    fontWeight: '800',
  },
});
