import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@providers/ThemeProvider';
import { Text } from '@shared/components/Text';
import { useTranslation } from '@/localization/i18n';
import { normalizeDiaryTag, normalizeDiaryTags, toggleDiaryTagSelection } from '@/features/diary/services/DiaryTagService';

interface DiaryTagSelectorProps {
  readonly selectedTags: readonly string[];
  readonly availableTags: readonly string[];
  readonly onChange: (tags: string[]) => void;
}

export function DiaryTagSelector({ selectedTags, availableTags, onChange }: DiaryTagSelectorProps): React.JSX.Element {
  const theme = useTheme();
  const t = useTranslation();
  const [tagInput, setTagInput] = useState('');

  const normalizedSelectedTags = useMemo(() => normalizeDiaryTags(selectedTags), [selectedTags]);
  const suggestedTags = useMemo(() => {
    const selected = new Set(normalizedSelectedTags);
    return normalizeDiaryTags(availableTags).filter((tag) => !selected.has(tag));
  }, [availableTags, normalizedSelectedTags]);
  const filteredSuggestedTags = useMemo(() => {
    const query = normalizeDiaryTag(tagInput);
    if (!query) return suggestedTags;
    return suggestedTags.filter((tag) => tag.includes(query));
  }, [suggestedTags, tagInput]);
  const candidateTag = normalizeDiaryTag(tagInput);
  const canAddTag = Boolean(candidateTag) && !normalizedSelectedTags.includes(candidateTag);

  const handleAddTag = () => {
    if (!canAddTag) return;
    onChange(normalizeDiaryTags([...normalizedSelectedTags, candidateTag]));
    setTagInput('');
  };

  const handleToggleTag = (tag: string) => {
    onChange(toggleDiaryTagSelection(normalizedSelectedTags, tag));
  };

  return (
    <View style={styles.section}>
      <View style={styles.selectorRow}>
        <TextInput
          value={tagInput}
          onChangeText={setTagInput}
          placeholder={t('entryTagPlaceholder')}
          placeholderTextColor={theme.colors.textSecondary}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="done"
          onSubmitEditing={handleAddTag}
          style={[styles.input, { color: theme.colors.text, fontFamily: theme.fontFamily }]}
          accessibilityLabel={t('entryTagInputA11y')}
        />
        <TouchableOpacity
          onPress={handleAddTag}
          disabled={!canAddTag}
          style={[styles.addButton, { backgroundColor: canAddTag ? theme.colors.tint : 'transparent' }]}
          accessibilityRole="button"
          accessibilityLabel={t('entryTagAddA11y')}
        >
          <Ionicons name="add" size={18} color={canAddTag ? '#fff' : theme.colors.textSecondary} />
        </TouchableOpacity>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          style={styles.inlineScroll}
          contentContainerStyle={styles.inlineContent}
        >
          {normalizedSelectedTags.map((tag) => (
            <TouchableOpacity
              key={tag}
              onPress={() => handleToggleTag(tag)}
              style={[styles.selectedTag, { borderColor: theme.colors.tint, backgroundColor: theme.colors.tint + '18' }]}
              accessibilityRole="button"
              accessibilityLabel={`${t('entryTagRemoveA11y')} ${tag}`}
            >
              <Text preset="caption" color="tint" style={styles.tagText}>#{tag}</Text>
              <Ionicons name="close" size={13} color={theme.colors.tint} />
            </TouchableOpacity>
          ))}
          {filteredSuggestedTags.map((tag) => (
            <TouchableOpacity
              key={tag}
              onPress={() => handleToggleTag(tag)}
              style={[styles.suggestedTag, { borderColor: theme.colors.border + '80', backgroundColor: 'transparent' }]}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: false }}
            >
              <Text preset="caption" color="text" style={styles.tagText}>#{tag}</Text>
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
  inlineScroll: { flex: 1 },
  inlineContent: { minHeight: 36, flexDirection: 'row', alignItems: 'center', gap: 5, paddingRight: 4 },
  selectedTag: { minHeight: 28, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 14, paddingHorizontal: 8, gap: 4 },
  tagText: { fontWeight: '700' },
  input: {
    width: 132,
    height: 32,
    paddingTop: 0,
    paddingBottom: 0,
    fontSize: 14,
    lineHeight: 18,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  addButton: { width: 30, height: 30, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  suggestedTag: { minHeight: 28, borderWidth: 1, borderRadius: 14, paddingHorizontal: 9, alignItems: 'center', justifyContent: 'center' },
});
