import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@providers/ThemeProvider';
import { Text } from '@shared/components/Text';
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
      <View style={styles.selectorRow}>
        <Animated.View style={[styles.inputWrap, { width: inputWidth }]}>
          {!journalInput && !isJournalInputFocused ? (
            <View pointerEvents="none" style={styles.placeholderIcon}>
              <Ionicons name="book-outline" size={18} color={theme.colors.textSecondary} />
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
              <Text preset="caption" color="tint" style={styles.journalText} numberOfLines={1}>{journal.title}</Text>
              <Ionicons name="close" size={13} color={theme.colors.tint} />
            </TouchableOpacity>
          ))}
          {suggestedJournals.map((journal) => (
            <TouchableOpacity
              key={journal.id}
              onPress={() => handleToggleJournal(journal.id)}
              style={[styles.suggestedJournal, { borderColor: theme.colors.border + '80', backgroundColor: 'transparent' }]}
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
  section: { marginTop: 4, marginBottom: 4 },
  selectorRow: { minHeight: 36, flexDirection: 'row', alignItems: 'center', borderRadius: 8, paddingLeft: 0, paddingRight: 0, gap: 2 },
  inputWrap: { height: 32, justifyContent: 'center', overflow: 'hidden' },
  placeholderIcon: { position: 'absolute', alignSelf: 'center' },
  inlineScroll: { flex: 1 },
  inlineContent: { minHeight: 36, flexDirection: 'row', alignItems: 'center', gap: 5, paddingRight: 4 },
  selectedJournal: { maxWidth: 132, minHeight: 28, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 14, paddingHorizontal: 8, gap: 4 },
  journalText: { fontWeight: '700', flexShrink: 1 },
  input: {
    width: '100%',
    height: 32,
    paddingTop: 0,
    paddingBottom: 0,
    fontSize: 14,
    lineHeight: 18,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  suggestedJournal: { maxWidth: 132, minHeight: 28, borderWidth: 1, borderRadius: 14, paddingHorizontal: 9, alignItems: 'center', justifyContent: 'center' },
});
