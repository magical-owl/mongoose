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
 *   • Drag any selected-frame handle to resize
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
import { PlacedSticker, findStickerItem, type PhotoStickerShape } from '../domain/Sticker';
import { useTranslation } from '@/localization/i18n';
import { useTheme } from '@/providers/ThemeProvider';
import { getDiaryPhotoImageSource } from '@/features/diary/services/DiaryPhotoService';
import {
  DIARY_PHOTO_STICKER_BASE_WIDTH,
  DIARY_STICKER_BASE_SIZE,
  DIARY_TEXT_STICKER_BASE_HEIGHT,
  DIARY_TEXT_STICKER_BASE_WIDTH,
  clampStickerPosition,
  getStickerVisualSize,
} from '@/features/diary/domain/StickerLayout';

const DEFAULT_TEXT_STICKER_COLOR = '#DC2626';
const DEFAULT_TEXT_STICKER_BACKGROUND_COLOR = '#E5E7EB';
const TEXT_STICKER_COLORS = [DEFAULT_TEXT_STICKER_COLOR, '#111827', '#F8FAFC', '#2563EB', '#059669', '#D97706', '#7C3AED', '#DB2777'] as const;
const TEXT_STICKER_BACKGROUND_COLORS = [DEFAULT_TEXT_STICKER_BACKGROUND_COLOR, '#F8FAFC', '#FEF3C7', '#DBEAFE', '#DCFCE7', '#FCE7F3', '#EDE9FE', '#111827'] as const;
const STICKER_OPACITIES = [1, 0.75, 0.5, 0.3] as const;
const STICKER_CONTROL_SIZE = 34;
const STICKER_CONTROL_GAP = 4;
const STICKER_CONTROL_OFFSET = 46;
const STICKER_CONTROL_EDGE_SPACE = 12;
const PHOTO_STICKER_SHAPES: readonly PhotoStickerShape[] = ['rectangle', 'rounded', 'circle', 'oval'];

function getPhotoStickerBorderRadius(shape: PhotoStickerShape, width: number, height: number): number {
  if (shape === 'rectangle') return 8;
  if (shape === 'rounded') return 24;
  return Math.min(width, height) / 2;
}

interface StickerCanvasItemProps {
  readonly sticker: PlacedSticker;
  readonly onUpdate: (updated: PlacedSticker) => void;
  readonly onDelete: (id: string) => void;
  readonly isEditable?: boolean;
  readonly isSelected?: boolean;
  readonly onSelect?: (id: string) => void;
  readonly onDeselect?: () => void;
  readonly onDragStateChange?: (isDragging: boolean) => void;
  readonly bounds?: {
    readonly width: number;
    readonly height: number;
  };
  readonly allowBottomOverflow?: boolean;
  readonly horizontalEdgeAllowanceRatio?: number;
  readonly testID?: string;
}

