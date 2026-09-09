import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import type { MemoryReaction } from '@/features/diary/domain/MemoryReaction';
import { MemoryReactionButton } from './MemoryReactionButton';

interface ReflectionReactionFooterProps {
  readonly entryId: string;
  readonly reflectionId: string;
  readonly reactions: readonly MemoryReaction[];
  readonly isPickerVisible: boolean;
  readonly onOpenPicker: () => void;
  readonly onDismissPicker: () => void;
  readonly onToggleReaction: (entryId: string, reflectionId: string, reaction: MemoryReaction) => void;
  readonly style?: StyleProp<ViewStyle>;
  readonly testID?: string;
}

export function ReflectionReactionFooter({
  entryId,
  reflectionId,
  reactions,
  isPickerVisible,
  onOpenPicker,
  onDismissPicker,
  onToggleReaction,
  style,
  testID,
}: ReflectionReactionFooterProps): React.JSX.Element {
  return (
    <View style={[styles.footer, style]} testID={testID}>
      <MemoryReactionButton
        reactions={reactions}
        visible={isPickerVisible}
        onOpen={onOpenPicker}
        onDismiss={onDismissPicker}
        onToggleReaction={(reaction) => onToggleReaction(entryId, reflectionId, reaction)}
        compact
        buttonStyle={styles.button}
        trayAlignment="center"
        testID={testID ? `${testID}-button` : undefined}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    marginTop: 8,
  },
  button: {
    minHeight: 28,
  },
});
