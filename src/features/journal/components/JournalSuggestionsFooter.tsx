import { Image, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '@shared/components/Text';
import { useTheme } from '@providers/ThemeProvider';
import { getJournalCoverImageSource } from '@/features/journal/domain/JournalBackgrounds';
import type { Journal } from '@/features/journal/domain/Journal';
import { type TranslationKey, useTranslation } from '@/localization/i18n';

interface JournalSuggestionsFooterProps {
  readonly journals: readonly Journal[];
  readonly currentJournalId: string;
  readonly entryCountsByJournalId: ReadonlyMap<string, number>;
  readonly onPressJournal: (journal: Journal) => void;
  readonly onPressTitle?: () => void;
}

function entryCountLabel(count: number, t: (key: TranslationKey) => string): string {
  if (count === 1) return t('journalEntryCountOne');
  return t('journalEntryCountMany').replace('{count}', String(count));
}

export function JournalSuggestionsFooter({
  journals,
  currentJournalId,
  entryCountsByJournalId,
  onPressJournal,
  onPressTitle,
}: JournalSuggestionsFooterProps): React.JSX.Element | null {
  const theme = useTheme();
  const t = useTranslation();
  const suggestedJournals = journals.filter((journal) => journal.id !== currentJournalId);

  if (suggestedJournals.length === 0) return null;

  return (
    <View style={styles.container} testID="journal-suggestions-footer">
      <View style={styles.headerRow}>
        <TouchableOpacity
          style={styles.titleButton}
          onPress={onPressTitle}
          disabled={!onPressTitle}
          activeOpacity={0.72}
          accessibilityRole={onPressTitle ? 'button' : undefined}
          accessibilityLabel={onPressTitle ? t('journalSuggestionsTitleA11y') : undefined}
        >
          <Text preset="label" color="text" style={styles.title}>
            {t('journalSuggestionsTitle')}
          </Text>
          {onPressTitle ? <Ionicons name="arrow-forward" size={16} color={theme.colors.textSecondary} /> : null}
        </TouchableOpacity>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollerContent}
        accessibilityLabel={t('journalSuggestionsA11y')}
      >
        {suggestedJournals.map((journal) => {
          const coverSource = getJournalCoverImageSource(journal.coverImageUri);
          const count = entryCountsByJournalId.get(journal.id) ?? 0;

          return (
            <TouchableOpacity
              key={journal.id}
              style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
              onPress={() => onPressJournal(journal)}
              activeOpacity={0.76}
              accessibilityRole="button"
              accessibilityLabel={`${t('journalSuggestionOpenA11y')} ${journal.title}`}
            >
              <View style={[styles.cover, { backgroundColor: journal.color || theme.colors.tint }]}>
                {coverSource ? (
                  <Image source={coverSource} style={styles.coverImage} resizeMode="cover" />
                ) : (
                  <Ionicons name="journal-outline" size={28} color={theme.colors.stickerControlText} />
                )}
              </View>
              <View style={styles.cardCopy}>
                <Text preset="bodySmall" color="text" style={styles.cardTitle} numberOfLines={1}>
                  {journal.title}
                </Text>
                <Text preset="caption" color="textSecondary" style={styles.cardMeta} numberOfLines={1}>
                  {entryCountLabel(count, t)}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 18,
    paddingBottom: 2,
    gap: 10,
  },
  headerRow: {
    minHeight: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontWeight: '800',
  },
  titleButton: {
    minHeight: 32,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  scrollerContent: {
    gap: 10,
    paddingRight: 20,
  },
  card: {
    width: 172,
    minHeight: 138,
    borderWidth: 1,
    borderRadius: 8,
    overflow: 'hidden',
  },
  cover: {
    height: 82,
    alignItems: 'center',
    justifyContent: 'center',
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  cardCopy: {
    paddingHorizontal: 10,
    paddingVertical: 9,
    gap: 2,
  },
  cardTitle: {
    fontWeight: '800',
  },
  cardMeta: {
    fontWeight: '600',
  },
});
