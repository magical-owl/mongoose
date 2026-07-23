import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/providers/ThemeProvider';
import { spacing, borderRadius, typography } from '@/theme';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { create } from 'zustand';

/* ───────────────────────────────────────
 * Zod validation schema
 * ───────────────────────────────────────*/

const profileSchema = z.object({
  displayName: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name must be at most 50 characters'),
  email: z.string().email('Enter a valid email address'),
  bio: z.string().max(280, 'Bio must be at most 280 characters').optional(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

/* ───────────────────────────────────────
 * Zustand profile store
 * ───────────────────────────────────────*/

interface ProfileState {
  displayName: string;
  email: string;
  bio: string;
  savedAt: string | null;
  save: (data: ProfileFormData) => void;
  clear: () => void;
}

const defaultProfile: ProfileFormData = {
  displayName: '',
  email: '',
  bio: '',
};

const useProfileStore = create<ProfileState>((set) => ({
  ...defaultProfile,
  savedAt: null,
  save: (data) =>
    set({
      displayName: data.displayName,
      email: data.email,
      bio: data.bio ?? '',
      savedAt: new Date().toISOString(),
    }),
  clear: () => set({ ...defaultProfile, savedAt: null }),
}));

/* ───────────────────────────────────────
 * Component
 * ───────────────────────────────────────*/

export default function ProfileScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const savedProfile = useProfileStore();
  const { save } = useProfileStore();

  const {
    control,
    handleSubmit,
    formState: { errors, isDirty, isValid },
    reset,
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      displayName: savedProfile.displayName || '',
      email: savedProfile.email || '',
      bio: savedProfile.bio || '',
    },
  });

  const onSubmit = (data: ProfileFormData) => {
    save(data);
    Alert.alert('Saved', 'Your profile has been updated.');
  };

  const handleClear = () => {
    Alert.alert('Clear Profile', 'This will erase all profile data.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear',
        style: 'destructive',
        onPress: () => {
          savedProfile.clear();
          reset(defaultProfile);
        },
      },
    ]);
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingTop: insets.top, paddingBottom: insets.bottom + spacing.xxxl }}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={[typography.h1, { color: colors.text, marginBottom: spacing.xxl }]}>
        Profile
      </Text>

      {/* Display Name */}
      <View style={styles.fieldGroup}>
        <Text style={[typography.label, { color: colors.textSecondary }]}>Display Name</Text>
        <Controller
          control={control}
          name="displayName"
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.inputBackground,
                  borderColor: errors.displayName ? colors.error : colors.inputBorder,
                  color: colors.text,
                },
              ]}
              placeholder="Your name"
              placeholderTextColor={colors.textTertiary}
              onBlur={onBlur}
              onChangeText={onChange}
              value={value}
              autoCapitalize="words"
            />
          )}
        />
        {errors.displayName && (
          <Text style={[typography.caption, { color: colors.error, marginTop: spacing.xs }]}>
            {errors.displayName.message}
          </Text>
        )}
      </View>

      {/* Email */}
      <View style={styles.fieldGroup}>
        <Text style={[typography.label, { color: colors.textSecondary }]}>Email</Text>
        <Controller
          control={control}
          name="email"
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.inputBackground,
                  borderColor: errors.email ? colors.error : colors.inputBorder,
                  color: colors.text,
                },
              ]}
              placeholder="you@example.com"
              placeholderTextColor={colors.textTertiary}
              onBlur={onBlur}
              onChangeText={onChange}
              value={value}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          )}
        />
        {errors.email && (
          <Text style={[typography.caption, { color: colors.error, marginTop: spacing.xs }]}>
            {errors.email.message}
          </Text>
        )}
      </View>

      {/* Bio */}
      <View style={styles.fieldGroup}>
        <Text style={[typography.label, { color: colors.textSecondary }]}>Bio</Text>
        <Controller
          control={control}
          name="bio"
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              style={[
                styles.input,
                styles.textArea,
                {
                  backgroundColor: colors.inputBackground,
                  borderColor: errors.bio ? colors.error : colors.inputBorder,
                  color: colors.text,
                },
              ]}
              placeholder="Tell us a little about yourself…"
              placeholderTextColor={colors.textTertiary}
              onBlur={onBlur}
              onChangeText={onChange}
              value={value ?? ''}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          )}
        />
        {errors.bio && (
          <Text style={[typography.caption, { color: colors.error, marginTop: spacing.xs }]}>
            {errors.bio.message}
          </Text>
        )}
      </View>

      {/* Last saved indicator */}
      {savedProfile.savedAt && (
        <Text
          style={[
            typography.caption,
            { color: colors.textTertiary, textAlign: 'center', marginBottom: spacing.md },
          ]}
        >
          Last saved: {new Date(savedProfile.savedAt).toLocaleString()}
        </Text>
      )}

      {/* Save Button */}
      <TouchableOpacity
        style={[
          styles.saveBtn,
          { backgroundColor: colors.tint, opacity: isDirty && isValid ? 1 : 0.5 },
        ]}
        onPress={handleSubmit(onSubmit)}
        disabled={!isDirty || !isValid}
        activeOpacity={0.8}
      >
        <Text style={[typography.button, { color: colors.background }]}>Save Profile</Text>
      </TouchableOpacity>

      {/* Clear Button */}
      <TouchableOpacity
        style={[styles.clearBtn, { borderColor: colors.border }]}
        onPress={handleClear}
        activeOpacity={0.7}
      >
        <Text style={[typography.button, { color: colors.error }]}>Clear Profile Data</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  fieldGroup: {
    marginBottom: spacing.lg,
  },
  input: {
    borderWidth: 1,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    marginTop: spacing.xs,
    ...typography.body,
  },
  textArea: {
    minHeight: 100,
    paddingTop: spacing.sm + 2,
  },
  saveBtn: {
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  clearBtn: {
    borderRadius: borderRadius.md,
    borderWidth: 1,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginTop: spacing.md,
  },
});
