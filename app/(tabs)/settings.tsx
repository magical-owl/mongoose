import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme, ThemeMode } from '@/providers/ThemeProvider';
import { spacing, borderRadius, typography } from '@/theme';
import Constants from 'expo-constants';

/* ───────────────────────────────────────
 * Theme option definitions
 * ───────────────────────────────────────*/

interface ThemeOption {
  label: string;
  value: ThemeMode;
  icon: string;
}

const themeOptions: ThemeOption[] = [
  { label: 'Light', value: 'light', icon: '☀️' },
  { label: 'Dark', value: 'dark', icon: '🌙' },
  { label: 'System', value: 'system', icon: '📱' },
];

/* ───────────────────────────────────────
 * Component
 * ───────────────────────────────────────*/

export default function SettingsScreen() {
  const { colors, mode, isDark, setThemeMode } = useTheme();
  const insets = useSafeAreaInsets();

  const appVersion = Constants.expoConfig?.version ?? '1.0.0';
  const appName = Constants.expoConfig?.name ?? 'Meadow';

  const handleClearData = () => {
    Alert.alert(
      'Clear All Data',
      'This will remove all locally stored data. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear Data',
          style: 'destructive',
          onPress: () => {
            // In a real app this would clear MMKV / SecureStore / Zustand stores.
            Alert.alert('Done', 'All local data has been cleared.');
          },
        },
      ],
    );
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingTop: insets.top, paddingBottom: insets.bottom + spacing.xxxl }}
    >
      <Text style={[typography.h1, { color: colors.text, marginBottom: spacing.xxl }]}>
        Settings
      </Text>

      {/* ── Theme Section ── */}
      <Text style={[typography.label, { color: colors.textTertiary, marginBottom: spacing.sm }]}>
        APPEARANCE
      </Text>
      <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        {themeOptions.map((option, index) => {
          const selected = mode === option.value;
          const isLast = index === themeOptions.length - 1;
          return (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.row,
                !isLast && { borderBottomWidth: 1, borderBottomColor: colors.borderLight },
              ]}
              onPress={() => setThemeMode(option.value)}
              activeOpacity={0.6}
            >
              <Text style={styles.rowIcon}>{option.icon}</Text>
              <Text style={[typography.body, { color: colors.text, flex: 1 }]}>
                {option.label}
              </Text>
              <View
                style={[
                  styles.radio,
                  {
                    borderColor: selected ? colors.tint : colors.border,
                    backgroundColor: selected ? colors.tint : 'transparent',
                  },
                ]}
              >
                {selected && <View style={[styles.radioInner, { backgroundColor: colors.background }]} />}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* ── About Section ── */}
      <Text
        style={[
          typography.label,
          { color: colors.textTertiary, marginBottom: spacing.sm, marginTop: spacing.xxl },
        ]}
      >
        ABOUT
      </Text>
      <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={[styles.row, { borderBottomWidth: 1, borderBottomColor: colors.borderLight }]}>
          <Text style={[typography.body, { color: colors.text, flex: 1 }]}>App Name</Text>
          <Text style={[typography.bodySmall, { color: colors.textSecondary }]}>{appName}</Text>
        </View>
        <View style={[styles.row, { borderBottomWidth: 1, borderBottomColor: colors.borderLight }]}>
          <Text style={[typography.body, { color: colors.text, flex: 1 }]}>Version</Text>
          <Text style={[typography.bodySmall, { color: colors.textSecondary }]}>v{appVersion}</Text>
        </View>
        <View style={styles.row}>
          <Text style={[typography.body, { color: colors.text, flex: 1 }]}>Theme</Text>
          <Text style={[typography.bodySmall, { color: colors.textSecondary }]}>
            {isDark ? 'Dark' : 'Light'}
          </Text>
        </View>
      </View>

      {/* ── Danger Zone ── */}
      <Text
        style={[
          typography.label,
          { color: colors.textTertiary, marginBottom: spacing.sm, marginTop: spacing.xxl },
        ]}
      >
        DATA
      </Text>
      <TouchableOpacity
        style={[styles.dangerBtn, { borderColor: colors.error }]}
        onPress={handleClearData}
        activeOpacity={0.7}
      >
        <Text style={[typography.button, { color: colors.error }]}>Clear All Data</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  section: {
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    minHeight: 48,
  },
  rowIcon: {
    fontSize: 18,
    marginRight: spacing.sm,
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dangerBtn: {
    borderRadius: borderRadius.md,
    borderWidth: 1,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
});
