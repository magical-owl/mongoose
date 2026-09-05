import { useMemo } from 'react';
import { Image, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Modal } from '@shared/components/Modal';
import { Text } from '@shared/components/Text';
import { ProfileAvatar } from '@/features/profile/components/ProfileAvatar';
import type { Profile } from '@/features/profile/domain/Profile';
import type { DiaryEntry, DiaryPhoto } from '@/features/diary/domain/DiaryEntry';
import { getDiaryPhotoImageSource } from '@/features/diary/services/DiaryPhotoService';
import { type TimeFormat } from '@/stores/useAppStore';
import { useTheme } from '@/providers/ThemeProvider';
import { useTranslation } from '@/localization/i18n';
import { formatFriendlyTimestamp } from '@/shared/utils/timeFormat';
import { ReflectionComposer } from './ReflectionComposer';

interface EntryReflectionsModalProps {
  readonly visible: boolean;
  readonly entry: DiaryEntry | null;
  readonly profile?: Pick<Profile, 'displayName' | 'avatarUri'> | null;
  readonly timeFormat: TimeFormat;
  readonly onDismiss: () => void;
  readonly onAddReflection: (entryId: string, text: string, photo?: DiaryPhoto) => Promise<boolean>;
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
                    {reflection.photo ? (
                      <Image
                        source={getDiaryPhotoImageSource(reflection.photo.uri)}
                        style={styles.reflectionPhoto}
                        resizeMode="cover"
                        accessibilityLabel={t('reflectionPhotoA11y')}
                        accessibilityIgnoresInvertColors
                        testID="entry-reflection-photo"
                      />
                    ) : null}
                  </View>
                </View>
              ))}
            </View>
          )}
        </ScrollView>
        <ReflectionComposer
          onSubmit={(text, photo) => (entry ? onAddReflection(entry.id, text, photo) : Promise.resolve(false))}
          inputBoxStyle={styles.reflectionInputBox}
          photoPreviewTestID="entry-reflection-photo-preview"
          selectedPhotoTestID="entry-reflection-selected-photo"
        />
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
  reflectionPhoto: {
    width: '100%',
    height: 128,
    borderRadius: 8,
    marginTop: 8,
  },
  reflectionInputBox: {
    borderRadius: 8,
  },
});
