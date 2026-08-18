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
 *   • Rotate control supports tap and horizontal drag
 *   • + / − buttons to resize in 20% steps
 *   • Send an individual sticker behind the text canvas
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
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { PlacedSticker, findStickerItem } from '../domain/Sticker';
import { useTranslation } from '@/localization/i18n';

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
  const t = useTranslation();
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
  const dragMoved = useRef(false);
  const editableRef = useRef(isEditable);
  editableRef.current = isEditable;

  // Resolve the sticker data
  const stickerItem = findStickerItem(sticker.stickerId);
  const stickerIcon = stickerItem?.icon ?? '⭐';
  const stickerSource = stickerItem?.source;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => editableRef.current,
      onMoveShouldSetPanResponder: (_, gs) =>
        editableRef.current && (Math.abs(gs.dx) > 4 || Math.abs(gs.dy) > 4),

      onPanResponderGrant: () => {
        pan.setOffset({ x: position.current.x, y: position.current.y });
        pan.setValue({ x: 0, y: 0 });
        dragMoved.current = false;
        setIsSelected(false); // hide controls while dragging
      },

      onPanResponderMove: (_, gesture) => {
        if (Math.abs(gesture.dx) > 4 || Math.abs(gesture.dy) > 4) dragMoved.current = true;
        pan.setValue({ x: gesture.dx, y: gesture.dy });
      },

      onPanResponderRelease: (_, gs) => {
        pan.flattenOffset();
        if (!dragMoved.current) {
          setIsSelected((selected) => !selected);
          return;
        }
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
  const handleRotate = useCallback(() => {
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

  const handleToggleBehindText = useCallback(() => {
    // Release the editing layer immediately so the new stack order is visible.
    setIsSelected(false);
    onUpdate({
      ...sticker,
      x: position.current.x,
      y: position.current.y,
      scale: scaleRef.current,
      rotation: rotationRef.current,
      behindText: !sticker.behindText,
    });
  }, [sticker, onUpdate]);

  const rotateGestureStart = useRef({ rotation: sticker.rotation, moved: false });
  const rotatePanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gesture) => Math.abs(gesture.dx) > 2 || Math.abs(gesture.dy) > 2,
      onPanResponderGrant: () => {
        rotateGestureStart.current = { rotation: rotationRef.current, moved: false };
      },
      onPanResponderMove: (_, gesture) => {
        if (Math.abs(gesture.dx) < 2 && Math.abs(gesture.dy) < 2) return;
        rotateGestureStart.current.moved = true;
        const next = rotateGestureStart.current.rotation + gesture.dx * 0.75;
        rotationRef.current = next;
        setCurrentRotation(next);
        onUpdate({
          ...sticker,
          x: position.current.x,
          y: position.current.y,
          scale: scaleRef.current,
          rotation: next,
        });
      },
      onPanResponderRelease: () => {
        if (!rotateGestureStart.current.moved) handleRotate();
      },
    })
  ).current;

  const positionStyle = {
    transform: [
      { translateX: pan.x },
      { translateY: pan.y },
    ],
    // Keep a selected sticker and its controls reachable while editing. Once
    // deselected, the visual sticker moves below the editor layer.
    zIndex: isSelected ? 999 : sticker.behindText ? 1 : sticker.zIndex + 3,
    elevation: isSelected ? 999 : sticker.behindText ? 1 : sticker.zIndex + 3,
  };

  const stickerTransformStyle = {
    transform: [
      { scale: currentScale },
      { rotate: `${currentRotation}deg` },
    ],
  };

  return (
    <Animated.View
      style={[styles.container, positionStyle]}
    >
      {/* Control strip (only when selected and editable) */}
      {isEditable && isSelected && (
        <View style={styles.controls}>
          {/* Rotate */}
          <View
            style={styles.controlBtn}
            {...rotatePanResponder.panHandlers}
            accessibilityLabel={t('stickerRotateA11y')}
            accessibilityRole="button"
          >
            <MaterialCommunityIcons name="rotate-right" size={16} color="#FFFFFF" />
          </View>

          {/* Shrink */}
          <TouchableOpacity
            style={styles.controlBtn}
            onPress={handleScaleDown}
            accessibilityLabel={t('stickerShrinkA11y')}
            accessibilityRole="button"
          >
            <Text style={styles.controlText}>−</Text>
          </TouchableOpacity>

          {/* Delete */}
          <TouchableOpacity
            style={[styles.controlBtn, styles.deleteBtn]}
            onPress={() => onDelete(sticker.id)}
            accessibilityLabel={t('stickerDeleteA11y')}
            accessibilityRole="button"
          >
            <Text style={styles.controlText}>✕</Text>
          </TouchableOpacity>

          {/* Grow */}
          <TouchableOpacity
            style={styles.controlBtn}
            onPress={handleScaleUp}
            accessibilityLabel={t('stickerGrowA11y')}
            accessibilityRole="button"
          >
            <Text style={styles.controlText}>+</Text>
          </TouchableOpacity>

          {/* Text layer */}
          <TouchableOpacity
            style={[styles.controlBtn, sticker.behindText && styles.activeControlBtn]}
            onPress={handleToggleBehindText}
            accessibilityLabel={sticker.behindText ? t('stickerBringForwardA11y') : t('stickerSendBehindA11y')}
            accessibilityRole="button"
          >
            <MaterialCommunityIcons
              name={sticker.behindText ? 'layers' : 'layers-minus'}
              size={16}
              color="#FFFFFF"
            />
          </TouchableOpacity>

        </View>
      )}

      {/* Sticker body — tap to toggle selection */}
      <Animated.View style={stickerTransformStyle}>
        <View
          accessibilityLabel={`Sticker${isEditable ? ', tap to select' : ''}`}
          accessibilityRole={isEditable ? 'button' : 'image'}
          {...panResponder.panHandlers}
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
        </View>
      </Animated.View>
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
    zIndex: 1000,
    elevation: 10,
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
  activeControlBtn: {
    backgroundColor: '#0F766E',
  },
  controlText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
    lineHeight: 16,
  },
});
