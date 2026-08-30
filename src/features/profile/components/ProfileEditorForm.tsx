import { useState } from 'react';
import { Alert, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { useTheme } from '@providers/ThemeProvider';
import { AccentPillButton } from '@shared/components/AccentPillButton';
import { SectionLabel } from '@shared/components/SectionLabel';
import { Text } from '@shared/components/Text';
import { chooseDiaryPhoto } from '@/features/diary/services/DiaryPhotoPickerService';
import type { Profile } from '@/features/profile/domain/Profile';
import { useProfileForm } from '@/features/profile/hooks/useProfileForm';
import { profilePhotoService } from '@/features/profile/services/ProfilePhotoService';
import { useTranslation } from '@/localization/i18n';
import { ProfileAvatar } from './ProfileAvatar';

interface ProfileEditorFormProps {
  readonly profile?: Profile | null;
  readonly onSaved?: () => void;
}

export function ProfileEditorForm({ profile, onSaved }: ProfileEditorFormProps): React.JSX.Element {
  const theme = useTheme();
  const t = useTranslation();
  const { saveProfile } = useProfileForm();
  const [profileName, setProfileName] = useState(profile?.displayName ?? '');
  const [profileAvatarUri, setProfileAvatarUri] = useState<string | undefined>(profile?.avatarUri);

  const handleChooseProfilePhoto = async () => {
    const result = await chooseDiaryPhoto();
    if (!result.success) {
      if (result.error === 'native-module-missing') {
        Alert.alert(t('entryPhotoImportFailedTitle'), t('entryPhotoNativeModuleMissingMessage'));
      } else {
        Alert.alert(t('entryPhotoPermissionTitle'), t('entryPhotoLibraryPermissionMessage'));
      }
      return;
    }
    const asset = result.assets[0];
    if (!asset) return;
    try {
      const importedUri = await profilePhotoService.importAsset(asset);
      setProfileAvatarUri(importedUri);
    } catch {
      Alert.alert(t('entryPhotoImportFailedTitle'), t('entryPhotoImportFailedMessage'));
    }
  };

  const handleSaveProfile = async () => {
    const trimmedName = profileName.trim();
    if (trimmedName.length < 2) {
      Alert.alert(t('settingsProfileInvalidTitle'), t('settingsProfileInvalidMessage'));
      return;
    }
    const result = await saveProfile({
      displayName: trimmedName,
      email: profile?.email,
      bio: profile?.bio,
      avatarUri: profileAvatarUri,
    });
    if (!result.success) {
      Alert.alert(t('entryErrorTitle'), result.error.message);
      return;
    }
    onSaved?.();
  };

  return (
    <View style={styles.content}>
      <TouchableOpacity
        onPress={() => { void handleChooseProfilePhoto(); }}
        activeOpacity={0.72}
        style={styles.photoButton}
        accessibilityRole="button"
        accessibilityLabel={t('settingsProfilePhotoA11y')}
      >
        <ProfileAvatar
          profile={{ displayName: profileName, avatarUri: profileAvatarUri }}
          size={76}
          accessibilityLabel={t('profileAvatarA11y')}
        />
        <Text preset="caption" color="tint" style={styles.photoText}>
          {profileAvatarUri ? t('settingsProfileChangePhoto') : t('settingsProfileAddPhoto')}
        </Text>
      </TouchableOpacity>
      {profileAvatarUri ? (
        <TouchableOpacity
          onPress={() => setProfileAvatarUri(undefined)}
          activeOpacity={0.7}
          style={styles.removePhoto}
          accessibilityRole="button"
          accessibilityLabel={t('settingsProfileRemovePhoto')}
        >
          <Text preset="caption" color="textSecondary" style={styles.removePhotoText}>
            {t('settingsProfileRemovePhoto')}
          </Text>
        </TouchableOpacity>
      ) : null}
      <SectionLabel style={styles.inputLabel}>{t('settingsProfileNameLabel')}</SectionLabel>
      <TextInput
        value={profileName}
        onChangeText={setProfileName}
        placeholder={t('settingsProfileNamePlaceholder')}
        placeholderTextColor={theme.colors.textSecondary}
        style={[styles.input, { color: theme.colors.text, borderColor: theme.colors.border, backgroundColor: theme.colors.surface }]}
        autoCapitalize="words"
        returnKeyType="done"
        accessibilityLabel={t('settingsProfileNameLabel')}
      />
      <AccentPillButton
        label={t('settingsProfileSave')}
        onPress={() => { void handleSaveProfile(); }}
        accessibilityLabel={t('settingsProfileSave')}
        testID="profile-save-button"
        style={styles.saveButton}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: 10,
    paddingVertical: 8,
  },
  photoButton: {
    alignItems: 'center',
    gap: 10,
    paddingBottom: 4,
  },
  photoText: {
    fontWeight: '800',
  },
  removePhoto: {
    alignSelf: 'center',
    minHeight: 32,
    justifyContent: 'center',
  },
  removePhotoText: {
    fontWeight: '700',
  },
  inputLabel: {
    marginTop: 12,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
  },
  saveButton: {
    height: 48,
    borderRadius: 24,
    marginTop: 8,
  },
});
