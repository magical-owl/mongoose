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
import { Controller } from 'react-hook-form';
import { useProfileForm } from '@/features/profile/hooks/useProfileForm';
import type { ProfileFormData } from '@/features/profile/domain/profileSchema';

/* ───────────────────────────────────────
 * Component
 * ───────────────────────────────────────*/

export default function ProfileScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const {
    control,
    handleSubmit,
    formState: { errors, isDirty, isValid },
    profile,
    saveProfile,
    clearProfile,
    isSaving,
    isClearing,
  } = useProfileForm();

  const onSubmit = async (data: ProfileFormData) => {
    const result = await saveProfile(data);
    if (result.success) {
      Alert.alert('Saved', 'Your profile has been updated.');
      return;
    }
    Alert.alert('Unable to save profile', result.error.message);
  };

  const handleClear = () => {
    Alert.alert('Clear Profile', 'This will erase all profile data.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear',
        style: 'destructive',
        onPress: () => {
          void clearProfile().then((result) => {
            if (!result.success) {
              Alert.alert('Unable to clear profile', result.error.message);
            }
          });
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
      {profile && (
        <Text
          style={[
            typography.caption,
            { color: colors.textTertiary, textAlign: 'center', marginBottom: spacing.md },
          ]}
        >
          Last saved: {new Date(profile.updatedAt).toLocaleString()}
        </Text>
      )}

      {/* Save Button */}
      <TouchableOpacity
        style={[
          styles.saveBtn,
          { backgroundColor: colors.tint, opacity: isDirty && isValid && !isSaving ? 1 : 0.5 },
        ]}
        onPress={handleSubmit(onSubmit)}
        disabled={!isDirty || !isValid || isSaving}
        activeOpacity={0.8}
      >
        <Text style={[typography.button, { color: colors.background }]}>{isSaving ? 'Saving…' : 'Save Profile'}</Text>
      </TouchableOpacity>

      {/* Clear Button */}
      <TouchableOpacity
        style={[styles.clearBtn, { borderColor: colors.border }]}
        onPress={handleClear}
        disabled={isClearing}
        activeOpacity={0.7}
      >
        <Text style={[typography.button, { color: colors.error }]}>{isClearing ? 'Clearing…' : 'Clear Profile Data'}</Text>
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
