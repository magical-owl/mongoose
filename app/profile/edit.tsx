import { StyleSheet, View } from 'react-native';
import { useCallback } from 'react';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@providers/ThemeProvider';
import { IconCircleButton } from '@shared/components/IconCircleButton';
import { Text } from '@shared/components/Text';
import { ProfileEditorForm } from '@/features/profile/components/ProfileEditorForm';
import { useProfileForm } from '@/features/profile/hooks/useProfileForm';
import { useTranslation } from '@/localization/i18n';

export default function EditProfileScreen(): React.JSX.Element {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const t = useTranslation();
  const { profile } = useProfileForm();
  const navigateBack = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace('/(tabs)/settings');
  }, [router]);

  return (
    <View style={[styles.root, { backgroundColor: theme.colors.background, paddingTop: insets.top + 14 }]}>
      <View style={styles.header}>
        <View style={styles.headerSide}>
          <IconCircleButton icon="chevron-left" onPress={navigateBack} accessibilityLabel={t('entryBackA11y')} />
        </View>
        <Text preset="label" color="text" style={styles.title} numberOfLines={1}>
          {t('settingsProfileTitle')}
        </Text>
        <View style={styles.headerSide} />
      </View>
      <View style={styles.content}>
        <ProfileEditorForm
          key={profile?.updatedAt ?? 'empty-profile'}
          profile={profile}
          onSaved={navigateBack}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  header: {
    minHeight: 44,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerSide: {
    width: 82,
  },
  title: {
    flex: 1,
    textAlign: 'center',
    fontWeight: '800',
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
});
