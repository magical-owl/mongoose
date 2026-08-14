/**
 * StickerCanvasItem
 *
 * Draggable, resizable, rotateable sticker using only React Native built-in APIs
 * (Animated + PanResponder) — no react-native-gesture-handler or
 * react-native-reanimated required, so it works in Expo Go.
 *
 * Interactions:
 *   • Drag to move
 *   • Tap to select (shows control strip)
 *   • ← / → buttons to rotate in 15° steps
 *   • + / − buttons to resize in 20% steps
 *   • ✕ button to delete
 *
 * State persistence:
 *   All mutations (position, scale, rotation) are immediately propagated to
 *   the parent via onUpdate so the parent array stays up-to-date for saving.
 */

import React, { useRef, useState, useCallback } from 'react';
import {
  Animated,
  PanResponder,
  TouchableOpacity,
  Text,
  Image,
  View,
  StyleSheet,
} from 'react-native';
import { PlacedSticker, findStickerItem } from '../domain/Sticker';

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
  // Local mutable state — initialised from persisted values
  const [currentScale, setCurrentScale] = useState(sticker.scale);
  const [currentRotation, setCurrentRotation] = useState(sticker.rotation);

  // Refs mirror state so panResponder (stale closure) always reads latest values
  const scaleRef = useRef(sticker.scale);
  const rotationRef = useRef(sticker.rotation);

  // Animated position — starts at the sticker's saved position
  const pan = useRef(new Animated.ValueXY({ x: sticker.x, y: sticker.y })).current;
  // Track absolute position so we can persist on release
  const position = useRef({ x: sticker.x, y: sticker.y });

  // Resolve the sticker data
  const stickerItem = findStickerItem(sticker.stickerId);
  const stickerIcon = stickerItem?.icon ?? '⭐';
  const stickerSource = stickerItem?.source;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => isEditable,
      onMoveShouldSetPanResponder: (_, gs) =>
        isEditable && (Math.abs(gs.dx) > 4 || Math.abs(gs.dy) > 4),

      onPanResponderGrant: () => {
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

        // Use refs here — closure was created once, refs always hold latest values
        onUpdate({
          ...sticker,
          x: newX,
          y: newY,
          scale: scaleRef.current,
          rotation: rotationRef.current,
        });
      },
    })
  ).current;

  // ── Scale controls ────────────────────────────────────────────────────────
  const handleScaleUp = useCallback(() => {
    const next = Math.min(scaleRef.current + 0.2, 3.0);
    scaleRef.current = next;
    setCurrentScale(next);
    onUpdate({
      ...sticker,
      x: position.current.x,
      y: position.current.y,
      scale: next,
      rotation: rotationRef.current,
    });
  }, [sticker, onUpdate]);

  const handleScaleDown = useCallback(() => {
    const next = Math.max(scaleRef.current - 0.2, 0.4);
    scaleRef.current = next;
    setCurrentScale(next);
    onUpdate({
      ...sticker,
      x: position.current.x,
      y: position.current.y,
      scale: next,
      rotation: rotationRef.current,
    });
  }, [sticker, onUpdate]);

  // ── Rotation controls ─────────────────────────────────────────────────────
  const handleRotateCCW = useCallback(() => {
    const next = rotationRef.current - 15;
    rotationRef.current = next;
    setCurrentRotation(next);
    onUpdate({
      ...sticker,
      x: position.current.x,
      y: position.current.y,
      scale: scaleRef.current,
      rotation: next,
    });
  }, [sticker, onUpdate]);

  const handleRotateCW = useCallback(() => {
    const next = rotationRef.current + 15;
    rotationRef.current = next;
    setCurrentRotation(next);
    onUpdate({
      ...sticker,
      x: position.current.x,
      y: position.current.y,
      scale: scaleRef.current,
      rotation: next,
    });
  }, [sticker, onUpdate]);

  const animatedStyle = {
    transform: [
      { translateX: pan.x },
      { translateY: pan.y },
      { scale: currentScale },       // state drives re-render
      { rotate: `${currentRotation}deg` }, // state drives re-render
    ],
    zIndex: isSelected ? 999 : sticker.zIndex,
  };

  return (
    <Animated.View
      style={[styles.container, animatedStyle]}
      {...panResponder.panHandlers}
    >
      {/* Control strip (only when selected and editable) */}
      {isEditable && isSelected && (
        <View style={styles.controls}>
          {/* Rotate CCW */}
          <TouchableOpacity
            style={styles.controlBtn}
            onPress={handleRotateCCW}
            accessibilityLabel="Rotate sticker counter-clockwise"
            accessibilityRole="button"
          >
            <Text style={styles.controlText}>↺</Text>
          </TouchableOpacity>

          {/* Shrink */}
          <TouchableOpacity
            style={styles.controlBtn}
            onPress={handleScaleDown}
            accessibilityLabel="Shrink sticker"
            accessibilityRole="button"
          >
            <Text style={styles.controlText}>−</Text>
          </TouchableOpacity>

          {/* Delete */}
          <TouchableOpacity
            style={[styles.controlBtn, styles.deleteBtn]}
            onPress={() => onDelete(sticker.id)}
            accessibilityLabel="Delete sticker"
            accessibilityRole="button"
          >
            <Text style={styles.controlText}>✕</Text>
          </TouchableOpacity>

          {/* Grow */}
          <TouchableOpacity
            style={styles.controlBtn}
            onPress={handleScaleUp}
            accessibilityLabel="Grow sticker"
            accessibilityRole="button"
          >
            <Text style={styles.controlText}>+</Text>
          </TouchableOpacity>

          {/* Rotate CW */}
          <TouchableOpacity
            style={styles.controlBtn}
            onPress={handleRotateCW}
            accessibilityLabel="Rotate sticker clockwise"
            accessibilityRole="button"
          >
            <Text style={styles.controlText}>↻</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Sticker body — tap to toggle selection */}
      <TouchableOpacity
        onPress={() => isEditable && setIsSelected((s) => !s)}
        activeOpacity={isEditable ? 0.8 : 1}
        accessibilityLabel={`Sticker${isEditable ? ', tap to select' : ''}`}
        accessibilityRole={isEditable ? 'button' : 'image'}
      >
        {stickerSource != null ? (
          <Image
            source={stickerSource}
            style={[styles.stickerImage, isSelected && styles.selectedOverlay]}
            resizeMode="contain"
          />
        ) : (
          <Text style={[styles.emoji, isSelected && styles.emojiSelected]}>
            {stickerIcon}
          </Text>
        )}
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
  stickerImage: {
    width: 80,
    height: 80,
  },
  selectedOverlay: {
    opacity: 0.85,
  },
  controls: {
    position: 'absolute',
    top: -40,
    flexDirection: 'row',
    gap: 5,
    alignItems: 'center',
  },
  controlBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
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
