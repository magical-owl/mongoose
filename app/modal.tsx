import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/providers/ThemeProvider';
import { spacing, borderRadius, typography } from '@/theme';
import { useRouter } from 'expo-router';

/**
 * A reusable modal screen with a dismiss button.
 *
 * The parent layout (`app/_layout.tsx`) configures this screen with
 * `presentation: 'modal'` so it slides up from the bottom on iOS.
 * Consumers can pass content via the `children` prop or repurpose this
 * component as a base by modifying the body section.
 */
export default function ModalScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Handle bar for visual cue */}
      <View style={[styles.handleBar, { backgroundColor: colors.textTertiary }]} />

      <View style={[styles.body, { paddingTop: insets.top }]}>
        <Text style={[typography.h2, { color: colors.text, marginBottom: spacing.sm }]}>
          Modal
        </Text>
        <Text style={[typography.body, { color: colors.textSecondary }]}>
          This is a reusable modal screen. Use it to present temporary content such as
          forms, confirmations, or quick information.
        </Text>
      </View>

      {/* Dismiss button pinned to bottom */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.lg }]}>
        <TouchableOpacity
          style={[styles.dismissBtn, { backgroundColor: colors.tint }]}
          onPress={() => router.back()}
          activeOpacity={0.8}
        >
          <Text style={[typography.button, { color: colors.background }]}>Dismiss</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  handleBar: {
    width: 36,
    height: 5,
    borderRadius: 2.5,
    alignSelf: 'center',
    marginTop: spacing.sm,
    opacity: 0.5,
  },
  body: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  footer: {
    paddingHorizontal: spacing.lg,
  },
  dismissBtn: {
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
});
