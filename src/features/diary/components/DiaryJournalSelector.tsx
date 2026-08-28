import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@providers/ThemeProvider';
import { Text } from '@shared/components/Text';
import { SectionLabel } from '@shared/components/SectionLabel';
import type { Journal } from '@/features/journal/domain/Journal';
import { useTranslation } from '@/localization/i18n';

interface DiaryJournalSelectorProps {
  readonly selectedJournalIds: readonly string[];
  readonly journals: readonly Journal[];
  readonly onChange: (journalIds: string[]) => void;
}

export function DiaryJournalSelector({ selectedJournalIds, journals, onChange }: DiaryJournalSelectorProps): React.JSX.Element | null {
  const theme = useTheme();
  const t = useTranslation();
  const [journalInput, setJournalInput] = useState('');
  const [isJournalInputFocused, setIsJournalInputFocused] = useState(false);
  const isJournalInputExpanded = isJournalInputFocused || Boolean(journalInput);
  const inputWidth = useRef(new Animated.Value(isJournalInputExpanded ? 132 : 42)).current;

  useEffect(() => {
    Animated.timing(inputWidth, {
      toValue: isJournalInputExpanded ? 132 : 42,
      duration: 180,
      useNativeDriver: false,
    }).start();
  }, [inputWidth, isJournalInputExpanded]);

  const selectedJournals = useMemo(
    () => journals.filter((journal) => selectedJournalIds.includes(journal.id)),
    [journals, selectedJournalIds],
  );
  const suggestedJournals = useMemo(() => {
    const selected = new Set(selectedJournalIds);
    const query = journalInput.trim().toLocaleLowerCase();
    return journals.filter((journal) => (
      !selected.has(journal.id)
      && (!query || journal.title.toLocaleLowerCase().includes(query))
    ));
  }, [journalInput, journals, selectedJournalIds]);
  const handleToggleJournal = (journalId: string) => {
    onChange(
      selectedJournalIds.includes(journalId)
        ? selectedJournalIds.filter((id) => id !== journalId)
        : [...selectedJournalIds, journalId],
    );
    setJournalInput('');
  };

  if (journals.length === 0) return null;

  return (
    <View style={styles.section}>
      <SectionLabel>
        {t('entryJournalSection')}
      </SectionLabel>
      <View style={styles.selectorRow}>
        <Animated.View style={[styles.inputWrap, { width: inputWidth, backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
          {!journalInput && !isJournalInputFocused ? (
            <View pointerEvents="none" style={styles.placeholderIcon}>
              <Ionicons name="book-outline" size={18} color={theme.colors.tint} />
            </View>
          ) : null}
          <TextInput
            value={journalInput}
            onChangeText={setJournalInput}
            placeholder=""
            placeholderTextColor={theme.colors.textSecondary}
            autoCapitalize="words"
            autoCorrect={false}
            returnKeyType="search"
            onFocus={() => setIsJournalInputFocused(true)}
            onBlur={() => setIsJournalInputFocused(false)}
            style={[styles.input, { color: theme.colors.text, fontFamily: theme.fontFamily }]}
            accessibilityLabel={t('entryJournalInputA11y')}
          />
        </Animated.View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          style={styles.inlineScroll}
          contentContainerStyle={styles.inlineContent}
        >
          {selectedJournals.map((journal) => (
            <TouchableOpacity
              key={journal.id}
              onPress={() => handleToggleJournal(journal.id)}
              style={[styles.selectedJournal, { borderColor: theme.colors.tint, backgroundColor: theme.colors.tint + '18' }]}
              accessibilityRole="button"
              accessibilityLabel={`${t('entryJournalRemoveA11y')} ${journal.title}`}
            >
              <Text preset="caption" style={[styles.journalText, { color: theme.colors.tint }]} numberOfLines={1}>{journal.title}</Text>
              <Ionicons name="close" size={13} color={theme.colors.tint} />
            </TouchableOpacity>
          ))}
          {suggestedJournals.map((journal) => (
            <TouchableOpacity
              key={journal.id}
              onPress={() => handleToggleJournal(journal.id)}
              style={[styles.suggestedJournal, { borderColor: theme.colors.border, backgroundColor: theme.colors.surface }]}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: false }}
              accessibilityLabel={`${t('entryJournalSection')} ${journal.title}`}
            >
              <Text preset="caption" color="text" style={styles.journalText} numberOfLines={1}>{journal.title}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { marginTop: 6, marginBottom: 8 },
  selectorRow: { minHeight: 38, flexDirection: 'row', alignItems: 'center', borderRadius: 8, paddingLeft: 0, paddingRight: 0, gap: 8 },
  inputWrap: { height: 34, justifyContent: 'center', overflow: 'hidden', borderWidth: 1, borderRadius: 17 },
  placeholderIcon: { position: 'absolute', alignSelf: 'center' },
  inlineScroll: { flex: 1 },
  inlineContent: { minHeight: 38, flexDirection: 'row', alignItems: 'center', gap: 8, paddingRight: 4 },
  selectedJournal: { maxWidth: 142, minHeight: 34, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 17, paddingHorizontal: 12, gap: 5 },
  journalText: { fontSize: 14, lineHeight: 18, fontWeight: '800', flexShrink: 1 },
  input: {
    width: '100%',
    height: 34,
    paddingTop: 0,
    paddingBottom: 0,
    fontSize: 14,
    lineHeight: 18,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  suggestedJournal: { maxWidth: 142, minHeight: 34, borderWidth: 1, borderRadius: 17, paddingHorizontal: 12, alignItems: 'center', justifyContent: 'center' },
});
