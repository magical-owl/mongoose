/**
 * Modal / Bottom Sheet Component
 *
 * A themed modal with slide-up panel, drag handle, backdrop, and optional title.
 */

import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Dimensions,
  Modal as RNModal,
  PanResponder,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@providers/ThemeProvider';
import { Text } from './Text';

export interface ModalProps {
  readonly visible: boolean;
  readonly onDismiss: () => void;
  readonly title?: string;
  readonly children: React.ReactNode;
  readonly accessibilityLabel?: string;
  /** Disable the body ScrollView when children provide their own virtualized list. */
  readonly scrollable?: boolean;
}

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const PANEL_HEIGHT = SCREEN_HEIGHT * 0.75;
const DRAG_THRESHOLD = 100;

export function Modal({
  visible,
  onDismiss,
  title,
  children,
  accessibilityLabel,
  scrollable = true,
}: ModalProps): React.JSX.Element | null {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const translateY = useRef(new Animated.Value(PANEL_HEIGHT)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(translateY, { toValue: 0, duration: 300, useNativeDriver: true }),
        Animated.timing(backdropOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
      ]).start();
    } else {
      translateY.setValue(PANEL_HEIGHT);
      backdropOpacity.setValue(0);
    }
  }, [visible, translateY, backdropOpacity]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gs) => gs.dy > 5,
      onPanResponderMove: (_, gs) => {
        if (gs.dy > 0) {
          translateY.setValue(gs.dy);
        }
      },
      onPanResponderRelease: (_, gs) => {
        if (gs.dy > DRAG_THRESHOLD || gs.vy > 0.5) {
          Animated.timing(translateY, { toValue: PANEL_HEIGHT, duration: 200, useNativeDriver: true }).start(onDismiss);
        } else {
          Animated.spring(translateY, { toValue: 0, useNativeDriver: true }).start();
        }
      },
    })
  ).current;

  if (!visible) return null;

  return (
    <RNModal transparent visible={visible} animationType="none" onRequestClose={onDismiss}>
      <View style={StyleSheet.absoluteFill}>
        <TouchableWithoutFeedback onPress={onDismiss} accessibilityLabel="Close modal">
          <Animated.View style={{ flex: 1, backgroundColor: theme.colors.overlay, opacity: backdropOpacity }} />
        </TouchableWithoutFeedback>

        <Animated.View
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            maxHeight: PANEL_HEIGHT,
            backgroundColor: theme.colors.background,
            borderTopLeftRadius: theme.borderRadius.xl,
            borderTopRightRadius: theme.borderRadius.xl,
            paddingBottom: insets.bottom + theme.spacing.lg,
            transform: [{ translateY }],
          }}
          accessibilityLabel={accessibilityLabel ?? title ?? 'Modal'}
          accessibilityRole="none"
        >
          <View {...panResponder.panHandlers}>
            <View style={{ alignItems: 'center', paddingVertical: theme.spacing.sm }}>
              <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: theme.colors.border }} />
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: theme.spacing.lg, paddingBottom: theme.spacing.md }}>
              {title && <Text preset="h3" style={{ flex: 1 }}>{title}</Text>}
              <TouchableOpacity onPress={onDismiss} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} accessibilityLabel="Close" accessibilityRole="button">
                <Ionicons name="close" size={24} color={theme.colors.text} />
              </TouchableOpacity>
            </View>
          </View>

          {scrollable ? (
            <ScrollView
              style={{ flexShrink: 1 }}
              contentContainerStyle={{ paddingHorizontal: theme.spacing.lg }}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {children}
            </ScrollView>
          ) : (
            <View style={{ flexShrink: 1, paddingHorizontal: theme.spacing.lg }}>
              {children}
            </View>
          )}
        </Animated.View>
      </View>
    </RNModal>
  );
}
