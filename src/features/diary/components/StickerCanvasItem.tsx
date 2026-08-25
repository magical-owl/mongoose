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
 *   • Drag the selected dotted outline handle to resize
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
  TextInput,
  Image,
  View,
  StyleSheet,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { PlacedSticker, findStickerItem } from '../domain/Sticker';
import { useTranslation } from '@/localization/i18n';

const TEXT_STICKER_COLORS = ['#111827', '#F8FAFC', '#DC2626', '#2563EB', '#059669', '#D97706', '#7C3AED', '#DB2777'] as const;
const TEXT_STICKER_BACKGROUND_COLORS = [undefined, '#F8FAFC', '#FEF3C7', '#DBEAFE', '#DCFCE7', '#FCE7F3', '#EDE9FE', '#111827'] as const;
const STICKER_OPACITIES = [1, 0.75, 0.5, 0.3] as const;

interface StickerCanvasItemProps {
  readonly sticker: PlacedSticker;
  readonly onUpdate: (updated: PlacedSticker) => void;
  readonly onDelete: (id: string) => void;
  readonly isEditable?: boolean;
  readonly onDragStateChange?: (isDragging: boolean) => void;
}

export const StickerCanvasItem: React.FC<StickerCanvasItemProps> = ({
  sticker,
  onUpdate,
  onDelete,
  isEditable = true,
  onDragStateChange,
}) => {
  const t = useTranslation();
  const [isSelected, setIsSelected] = useState(isEditable && sticker.text !== undefined && sticker.text.length === 0);
  const selectedRef = useRef(false);
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
  selectedRef.current = isSelected;

  // Resolve the sticker data
  const isTextSticker = sticker.text !== undefined;
  const stickerItem = sticker.imageUri || isTextSticker ? undefined : findStickerItem(sticker.stickerId);
  const stickerIcon = stickerItem?.icon ?? '⭐';
  const stickerSource = stickerItem?.source;
  const photoAspectRatio = sticker.imageWidth && sticker.imageHeight ? sticker.imageWidth / sticker.imageHeight : 1;
  const textColor = sticker.textColor ?? TEXT_STICKER_COLORS[0];
  const textBackgroundColor = sticker.textBackgroundColor;
  const stickerOpacity = sticker.opacity ?? 1;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => editableRef.current && !(isTextSticker && selectedRef.current),
      onStartShouldSetPanResponderCapture: () => editableRef.current && !(isTextSticker && selectedRef.current),
      onMoveShouldSetPanResponder: (_, gs) =>
        editableRef.current && (Math.abs(gs.dx) > 4 || Math.abs(gs.dy) > 4),
      onMoveShouldSetPanResponderCapture: (_, gs) =>
        editableRef.current && (Math.abs(gs.dx) > 4 || Math.abs(gs.dy) > 4),

      onPanResponderGrant: () => {
        onDragStateChange?.(true);
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
        onDragStateChange?.(false);
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
      onPanResponderTerminate: () => {
        onDragStateChange?.(false);
      },
      onPanResponderTerminationRequest: () => false,
      onShouldBlockNativeResponder: () => true,
    })
  ).current;

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

  const handleChangeText = useCallback((text: string) => {
    onUpdate({
      ...sticker,
      x: position.current.x,
      y: position.current.y,
      scale: scaleRef.current,
      rotation: rotationRef.current,
      text,
    });
  }, [sticker, onUpdate]);

  const handleCycleTextColor = useCallback(() => {
    const currentIndex = TEXT_STICKER_COLORS.findIndex((color) => color === textColor);
    const nextColor = TEXT_STICKER_COLORS[(currentIndex + 1) % TEXT_STICKER_COLORS.length] ?? TEXT_STICKER_COLORS[0];
    onUpdate({
      ...sticker,
      x: position.current.x,
      y: position.current.y,
      scale: scaleRef.current,
      rotation: rotationRef.current,
      textColor: nextColor,
    });
  }, [sticker, onUpdate, textColor]);

  const handleCycleOpacity = useCallback(() => {
    const currentIndex = STICKER_OPACITIES.findIndex((opacity) => opacity === stickerOpacity);
    const nextOpacity = STICKER_OPACITIES[(currentIndex + 1) % STICKER_OPACITIES.length] ?? STICKER_OPACITIES[0];
    onUpdate({
      ...sticker,
      x: position.current.x,
      y: position.current.y,
      scale: scaleRef.current,
      rotation: rotationRef.current,
      opacity: nextOpacity,
    });
  }, [sticker, onUpdate, stickerOpacity]);

  const handleCycleTextBackground = useCallback(() => {
    const currentIndex = TEXT_STICKER_BACKGROUND_COLORS.findIndex((color) => color === textBackgroundColor);
    const nextColor = TEXT_STICKER_BACKGROUND_COLORS[(currentIndex + 1) % TEXT_STICKER_BACKGROUND_COLORS.length];
    onUpdate({
      ...sticker,
      x: position.current.x,
      y: position.current.y,
      scale: scaleRef.current,
      rotation: rotationRef.current,
      textBackgroundColor: nextColor,
    });
  }, [sticker, onUpdate, textBackgroundColor]);

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

  const resizeGestureStart = useRef({ scale: sticker.scale });
  const resizePanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gesture) => Math.abs(gesture.dx) > 2 || Math.abs(gesture.dy) > 2,
      onPanResponderGrant: () => {
        onDragStateChange?.(true);
        resizeGestureStart.current = { scale: scaleRef.current };
      },
      onPanResponderMove: (_, gesture) => {
        const delta = Math.max(gesture.dx, gesture.dy);
        const next = Math.max(0.4, Math.min(3, resizeGestureStart.current.scale + delta / 140));
        scaleRef.current = next;
        setCurrentScale(next);
      },
      onPanResponderRelease: () => {
        onDragStateChange?.(false);
        onUpdate({
          ...sticker,
          x: position.current.x,
          y: position.current.y,
          scale: scaleRef.current,
          rotation: rotationRef.current,
        });
      },
      onPanResponderTerminate: () => {
        onDragStateChange?.(false);
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
    opacity: stickerOpacity,
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

          {/* Delete */}
          <TouchableOpacity
            style={[styles.controlBtn, styles.deleteBtn]}
            onPress={() => onDelete(sticker.id)}
            accessibilityLabel={t('stickerDeleteA11y')}
            accessibilityRole="button"
          >
            <Text style={styles.controlText}>✕</Text>
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

          {isTextSticker ? (
            <>
              <TouchableOpacity
                style={styles.controlBtn}
                onPress={handleCycleTextColor}
                accessibilityLabel={t('stickerTextColorA11y')}
                accessibilityRole="button"
              >
                <MaterialCommunityIcons name="palette-outline" size={16} color="#FFFFFF" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.controlBtn}
                onPress={handleCycleOpacity}
                accessibilityLabel={t('stickerOpacityA11y')}
                accessibilityRole="button"
              >
                <MaterialCommunityIcons name="opacity" size={16} color="#FFFFFF" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.controlBtn}
                onPress={handleCycleTextBackground}
                accessibilityLabel={t('stickerTextBackgroundA11y')}
                accessibilityRole="button"
              >
                <MaterialCommunityIcons name="format-color-fill" size={16} color="#FFFFFF" />
              </TouchableOpacity>
            </>
          ) : null}

        </View>
      )}

      {/* Sticker body — tap to toggle selection */}
      <Animated.View style={stickerTransformStyle}>
        <View style={isEditable && isSelected && styles.selectionFrame}>
        <View
          accessibilityLabel={`Sticker${isEditable ? ', tap to select' : ''}`}
          accessibilityRole={isEditable ? 'button' : 'image'}
          {...panResponder.panHandlers}
        >
          {isTextSticker ? (
            isEditable && isSelected ? (
              <TextInput
                value={sticker.text ?? ''}
                onChangeText={handleChangeText}
                multiline
                autoFocus
                placeholder={t('stickerTextPlaceholder')}
                placeholderTextColor="rgba(17, 24, 39, 0.45)"
                style={[styles.textStickerInput, { backgroundColor: textBackgroundColor ?? 'transparent', color: textColor }, isSelected && styles.selectedOverlay]}
                accessibilityLabel={t('stickerTextInputA11y')}
              />
            ) : (
              <Text style={[styles.textSticker, { backgroundColor: textBackgroundColor ?? 'transparent', color: textColor }, isSelected && styles.emojiSelected]}>
                {sticker.text || t('stickerTextPlaceholder')}
              </Text>
            )
          ) : sticker.imageUri ? (
            <Image
              source={{ uri: sticker.imageUri }}
              style={[styles.photoStickerImage, { aspectRatio: photoAspectRatio }, isSelected && styles.selectedOverlay]}
              resizeMode="cover"
            />
          ) : stickerSource != null ? (
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
        </View>
      </Animated.View>
      {isEditable && isSelected ? (
        <View
          style={styles.resizeHandle}
          {...resizePanResponder.panHandlers}
          accessibilityLabel={t('stickerResizeA11y')}
          accessibilityRole="adjustable"
        >
          <MaterialCommunityIcons name="arrow-bottom-right" size={13} color="#FFFFFF" />
        </View>
      ) : null}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectionFrame: {
    borderWidth: 1,
    borderStyle: 'dotted',
    borderColor: 'rgba(51, 65, 85, 0.8)',
    borderRadius: 8,
    padding: 4,
  },
  resizeHandle: {
    position: 'absolute',
    right: -18,
    bottom: -18,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#334155',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    elevation: 10,
  },
  emoji: {
    fontSize: 48,
  },
  emojiSelected: {
    opacity: 0.85,
  },
  textSticker: {
    minWidth: 120,
    maxWidth: 220,
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 24,
    lineHeight: 30,
    fontWeight: '700',
    textAlign: 'center',
  },
  textStickerInput: {
    minWidth: 140,
    maxWidth: 240,
    minHeight: 44,
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 24,
    lineHeight: 30,
    fontWeight: '700',
    textAlign: 'center',
    borderWidth: 1,
    borderColor: 'rgba(15, 23, 42, 0.28)',
    borderRadius: 8,
  },
  stickerImage: {
    width: 80,
    height: 80,
  },
  photoStickerImage: {
    width: 148,
    maxHeight: 190,
    borderRadius: 8,
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
