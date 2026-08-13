/**
 * StickerCanvasItem
 *
 * Draggable, resizable sticker using only React Native built-in APIs
 * (Animated + PanResponder) — no react-native-gesture-handler or
 * react-native-reanimated required, so it works in Expo Go.
 *
 * Interactions:
 *   • Drag to move
 *   • Tap to select (shows resize/delete controls)
 *   • + / − buttons to resize in 10% steps
 *   • ✕ button to delete
 */

import React, { useRef, useState, useCallback } from 'react';
import {
  Animated,
  PanResponder,
  TouchableOpacity,
  Text,
  View,
  StyleSheet,
} from 'react-native';
import { PlacedSticker, STICKER_PACKS } from '../domain/Sticker';

interface StickerCanvasItemProps {
  readonly sticker: PlacedSticker;
  readonly onUpdate: (updated: PlacedSticker) => void;
  readonly onDelete: (id: string) => void;
  readonly isEditable?: boolean;
}

export const StickerCanvasItem: React.FC<StickerCanvasItemProps> = ({
  sticker,
  onUpdate,
  onDelete,
  isEditable = true,
}) => {
  const [isSelected, setIsSelected] = useState(false);
  const [currentScale, setCurrentScale] = useState(sticker.scale);

  // Animated position — starts at the sticker's saved position
  const pan = useRef(new Animated.ValueXY({ x: sticker.x, y: sticker.y })).current;
  // Track absolute position so we can persist on release
  const position = useRef({ x: sticker.x, y: sticker.y });

  // Find the emoji for this sticker
  let stickerIcon = '⭐';
  for (const pack of STICKER_PACKS) {
    const item = pack.stickers.find((s) => s.id === sticker.stickerId);
    if (item) {
      stickerIcon = item.icon;
      break;
    }
  }

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => isEditable,
      onMoveShouldSetPanResponder: (_, gs) =>
        isEditable && (Math.abs(gs.dx) > 4 || Math.abs(gs.dy) > 4),

      onPanResponderGrant: () => {
        // Anchor the animated value to current absolute position
        pan.setOffset({ x: position.current.x, y: position.current.y });
        pan.setValue({ x: 0, y: 0 });
        setIsSelected(false); // hide controls while dragging
      },

      onPanResponderMove: Animated.event(
        [null, { dx: pan.x, dy: pan.y }],
        { useNativeDriver: false }
      ),

      onPanResponderRelease: (_, gs) => {
        pan.flattenOffset();
        const newX = position.current.x + gs.dx;
        const newY = position.current.y + gs.dy;
        position.current = { x: newX, y: newY };

        onUpdate({
          ...sticker,
          x: newX,
          y: newY,
          scale: currentScale,
        });
      },
    })
  ).current;

  const handleScaleUp = useCallback(() => {
    const next = Math.min(currentScale + 0.2, 3.0);
    setCurrentScale(next);
    onUpdate({ ...sticker, x: position.current.x, y: position.current.y, scale: next });
  }, [currentScale, sticker, onUpdate]);

  const handleScaleDown = useCallback(() => {
    const next = Math.max(currentScale - 0.2, 0.4);
    setCurrentScale(next);
    onUpdate({ ...sticker, x: position.current.x, y: position.current.y, scale: next });
  }, [currentScale, sticker, onUpdate]);

  const animatedStyle = {
    transform: [
      { translateX: pan.x },
      { translateY: pan.y },
      { scale: currentScale },
      { rotate: `${sticker.rotation}deg` },
    ],
    zIndex: isSelected ? 999 : sticker.zIndex,
  };

  return (
    <Animated.View
      style={[styles.container, animatedStyle]}
      {...panResponder.panHandlers}
    >
      {/* Resize / delete controls (only when selected) */}
      {isEditable && isSelected && (
        <View style={styles.controls}>
          <TouchableOpacity
            style={styles.controlBtn}
            onPress={handleScaleDown}
            accessibilityLabel="Shrink sticker"
            accessibilityRole="button"
          >
            <Text style={styles.controlText}>−</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.controlBtn, styles.deleteBtn]}
            onPress={() => onDelete(sticker.id)}
            accessibilityLabel="Delete sticker"
            accessibilityRole="button"
          >
            <Text style={styles.controlText}>✕</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.controlBtn}
            onPress={handleScaleUp}
            accessibilityLabel="Grow sticker"
            accessibilityRole="button"
          >
            <Text style={styles.controlText}>+</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Sticker emoji — tap to toggle selection */}
      <TouchableOpacity
        onPress={() => isEditable && setIsSelected((s) => !s)}
        activeOpacity={isEditable ? 0.8 : 1}
        accessibilityLabel={`Sticker ${stickerIcon}${isEditable ? ', tap to select' : ''}`}
        accessibilityRole={isEditable ? 'button' : 'image'}
      >
        <Text style={[styles.emoji, isSelected && styles.emojiSelected]}>
          {stickerIcon}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: {
    fontSize: 48,
  },
  emojiSelected: {
    opacity: 0.85,
  },
  controls: {
    position: 'absolute',
    top: -36,
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
  },
  controlBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#334155',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteBtn: {
    backgroundColor: '#EF4444',
  },
  controlText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
    lineHeight: 16,
  },
});
