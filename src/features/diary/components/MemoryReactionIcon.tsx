import { Image, StyleSheet, View, type ImageSourcePropType, type StyleProp, type ViewStyle } from 'react-native';
import type { MemoryReaction } from '@/features/diary/domain/MemoryReaction';

interface MemoryReactionIconProps {
  readonly reaction: MemoryReaction;
  readonly size: number;
  readonly style?: StyleProp<ViewStyle>;
  readonly testID?: string;
}

const reactionImages: Readonly<Record<MemoryReaction, ImageSourcePropType>> = {
  cherish: require('../../../../assets/reactions/cherish.png') as ImageSourcePropType,
  treasure: require('../../../../assets/reactions/treasure.png') as ImageSourcePropType,
  smile: require('../../../../assets/reactions/smile.png') as ImageSourcePropType,
  heavy: require('../../../../assets/reactions/heavy.png') as ImageSourcePropType,
  tender: require('../../../../assets/reactions/tender.png') as ImageSourcePropType,
  stormy: require('../../../../assets/reactions/stormy.png') as ImageSourcePropType,
  wonder: require('../../../../assets/reactions/wonder.png') as ImageSourcePropType,
};

export function MemoryReactionIcon({
  reaction,
  size,
  style,
  testID,
}: MemoryReactionIconProps): React.JSX.Element {
  return (
    <View
      pointerEvents="none"
      style={[styles.container, { width: size, height: size }, style]}
      testID={testID}
    >
      <Image
        source={reactionImages[reaction]}
        resizeMode="contain"
        style={{ width: size, height: size }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