export const StickerCanvasItem: React.FC<StickerCanvasItemProps> = ({
  sticker,
  onUpdate,
  onDelete,
  isEditable = true,
  isSelected: controlledIsSelected,
  onSelect,
  onDeselect,
  onDragStateChange,
  bounds,
  allowBottomOverflow = false,
  horizontalEdgeAllowanceRatio,
  testID,
}) => {
  const t = useTranslation();
  const theme = useTheme();
  const [localIsSelected, setLocalIsSelected] = useState(isEditable && sticker.text !== undefined && sticker.text.length === 0);
  const [showTextOptions, setShowTextOptions] = useState(false);
  const selectedRef = useRef(false);
  const stickerRef = useRef(sticker);
  stickerRef.current = sticker;
  const isSelected = controlledIsSelected ?? localIsSelected;
  const setStickerSelected = useCallback((selected: boolean) => {
    if (selected) {
      onSelect?.(stickerRef.current.id);
    } else {
      onDeselect?.();
    }
    if (controlledIsSelected === undefined) {
      setLocalIsSelected(selected);
    }
  }, [controlledIsSelected, onDeselect, onSelect]);
  const boundsRef = useRef(bounds);
  boundsRef.current = bounds;
  const allowBottomOverflowRef = useRef(allowBottomOverflow);
  allowBottomOverflowRef.current = allowBottomOverflow;
  const horizontalEdgeAllowanceRatioRef = useRef(horizontalEdgeAllowanceRatio);
  horizontalEdgeAllowanceRatioRef.current = horizontalEdgeAllowanceRatio;
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
  const photoStickerSource = sticker.imageUri ? getDiaryPhotoImageSource(sticker.imageUri) : undefined;
  const photoShape: PhotoStickerShape = sticker.imageShape ?? 'rectangle';
  const textColor = sticker.textColor ?? DEFAULT_TEXT_STICKER_COLOR;
  const textBackgroundColor = sticker.textBackgroundColor ?? DEFAULT_TEXT_STICKER_BACKGROUND_COLOR;
  const stickerOpacity = sticker.opacity ?? 1;
  const stickerLayerIndex = sticker.zIndex ?? 1;

  const clampPosition = useCallback((x: number, y: number) => {
    return clampStickerPosition(
      { x, y },
      stickerRef.current,
      boundsRef.current,
      scaleRef.current,
      {
        allowBottomOverflow: allowBottomOverflowRef.current,
        horizontalEdgeAllowanceRatio: horizontalEdgeAllowanceRatioRef.current,
      },
    );
  }, []);

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
        setStickerSelected(false); // hide controls while dragging
      },

      onPanResponderMove: (_, gesture) => {
        if (Math.abs(gesture.dx) > 4 || Math.abs(gesture.dy) > 4) dragMoved.current = true;
        pan.setValue({ x: gesture.dx, y: gesture.dy });
      },

      onPanResponderRelease: (_, gs) => {
        onDragStateChange?.(false);
        pan.flattenOffset();
        if (!dragMoved.current) {
          setStickerSelected(!selectedRef.current);
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
    setStickerSelected(false);
    onUpdate(buildUpdatedSticker({ behindText: !stickerRef.current.behindText }));
  }, [onUpdate, setStickerSelected]);

  const handleChangeText = useCallback((text: string) => {
    draftTextRef.current = text;
    setDraftText(text);
    onUpdate(buildUpdatedSticker({ text }));
  }, [onUpdate]);

  const handleFinishTextEditing = useCallback(() => {
    Keyboard.dismiss();
    setShowTextOptions(false);
    setStickerSelected(false);
    if (stickerRef.current.text !== undefined) {
      onUpdate(buildUpdatedSticker({ text: draftTextRef.current }));
    }
  }, [onUpdate, setStickerSelected]);

  const handleFinishSelection = useCallback(() => {
    if (stickerRef.current.text !== undefined) {
      handleFinishTextEditing();
      return;
    }
    setShowTextOptions(false);
    setStickerSelected(false);
    onUpdate(buildUpdatedSticker({}));
  }, [handleFinishTextEditing, onUpdate, setStickerSelected]);

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

  const handleCyclePhotoShape = useCallback(() => {
    const currentIndex = PHOTO_STICKER_SHAPES.findIndex((shape) => shape === (stickerRef.current.imageShape ?? 'rectangle'));
    const nextShape = PHOTO_STICKER_SHAPES[(currentIndex + 1) % PHOTO_STICKER_SHAPES.length] ?? 'rectangle';
    onUpdate(buildUpdatedSticker({ imageShape: nextShape }));
  }, [onUpdate]);

  const rotateGestureStart = useRef({ rotation: sticker.rotation, moved: false });
  const rotatePanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onStartShouldSetPanResponderCapture: () => true,
      onMoveShouldSetPanResponder: (_, gesture) => Math.abs(gesture.dx) > 2 || Math.abs(gesture.dy) > 2,
      onMoveShouldSetPanResponderCapture: (_, gesture) => Math.abs(gesture.dx) > 2 || Math.abs(gesture.dy) > 2,
      onPanResponderGrant: () => {
        onDragStateChange?.(true);
        rotateGestureStart.current = { rotation: rotationRef.current, moved: false };
      },
      onPanResponderMove: (_, gesture) => {
        if (Math.abs(gesture.dx) < 2 && Math.abs(gesture.dy) < 2) return;
        rotateGestureStart.current.moved = true;
        const next = rotateGestureStart.current.rotation - gesture.dx * 0.75;
        rotationRef.current = next;
        setCurrentRotation(next);
        onUpdate(buildUpdatedSticker({ rotation: next }));
      },
      onPanResponderRelease: () => {
        onDragStateChange?.(false);
        if (!rotateGestureStart.current.moved) handleRotate();
      },
      onPanResponderTerminate: () => {
        onDragStateChange?.(false);
      },
      onPanResponderTerminationRequest: () => false,
      onShouldBlockNativeResponder: () => true,
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
  const resizeTopLeftPanResponder = useRef(createResizePanResponder(-1, -1)).current;
  const resizeTopPanResponder = useRef(createResizePanResponder(0, -1)).current;
  const resizeTopRightPanResponder = useRef(createResizePanResponder(1, -1)).current;
  const resizeRightPanResponder = useRef(createResizePanResponder(1, 0)).current;
  const resizeBottomLeftPanResponder = useRef(createResizePanResponder(-1, 1)).current;
  const resizeBottomPanResponder = useRef(createResizePanResponder(0, 1)).current;
  const resizeBottomRightPanResponder = useRef(createResizePanResponder(1, 1)).current;
  const resizeLeftPanResponder = useRef(createResizePanResponder(-1, 0)).current;

  const stickerCanvasLayerIndex = sticker.behindText ? 1 : stickerLayerIndex + 3;
  const activeStickerCanvasLayerIndex = isSelected ? 999 : stickerCanvasLayerIndex;
  const positionStyle = {
    transform: [
      { translateX: pan.x },
      { translateY: pan.y },
    ],
    zIndex: activeStickerCanvasLayerIndex,
    elevation: activeStickerCanvasLayerIndex,
  };

  const stickerTransformStyle = {
    transform: [
      { scale: currentScale },
      { rotate: `${currentRotation}deg` },
    ],
    opacity: stickerOpacity,
  };
  const stickerVisualSize = getStickerVisualSize(sticker);
  const scaledStickerWidth = stickerVisualSize.width * currentScale;
  const scaledStickerHeight = stickerVisualSize.height * currentScale;
  const selectionFrameStyle = {
    width: scaledStickerWidth,
    height: scaledStickerHeight,
    left: -(scaledStickerWidth - stickerVisualSize.width) / 2,
    top: -(scaledStickerHeight - stickerVisualSize.height) / 2,
    transform: [{ rotate: `${currentRotation}deg` }],
  };
  const isPhotoSticker = Boolean(sticker.imageUri);
  const primaryControlCount = isTextSticker ? 5 : isPhotoSticker ? 5 : 4;
  const primaryControlsWidth = primaryControlCount * STICKER_CONTROL_SIZE + (primaryControlCount - 1) * STICKER_CONTROL_GAP;
  const stickerRightEdge = position.current.x + stickerVisualSize.width * currentScale;
  const stickerBottomEdge = position.current.y + stickerVisualSize.height * currentScale;
  const shouldPlaceControlsAbove = bounds
    ? stickerBottomEdge + STICKER_CONTROL_OFFSET > bounds.height - STICKER_CONTROL_EDGE_SPACE
    : false;
  const shouldAnchorControlsLeft = position.current.x < primaryControlsWidth / 2;
  const shouldAnchorControlsRight = bounds
    ? stickerRightEdge + primaryControlsWidth / 2 > bounds.width - STICKER_CONTROL_EDGE_SPACE
    : false;
  const primaryControlsPositionStyle = [
    styles.primaryControls,
    shouldPlaceControlsAbove ? styles.primaryControlsAbove : styles.primaryControlsBelow,
    shouldAnchorControlsLeft
      ? styles.primaryControlsLeft
      : shouldAnchorControlsRight
        ? styles.primaryControlsRight
        : styles.primaryControlsCenter,
  ];

  return (
    <Animated.View
      style={[styles.container, positionStyle]}
      testID={testID}
    >
      {isEditable && isSelected && (
        <View style={styles.textControlsWrap} pointerEvents="box-none">
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
        </View>
      )}

      <View style={[styles.stickerBodyFrame, { width: stickerVisualSize.width, height: stickerVisualSize.height }]}>
        {/* Sticker body — tap to toggle selection */}
        <Animated.View style={[styles.stickerBody, stickerTransformStyle]}>
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
              photoStickerSource ? (
                <Image
                  source={photoStickerSource}
                  style={[
                    styles.photoStickerImage,
                    {
                      width: stickerVisualSize.width,
                      height: stickerVisualSize.height,
                      borderRadius: getPhotoStickerBorderRadius(photoShape, stickerVisualSize.width, stickerVisualSize.height),
                    },
                    isSelected && styles.selectedOverlay,
                  ]}
                  resizeMode="cover"
                />
              ) : null
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
        </Animated.View>
        {isEditable && isSelected ? (
          <Animated.View
            style={[
              styles.selectionFrame,
              selectionFrameStyle,
              { borderColor: theme.colors.stickerSelectionOutline },
            ]}
            pointerEvents="box-none"
          >
            <View
              style={[styles.cornerHandle, styles.cornerTopLeft, { borderColor: theme.colors.stickerSelectionOutline }]}
              {...resizeTopLeftPanResponder.panHandlers}
              accessibilityLabel={t('stickerResizeA11y')}
              accessibilityRole="adjustable"
              testID={testID ? `${testID}-corner-top-left` : undefined}
            />
            <View
              style={[styles.sideHandle, styles.sideTop, { borderColor: theme.colors.stickerSelectionOutline }]}
              {...resizeTopPanResponder.panHandlers}
              accessibilityLabel={t('stickerResizeA11y')}
              accessibilityRole="adjustable"
              testID={testID ? `${testID}-side-top` : undefined}
            />
            <View
              style={[styles.cornerHandle, styles.cornerTopRight, { borderColor: theme.colors.stickerSelectionOutline }]}
              {...resizeTopRightPanResponder.panHandlers}
              accessibilityLabel={t('stickerResizeA11y')}
              accessibilityRole="adjustable"
              testID={testID ? `${testID}-corner-top-right` : undefined}
            />
            <View
              style={[styles.sideHandle, styles.sideRight, { borderColor: theme.colors.stickerSelectionOutline }]}
              {...resizeRightPanResponder.panHandlers}
              accessibilityLabel={t('stickerResizeA11y')}
              accessibilityRole="adjustable"
              testID={testID ? `${testID}-side-right` : undefined}
            />
            <View
              style={[styles.cornerHandle, styles.cornerBottomLeft, { borderColor: theme.colors.stickerSelectionOutline }]}
              {...resizeBottomLeftPanResponder.panHandlers}
              accessibilityLabel={t('stickerResizeA11y')}
              accessibilityRole="adjustable"
              testID={testID ? `${testID}-corner-bottom-left` : undefined}
            />
            <View
              style={[styles.sideHandle, styles.sideBottom, { borderColor: theme.colors.stickerSelectionOutline }]}
              {...resizeBottomPanResponder.panHandlers}
              accessibilityLabel={t('stickerResizeA11y')}
              accessibilityRole="adjustable"
              testID={testID ? `${testID}-side-bottom` : undefined}
            />
            <View
              style={[styles.cornerHandle, styles.cornerBottomRight, { borderColor: theme.colors.stickerSelectionOutline }]}
              {...resizeBottomRightPanResponder.panHandlers}
              accessibilityLabel={t('stickerResizeA11y')}
              accessibilityRole="adjustable"
              testID={testID ? `${testID}-corner-bottom-right` : undefined}
            />
            <View
              style={[styles.sideHandle, styles.sideLeft, { borderColor: theme.colors.stickerSelectionOutline }]}
              {...resizeLeftPanResponder.panHandlers}
              accessibilityLabel={t('stickerResizeA11y')}
              accessibilityRole="adjustable"
              testID={testID ? `${testID}-side-left` : undefined}
            />
            <View style={styles.frameControls} pointerEvents="box-none">
              <View style={primaryControlsPositionStyle}>
                <TouchableOpacity
                  style={[styles.controlBtn, { backgroundColor: theme.colors.stickerControl }]}
                  onPress={handleFinishSelection}
                  accessibilityLabel={t('entrySaveA11y')}
                  accessibilityRole="button"
                >
                  <MaterialCommunityIcons name="check" size={16} color={theme.colors.stickerControlText} />
                </TouchableOpacity>
                <View
                  style={[styles.controlBtn, { backgroundColor: theme.colors.stickerControl }]}
                  {...rotatePanResponder.panHandlers}
                  accessibilityLabel={t('stickerRotateA11y')}
                  accessibilityRole="button"
                >
                  <MaterialCommunityIcons name="rotate-right" size={15} color={theme.colors.stickerControlText} />
                </View>
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
                    <MaterialCommunityIcons name="dots-horizontal" size={17} color={theme.colors.stickerControlText} />
                  </TouchableOpacity>
                ) : null}
                {isPhotoSticker ? (
                  <TouchableOpacity
                    style={[styles.controlBtn, { backgroundColor: theme.colors.stickerControl }]}
                    onPress={handleCyclePhotoShape}
                    accessibilityLabel={t('stickerPhotoShapeA11y')}
                    accessibilityRole="button"
                  >
                    <MaterialCommunityIcons name="shape-outline" size={16} color={theme.colors.stickerControlText} />
                  </TouchableOpacity>
                ) : null}
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
                    size={15}
                    color={theme.colors.stickerControlText}
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.controlBtn, { backgroundColor: theme.colors.stickerControlDestructive }]}
                  onPress={handleDelete}
                  accessibilityLabel={t('stickerDeleteA11y')}
                  accessibilityRole="button"
                >
                  <MaterialCommunityIcons name="close" size={16} color={theme.colors.stickerControlText} />
                </TouchableOpacity>
              </View>
            </View>
          </Animated.View>
        ) : null}
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stickerBodyFrame: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stickerBody: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectionFrame: {
    position: 'absolute',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: 'rgba(51, 65, 85, 0.8)',
  },
  frameControls: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    zIndex: 4,
    elevation: 4,
  },
  primaryControls: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    gap: STICKER_CONTROL_GAP,
  },
  primaryControlsAbove: {
    top: -STICKER_CONTROL_OFFSET,
  },
  primaryControlsBelow: {
    bottom: -STICKER_CONTROL_OFFSET,
  },
  primaryControlsCenter: {
    alignSelf: 'center',
  },
  primaryControlsLeft: {
    left: 0,
  },
  primaryControlsRight: {
    right: 0,
  },
  textControlsWrap: {
    position: 'absolute',
    top: -44,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 1000,
    elevation: 10,
  },
  cornerHandle: {
    position: 'absolute',
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    backgroundColor: '#F8FAFC',
    zIndex: 5,
    elevation: 5,
  },
  cornerTopLeft: {
    top: -9,
    left: -9,
  },
  cornerTopRight: {
    top: -9,
    right: -9,
  },
  cornerBottomLeft: {
    bottom: -9,
    left: -9,
  },
  cornerBottomRight: {
    right: -9,
    bottom: -9,
  },
  sideHandle: {
    position: 'absolute',
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    backgroundColor: '#F8FAFC',
    zIndex: 5,
    elevation: 5,
  },
  sideTop: {
    top: -7,
    left: '50%',
    marginLeft: -7,
  },
  sideRight: {
    right: -7,
    top: '50%',
    marginTop: -7,
  },
  sideBottom: {
    bottom: -7,
    left: '50%',
    marginLeft: -7,
  },
  sideLeft: {
    left: -7,
    top: '50%',
    marginTop: -7,
  },
  emoji: {
    fontSize: 48,
  },
  emojiSelected: {
    opacity: 0.85,
  },
  textSticker: {
    minWidth: 120,
    width: DIARY_TEXT_STICKER_BASE_WIDTH,
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
    width: DIARY_TEXT_STICKER_BASE_WIDTH,
    maxWidth: 240,
    minHeight: DIARY_TEXT_STICKER_BASE_HEIGHT,
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
  secondaryControls: {
    flexDirection: 'row',
    gap: 4,
    alignItems: 'center',
  },
  controlBtn: {
    width: STICKER_CONTROL_SIZE,
    height: STICKER_CONTROL_SIZE,
    borderRadius: STICKER_CONTROL_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
