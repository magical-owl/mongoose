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
 *   • Drag the selected dotted outline to resize
 *   • Send an individual sticker behind the text canvas
 *   • ✕ button to delete
 *
 * State persistence:
 *   All mutations (position, scale, rotation) are immediately propagated to
 *   the parent via onUpdate so the parent array stays up-to-date for saving.
 */

import React, { useRef, useState, useCallback, useEffect } from 'react';
import {
  Animated,
  PanResponder,
  TouchableOpacity,
  Text,
  TextInput,
  Image,
  View,
  StyleSheet,
  Keyboard,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { PlacedSticker, findStickerItem } from '../domain/Sticker';
import { useTranslation } from '@/localization/i18n';
import { useTheme } from '@/providers/ThemeProvider';
import { resolveImportedDiaryPhotoUri } from '@/features/diary/services/DiaryPhotoService';
import { DIARY_PHOTO_STICKER_BASE_WIDTH, DIARY_STICKER_BASE_SIZE } from '@/features/diary/domain/StickerLayout';

const DEFAULT_TEXT_STICKER_COLOR = '#DC2626';
const DEFAULT_TEXT_STICKER_BACKGROUND_COLOR = '#E5E7EB';
const TEXT_STICKER_COLORS = [DEFAULT_TEXT_STICKER_COLOR, '#111827', '#F8FAFC', '#2563EB', '#059669', '#D97706', '#7C3AED', '#DB2777'] as const;
const TEXT_STICKER_BACKGROUND_COLORS = [DEFAULT_TEXT_STICKER_BACKGROUND_COLOR, '#F8FAFC', '#FEF3C7', '#DBEAFE', '#DCFCE7', '#FCE7F3', '#EDE9FE', '#111827'] as const;
const STICKER_OPACITIES = [1, 0.75, 0.5, 0.3] as const;

interface StickerCanvasItemProps {
  readonly sticker: PlacedSticker;
  readonly onUpdate: (updated: PlacedSticker) => void;
  readonly onDelete: (id: string) => void;
  readonly isEditable?: boolean;
  readonly onDragStateChange?: (isDragging: boolean) => void;
  readonly bounds?: {
    readonly width: number;
    readonly height: number;
  };
}

export const StickerCanvasItem: React.FC<StickerCanvasItemProps> = ({
  sticker,
  onUpdate,
  onDelete,
  isEditable = true,
  onDragStateChange,
  bounds,
}) => {
  const t = useTranslation();
  const theme = useTheme();
  const [isSelected, setIsSelected] = useState(isEditable && sticker.text !== undefined && sticker.text.length === 0);
  const [showTextOptions, setShowTextOptions] = useState(false);
  const selectedRef = useRef(false);
  const stickerRef = useRef(sticker);
  stickerRef.current = sticker;
  // Local mutable state — initialised from persisted values
  const [currentScale, setCurrentScale] = useState(sticker.scale);
  const [currentRotation, setCurrentRotation] = useState(sticker.rotation);
  const [draftText, setDraftText] = useState(sticker.text ?? '');
  const draftTextRef = useRef(sticker.text ?? '');

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
  const textColor = sticker.textColor ?? DEFAULT_TEXT_STICKER_COLOR;
  const textBackgroundColor = sticker.textBackgroundColor ?? DEFAULT_TEXT_STICKER_BACKGROUND_COLOR;
  const stickerOpacity = sticker.opacity ?? 1;

  const getStickerVisualSize = useCallback(() => {
    if (isTextSticker) return { width: 160, height: 54 };
    if (stickerRef.current.imageUri) {
      return { width: DIARY_PHOTO_STICKER_BASE_WIDTH, height: DIARY_PHOTO_STICKER_BASE_WIDTH / photoAspectRatio };
    }
    return { width: DIARY_STICKER_BASE_SIZE, height: DIARY_STICKER_BASE_SIZE };
  }, [isTextSticker, photoAspectRatio]);

  const clampPosition = useCallback((x: number, y: number) => {
    if (!bounds) return { x, y };
    const visualSize = getStickerVisualSize();
    const maxX = Math.max(0, bounds.width - visualSize.width * scaleRef.current);
    const maxY = Math.max(0, bounds.height - visualSize.height * scaleRef.current);
    return {
      x: Math.max(0, Math.min(maxX, x)),
      y: Math.max(0, Math.min(maxY, y)),
    };
  }, [bounds, getStickerVisualSize]);

  useEffect(() => {
    if (sticker.text === undefined || sticker.text === draftTextRef.current) return;
    draftTextRef.current = sticker.text;
    setDraftText(sticker.text);
  }, [sticker.text]);

  const buildUpdatedSticker = (changes: Partial<PlacedSticker>): PlacedSticker => ({
    ...stickerRef.current,
    ...(stickerRef.current.text !== undefined ? { text: draftTextRef.current } : {}),
    x: position.current.x,
    y: position.current.y,
    scale: scaleRef.current,
    rotation: rotationRef.current,
    ...changes,
  });

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
        setShowTextOptions(false);
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
        const nextPosition = clampPosition(position.current.x + gs.dx, position.current.y + gs.dy);
        const newX = nextPosition.x;
        const newY = nextPosition.y;
        position.current = { x: newX, y: newY };
        pan.setValue({ x: newX, y: newY });

        // Use refs here — closure was created once, refs always hold latest values
        onUpdate(buildUpdatedSticker({ x: newX, y: newY }));
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
    onUpdate(buildUpdatedSticker({ rotation: next }));
  }, [onUpdate]);

  const handleToggleBehindText = useCallback(() => {
    // Release the editing layer immediately so the new stack order is visible.
    setShowTextOptions(false);
    setIsSelected(false);
    onUpdate(buildUpdatedSticker({ behindText: !stickerRef.current.behindText }));
  }, [onUpdate]);

  const handleChangeText = useCallback((text: string) => {
    draftTextRef.current = text;
    setDraftText(text);
    onUpdate(buildUpdatedSticker({ text }));
  }, [onUpdate]);

  const handleFinishTextEditing = useCallback(() => {
    Keyboard.dismiss();
    setShowTextOptions(false);
    setIsSelected(false);
    if (stickerRef.current.text !== undefined) {
      onUpdate(buildUpdatedSticker({ text: draftTextRef.current }));
    }
  }, [onUpdate]);

  const handleFinishSelection = useCallback(() => {
    if (stickerRef.current.text !== undefined) {
      handleFinishTextEditing();
      return;
    }
    setShowTextOptions(false);
    setIsSelected(false);
    onUpdate(buildUpdatedSticker({}));
  }, [handleFinishTextEditing, onUpdate]);

  const handleDelete = useCallback(() => {
    setShowTextOptions(false);
    onDelete(stickerRef.current.id);
  }, [onDelete]);

  const handleCycleTextColor = useCallback(() => {
    const currentIndex = TEXT_STICKER_COLORS.findIndex((color) => color === textColor);
    const nextColor = TEXT_STICKER_COLORS[(currentIndex + 1) % TEXT_STICKER_COLORS.length] ?? TEXT_STICKER_COLORS[0];
    onUpdate(buildUpdatedSticker({ textColor: nextColor }));
  }, [onUpdate, textColor]);

  const handleCycleOpacity = useCallback(() => {
    const currentIndex = STICKER_OPACITIES.findIndex((opacity) => opacity === stickerOpacity);
    const nextOpacity = STICKER_OPACITIES[(currentIndex + 1) % STICKER_OPACITIES.length] ?? STICKER_OPACITIES[0];
    onUpdate(buildUpdatedSticker({ opacity: nextOpacity }));
  }, [onUpdate, stickerOpacity]);

  const handleCycleTextBackground = useCallback(() => {
    const currentIndex = TEXT_STICKER_BACKGROUND_COLORS.findIndex((color) => color === textBackgroundColor);
    const nextColor = TEXT_STICKER_BACKGROUND_COLORS[(currentIndex + 1) % TEXT_STICKER_BACKGROUND_COLORS.length];
    onUpdate(buildUpdatedSticker({ textBackgroundColor: nextColor }));
  }, [onUpdate, textBackgroundColor]);

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
        onUpdate(buildUpdatedSticker({ rotation: next }));
      },
      onPanResponderRelease: () => {
        if (!rotateGestureStart.current.moved) handleRotate();
      },
    })
  ).current;

  const createResizePanResponder = (horizontalMultiplier: number, verticalMultiplier: number) => PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: (_, gesture) => Math.abs(gesture.dx) > 2 || Math.abs(gesture.dy) > 2,
    onPanResponderGrant: () => {
      onDragStateChange?.(true);
      resizeGestureStart.current = { scale: scaleRef.current };
    },
    onPanResponderMove: (_, gesture) => {
      const horizontalDelta = gesture.dx * horizontalMultiplier;
      const verticalDelta = gesture.dy * verticalMultiplier;
      const delta = Math.abs(horizontalDelta) > Math.abs(verticalDelta) ? horizontalDelta : verticalDelta;
      const next = Math.max(0.4, Math.min(3, resizeGestureStart.current.scale + delta / 140));
      scaleRef.current = next;
      setCurrentScale(next);
    },
    onPanResponderRelease: () => {
      onDragStateChange?.(false);
      const nextPosition = clampPosition(position.current.x, position.current.y);
      position.current = nextPosition;
      pan.setValue(nextPosition);
      onUpdate(buildUpdatedSticker(nextPosition));
    },
    onPanResponderTerminate: () => {
      onDragStateChange?.(false);
    },
  });

  const resizeGestureStart = useRef({ scale: sticker.scale });
  const resizeTopPanResponder = useRef(createResizePanResponder(0, -1)).current;
  const resizeRightPanResponder = useRef(createResizePanResponder(1, 0)).current;
  const resizeBottomPanResponder = useRef(createResizePanResponder(0, 1)).current;
  const resizeLeftPanResponder = useRef(createResizePanResponder(-1, 0)).current;

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
  const controlsShouldSitBelow = position.current.y < (showTextOptions ? 112 : 62);

  return (
    <Animated.View
      style={[styles.container, positionStyle]}
    >
      {/* Control strip (only when selected and editable) */}
      {isEditable && isSelected && (
        <View
          style={[
            styles.controls,
            showTextOptions && styles.controlsExpanded,
            controlsShouldSitBelow && styles.controlsBelow,
            controlsShouldSitBelow && showTextOptions && styles.controlsBelowExpanded,
          ]}
        >
          {isTextSticker && showTextOptions ? (
            <View style={styles.secondaryControls}>
              <TouchableOpacity
                style={[styles.controlBtn, { backgroundColor: theme.colors.stickerControl }]}
                onPress={handleCycleTextColor}
                accessibilityLabel={t('stickerTextColorA11y')}
                accessibilityRole="button"
              >
                <MaterialCommunityIcons name="palette-outline" size={16} color={theme.colors.stickerControlText} />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.controlBtn, { backgroundColor: theme.colors.stickerControl }]}
                onPress={handleCycleOpacity}
                accessibilityLabel={t('stickerOpacityA11y')}
                accessibilityRole="button"
              >
                <MaterialCommunityIcons name="opacity" size={16} color={theme.colors.stickerControlText} />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.controlBtn, { backgroundColor: theme.colors.stickerControl }]}
                onPress={handleCycleTextBackground}
                accessibilityLabel={t('stickerTextBackgroundA11y')}
                accessibilityRole="button"
              >
                <MaterialCommunityIcons name="format-color-fill" size={16} color={theme.colors.stickerControlText} />
              </TouchableOpacity>
            </View>
          ) : null}

          <View style={styles.primaryControls}>
            <TouchableOpacity
              style={[styles.controlBtn, { backgroundColor: theme.colors.stickerControl }]}
              onPress={handleFinishSelection}
              accessibilityLabel={t('entrySaveA11y')}
              accessibilityRole="button"
            >
              <MaterialCommunityIcons name="check" size={19} color={theme.colors.stickerControlText} />
            </TouchableOpacity>

            <View
              style={[styles.controlBtn, { backgroundColor: theme.colors.stickerControl }]}
              {...rotatePanResponder.panHandlers}
              accessibilityLabel={t('stickerRotateA11y')}
              accessibilityRole="button"
            >
              <MaterialCommunityIcons name="rotate-right" size={18} color={theme.colors.stickerControlText} />
            </View>

            <TouchableOpacity
              style={[
                styles.controlBtn,
                { backgroundColor: sticker.behindText ? theme.colors.stickerControlActive : theme.colors.stickerControl },
              ]}
              onPress={handleToggleBehindText}
              accessibilityLabel={sticker.behindText ? t('stickerBringForwardA11y') : t('stickerSendBehindA11y')}
              accessibilityRole="button"
            >
              <MaterialCommunityIcons
                name={sticker.behindText ? 'layers' : 'layers-minus'}
                size={18}
                color={theme.colors.stickerControlText}
              />
            </TouchableOpacity>

            {isTextSticker ? (
              <TouchableOpacity
                style={[
                  styles.controlBtn,
                  { backgroundColor: showTextOptions ? theme.colors.stickerControlActive : theme.colors.stickerControl },
                ]}
                onPress={() => setShowTextOptions((current) => !current)}
                accessibilityLabel={t('stickerOptionsA11y')}
                accessibilityRole="button"
                accessibilityState={{ expanded: showTextOptions }}
              >
                <MaterialCommunityIcons name="dots-horizontal" size={20} color={theme.colors.stickerControlText} />
              </TouchableOpacity>
            ) : null}

            <TouchableOpacity
              style={[styles.controlBtn, { backgroundColor: theme.colors.stickerControlDestructive }]}
              onPress={handleDelete}
              accessibilityLabel={t('stickerDeleteA11y')}
              accessibilityRole="button"
            >
              <MaterialCommunityIcons name="close" size={19} color={theme.colors.stickerControlText} />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Sticker body — tap to toggle selection */}
      <Animated.View style={stickerTransformStyle}>
        <View style={isEditable && isSelected && [styles.selectionFrame, { borderColor: theme.colors.stickerSelectionOutline }]}>
          <View
            accessibilityLabel={`Sticker${isEditable ? ', tap to select' : ''}`}
            accessibilityRole={isEditable ? 'button' : 'image'}
            {...panResponder.panHandlers}
          >
            {isTextSticker ? (
              isEditable && isSelected ? (
                <TextInput
                  value={draftText}
                  onChangeText={handleChangeText}
                  multiline
                  autoFocus
                  placeholder={t('stickerTextPlaceholder')}
                  placeholderTextColor="rgba(17, 24, 39, 0.45)"
                  style={[styles.textStickerInput, { backgroundColor: textBackgroundColor, color: textColor }, isSelected && styles.selectedOverlay]}
                  accessibilityLabel={t('stickerTextInputA11y')}
                />
              ) : (
                <Text style={[styles.textSticker, { backgroundColor: textBackgroundColor, color: textColor }, isSelected && styles.emojiSelected]}>
                  {sticker.text || t('stickerTextPlaceholder')}
                </Text>
              )
            ) : sticker.imageUri ? (
              <Image
                source={{ uri: resolveImportedDiaryPhotoUri(sticker.imageUri) }}
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
          {isEditable && isSelected ? (
            <>
              <View
                style={[styles.resizeOutlineTouchTarget, styles.resizeOutlineTop]}
                {...resizeTopPanResponder.panHandlers}
                accessibilityLabel={t('stickerResizeA11y')}
                accessibilityRole="adjustable"
              />
              <View
                style={[styles.resizeOutlineTouchTarget, styles.resizeOutlineRight]}
                {...resizeRightPanResponder.panHandlers}
                accessibilityLabel={t('stickerResizeA11y')}
                accessibilityRole="adjustable"
              />
              <View
                style={[styles.resizeOutlineTouchTarget, styles.resizeOutlineBottom]}
                {...resizeBottomPanResponder.panHandlers}
                accessibilityLabel={t('stickerResizeA11y')}
                accessibilityRole="adjustable"
              />
              <View
                style={[styles.resizeOutlineTouchTarget, styles.resizeOutlineLeft]}
                {...resizeLeftPanResponder.panHandlers}
                accessibilityLabel={t('stickerResizeA11y')}
                accessibilityRole="adjustable"
              />
            </>
          ) : null}
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
  selectionFrame: {
    borderWidth: 1,
    borderStyle: 'dotted',
    borderColor: 'rgba(51, 65, 85, 0.8)',
    padding: 4,
  },
  resizeOutlineTouchTarget: {
    position: 'absolute',
    zIndex: 2,
  },
  resizeOutlineTop: {
    top: -12,
    left: -12,
    right: -12,
    height: 24,
  },
  resizeOutlineRight: {
    top: -12,
    right: -12,
    bottom: -12,
    width: 24,
  },
  resizeOutlineBottom: {
    left: -12,
    right: -12,
    bottom: -12,
    height: 24,
  },
  resizeOutlineLeft: {
    top: -12,
    left: -12,
    bottom: -12,
    width: 24,
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
    width: DIARY_STICKER_BASE_SIZE,
    height: DIARY_STICKER_BASE_SIZE,
  },
  photoStickerImage: {
    width: DIARY_PHOTO_STICKER_BASE_WIDTH,
    maxHeight: 190,
    borderRadius: 8,
  },
  selectedOverlay: {
    opacity: 0.85,
  },
  controls: {
    position: 'absolute',
    top: -52,
    gap: 6,
    alignItems: 'center',
    zIndex: 1000,
    elevation: 10,
  },
  controlsExpanded: {
    top: -102,
  },
  controlsBelow: {
    top: undefined,
    bottom: -52,
    flexDirection: 'column-reverse',
  },
  controlsBelowExpanded: {
    bottom: -102,
  },
  primaryControls: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
  },
  secondaryControls: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
  },
  controlBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
