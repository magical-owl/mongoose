import { type ComponentProps, useEffect, useRef } from 'react';
import { Animated, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '@/providers/ThemeProvider';
import type { FormatActionKind } from '@/shared/components/RichTextEditor';

export interface RichTextFormatItem {
  readonly kind: FormatActionKind;
  readonly icon: ComponentProps<typeof MaterialCommunityIcons>['name'];
}

interface RichTextFormattingDrawerProps {
  readonly visible: boolean;
  readonly items: readonly RichTextFormatItem[];
  readonly onSelect: (kind: FormatActionKind) => void;
}

export function RichTextFormattingDrawer({
  visible,
  items,
  onSelect,
}: RichTextFormattingDrawerProps): React.JSX.Element | null {
  const theme = useTheme();
  const progress = useRef(new Animated.Value(visible ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(progress, {
      toValue: visible ? 1 : 0,
      duration: 180,
      useNativeDriver: true,
    }).start();
  }, [progress, visible]);

  const translateY = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [14, 0],
  });

  return (
    <Animated.View
      pointerEvents={visible ? 'auto' : 'none'}
      style={[
        styles.drawer,
        {
          backgroundColor: theme.colors.background,
          borderColor: theme.colors.border,
          opacity: progress,
          transform: [{ translateY }],
        },
      ]}
    >
      <ScrollView
        keyboardShouldPersistTaps="always"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.drawerContent}
      >
        {items.map((item) => (
          <TouchableOpacity
            key={item.kind}
            style={styles.toolbarIcon}
            onPressIn={() => onSelect(item.kind)}
            activeOpacity={0.6}
            accessibilityLabel={item.kind}
            accessibilityRole="button"
          >
            <MaterialCommunityIcons name={item.icon} size={22} color={theme.colors.text} />
          </TouchableOpacity>
        ))}
      </ScrollView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  drawer: {
    position: 'absolute',
    left: 0,
    bottom: 44,
    maxHeight: 304,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 8,
    paddingVertical: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 26,
    zIndex: 20,
  },
  drawerContent: {
    alignItems: 'center',
  },
  toolbarIcon: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
});
