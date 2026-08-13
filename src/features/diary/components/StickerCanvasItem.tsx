import React from 'react';
import { Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  runOnJS,
} from 'react-native-reanimated';
import { PlacedSticker, STICKER_PACKS } from '../domain/Sticker';

interface StickerCanvasItemProps {
  sticker: PlacedSticker;
  onUpdate: (updated: PlacedSticker) => void;
  onDelete: (id: string) => void;
  isEditable?: boolean;
}

export const StickerCanvasItem: React.FC<StickerCanvasItemProps> = ({
  sticker,
  onUpdate,
  onDelete,
  isEditable = true,
}) => {
  const translationX = useSharedValue(sticker.x);
  const translationY = useSharedValue(sticker.y);
  const scale = useSharedValue(sticker.scale);
  const rotation = useSharedValue(sticker.rotation);
  const [isSelected, setIsSelected] = React.useState(false);

  // Find icon representation
  let stickerIcon = '⭐';
  for (const pack of STICKER_PACKS) {
    const item = pack.stickers.find((s) => s.id === sticker.stickerId);
    if (item) {
      stickerIcon = item.icon;
      break;
    }
  }

  const panGesture = Gesture.Pan()
    .enabled(isEditable)
    .onUpdate((event) => {
      translationX.value = sticker.x + event.translationX;
      translationY.value = sticker.y + event.translationY;
    })
    .onEnd(() => {
      runOnJS(onUpdate)({
        ...sticker,
        x: translationX.value,
        y: translationY.value,
        scale: scale.value,
        rotation: rotation.value,
      });
    });

  const pinchGesture = Gesture.Pinch()
    .enabled(isEditable)
    .onUpdate((event) => {
      scale.value = Math.min(Math.max(sticker.scale * event.scale, 0.5), 3.0);
    })
    .onEnd(() => {
      runOnJS(onUpdate)({
        ...sticker,
        x: translationX.value,
        y: translationY.value,
        scale: scale.value,
        rotation: rotation.value,
      });
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translationX.value },
      { translateY: translationY.value },
      { scale: scale.value },
      { rotate: `${rotation.value}deg` },
    ],
    zIndex: sticker.zIndex,
  }));

  const composedGesture = Gesture.Simultaneous(panGesture, pinchGesture);

  return (
    <GestureDetector gesture={composedGesture}>
      <Animated.View style={[styles.stickerContainer, animatedStyle]}>
        <TouchableOpacity
          onPress={() => isEditable && setIsSelected(!isSelected)}
          activeOpacity={0.9}
        >
          <Text style={styles.stickerEmoji}>{stickerIcon}</Text>
        </TouchableOpacity>
        {isEditable && isSelected && (
          <TouchableOpacity
            style={styles.deleteBadge}
            onPress={() => onDelete(sticker.id)}
          >
            <Text style={styles.deleteBadgeText}>✕</Text>
          </TouchableOpacity>
        )}
      </Animated.View>
    </GestureDetector>
  );
};

const styles = StyleSheet.create({
  stickerContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 4,
  },
  stickerEmoji: {
    fontSize: 48,
  },
  deleteBadge: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#EF4444',
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
});
