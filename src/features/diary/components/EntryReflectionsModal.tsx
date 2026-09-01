import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Modal } from '@shared/components/Modal';
import { Text } from '@shared/components/Text';
import { ProfileAvatar } from '@/features/profile/components/ProfileAvatar';
import type { Profile } from '@/features/profile/domain/Profile';
import type { DiaryEntry } from '@/features/diary/domain/DiaryEntry';
import { type TimeFormat } from '@/stores/useAppStore';
import { useTheme } from '@/providers/ThemeProvider';
import { useTranslation } from '@/localization/i18n';
import { formatFriendlyTimestamp } from '@/shared/utils/timeFormat';

interface EntryReflectionsModalProps {
  readonly visible: boolean;
  readonly entry: DiaryEntry | null;
  readonly profile?: Pick<Profile, 'displayName' | 'avatarUri'> | null;
  readonly timeFormat: TimeFormat;
  readonly onDismiss: () => void;
  readonly onAddReflection: (entryId: string, text: string) => Promise<boolean>;
  readonly onDeleteReflection: (entryId: string, reflectionId: string) => void;
}

export function EntryReflectionsModal({
  visible,
  entry,
  profile,
  timeFormat,
  onDismiss,
  onAddReflection,
  onDeleteReflection,
}: EntryReflectionsModalProps): React.JSX.Element {
  const theme = useTheme();
  const t = useTranslation();
  const [reflectionText, setReflectionText] = useState('');
  const [isSavingReflection, setIsSavingReflection] = useState(false);
  const friendlyTimestampLabels = useMemo(
    () => ({
      today: t('timeToday'),
      yesterday: t('timeYesterday'),
      todayAt: t('timeTodayAt'),
      yesterdayAt: t('timeYesterdayAt'),
      justNow: t('timeJustNow'),
      minutesAgo: t('timeMinutesAgoShort'),
      hoursAgo: t('timeHoursAgoShort'),
    }),
    [t],
  );
  const trimmedReflection = reflectionText.trim();

  const handleAddReflection = async () => {
    if (!entry || !trimmedReflection) return;
    setIsSavingReflection(true);
    const saved = await onAddReflection(entry.id, trimmedReflection);
    setIsSavingReflection(false);
    if (saved) setReflectionText('');
  };

  return (
    <Modal
      visible={visible}
      onDismiss={onDismiss}
      title={t('reflections')}
      accessibilityLabel={t('entryReflectionsA11y')}
      scrollable={false}
    >
      <View style={styles.modalBody}>
        <ScrollView
          style={styles.reflectionsScroll}
          contentContainerStyle={styles.reflectionsScrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {!entry || entry.reflections.length === 0 ? (
            <Text preset="bodySmall" color="textSecondary" style={styles.reflectionsEmpty}>
              {t('noReflections')}
            </Text>
          ) : (
            <View style={styles.reflectionsList}>
              {entry.reflections.map((reflection) => (
                <View key={reflection.id} style={styles.reflectionRow}>
                  <ProfileAvatar profile={profile} size={24} accessibilityLabel={t('profileAvatarA11y')} />
                  <View style={[styles.reflectionItem, { borderColor: theme.colors.border, backgroundColor: theme.colors.surface }]}>
                    <View style={styles.reflectionHeader}>
                      <Text preset="caption" color="textTertiary">
                        {formatFriendlyTimestamp(reflection.createdAt, timeFormat, friendlyTimestampLabels)}
                      </Text>
                      <TouchableOpacity
                        onPress={() => onDeleteReflection(entry.id, reflection.id)}
                        accessibilityRole="button"
                        accessibilityLabel={t('reflectionDeleteA11y')}
                      >
                        <Text preset="caption" color="textSecondary">{t('entryDelete')}</Text>
                      </TouchableOpacity>
                    </View>
                    <Text preset="bodySmall" color="text" style={styles.reflectionText}>{reflection.text}</Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </ScrollView>
        <View
          style={[
            styles.reflectionInputBox,
            {
              minHeight: Math.max(38, theme.fontSizes.sm * 2.7),
              borderColor: theme.colors.border,
              backgroundColor: theme.colors.surface,
            },
          ]}
        >
          <TextInput
            value={reflectionText}
            onChangeText={setReflectionText}
            placeholder={t('addReflectionPlaceholder')}
            placeholderTextColor={theme.colors.textSecondary}
            style={[
              styles.reflectionInput,
              {
                height: Math.max(36, theme.fontSizes.sm * 2.5),
                color: theme.colors.text,
                fontFamily: theme.fontFamily,
                fontSize: theme.fontSizes.sm,
                lineHeight: theme.fontSizes.sm * 1.35,
              },
            ]}
            returnKeyType="send"
            onSubmitEditing={() => { void handleAddReflection(); }}
            accessibilityLabel={t('reflectionTextA11y')}
          />
          <TouchableOpacity
            onPress={() => { void handleAddReflection(); }}
            disabled={isSavingReflection || !trimmedReflection}
            style={[
              styles.reflectionButton,
              { backgroundColor: trimmedReflection && !isSavingReflection ? theme.colors.tint : 'transparent' },
            ]}
            accessibilityRole="button"
            accessibilityLabel={t('reflectionAddA11y')}
          >
            <MaterialCommunityIcons
              name="plus"
              size={18}
              color={trimmedReflection && !isSavingReflection ? theme.colors.background : theme.colors.textSecondary}
            />
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalBody: { maxHeight: 520 },
  reflectionsScroll: { maxHeight: 440 },
  reflectionsScrollContent: { paddingBottom: 12 },
  reflectionsEmpty: { marginBottom: 12 },
  reflectionsList: { gap: 8, marginTop: 4, marginBottom: 12 },
  reflectionRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  reflectionItem: {
    flex: 1,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  reflectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  reflectionText: { lineHeight: 20, marginTop: 2 },
  reflectionInputBox: {
    minHeight: 38,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    paddingLeft: 10,
    paddingRight: 4,
  },
  reflectionInput: {
    flex: 1,
    paddingVertical: 0,
    paddingTop: 0,
    paddingBottom: 0,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  reflectionButton: {
    width: 30,
    height: 30,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
