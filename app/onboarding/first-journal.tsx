import { useCallback, useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { Redirect, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from '@/shared/components/Text';
import { JournalCreateForm } from '@/features/journal/components/JournalCreateForm';
import { useJournals } from '@/features/journal/hooks/useJournals';
import type { CreateJournalInput } from '@/features/journal/services/JournalService';
import { useTheme } from '@/providers/ThemeProvider';
import { useTranslation } from '@/localization/i18n';
import { useAppStore } from '@/stores/useAppStore';

export default function FirstJournalOnboardingScreen(): React.JSX.Element {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const t = useTranslation();
  const isOnboarded = useAppStore((state) => state.isOnboarded);
  const { journals, createJournal } = useJournals();
  const [isCreating, setIsCreating] = useState(false);
  const [createdJournalId, setCreatedJournalId] = useState<string | null>(null);

  useEffect(() => {
    if (journals.length > 0 && !createdJournalId && !isCreating) {
      router.replace('/entry/new');
    }
  }, [createdJournalId, isCreating, journals.length, router]);

  const handleCreateJournal = useCallback(async (input: CreateJournalInput) => {
    if (!input.title.trim()) {
      Alert.alert(t('journalTitleRequiredTitle'), t('journalTitleRequiredMessage'));
      return;
    }
    setIsCreating(true);
    const result = await createJournal(input);
    setIsCreating(false);
    if (!result.success) {
      Alert.alert(t('entryErrorTitle'), result.error.message);
      return;
    }
    setCreatedJournalId(result.data.id);
    router.replace({ pathname: '/entry/new', params: { journalId: result.data.id } });
  }, [createJournal, router, t]);

  if (!isOnboarded) {
    return <Redirect href="/onboarding" />;
  }

  return (
    <View style={[styles.root, { backgroundColor: theme.colors.background, paddingTop: insets.top + 20 }]}>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 28 }]}
      >
        <View style={styles.header}>
          <Text preset="caption" color="tint" style={styles.kicker}>{t('journalsTitle')}</Text>
          <Text preset="h1" color="text" style={styles.title}>{t('journalCreateFirstTitle')}</Text>
          <Text preset="body" color="textSecondary" style={styles.subtitle}>{t('journalCreateFirstSubtitle')}</Text>
        </View>
        <View style={[styles.formPanel, { borderColor: theme.colors.border, backgroundColor: theme.colors.background }]}>
          <JournalCreateForm
            submitLabel={t('journalCreateFirstButton')}
            savingLabel={t('journalCreating')}
            isSaving={isCreating}
            showCancel={false}
            autoFocus
            onSubmit={(input) => { void handleCreateJournal(input); }}
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: {
    flexGrow: 1,
    width: '100%',
    maxWidth: 520,
    alignSelf: 'center',
    justifyContent: 'center',
    paddingHorizontal: 22,
    gap: 20,
  },
  header: { gap: 8 },
  kicker: { fontWeight: '800' },
  title: { lineHeight: 42 },
  subtitle: { lineHeight: 22 },
  formPanel: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
  },
});
