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
      <Text preset="caption" color="textSecondary" style={styles.label}>{t('entryTagsSection')}</Text>
      {normalizedSelectedTags.length > 0 ? (
        <View style={styles.selectedTags}>
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
        </View>
      ) : null}
      <View style={[styles.inputRow, { borderColor: theme.colors.border, backgroundColor: theme.colors.surface }]}>
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
      </View>
      {filteredSuggestedTags.length > 0 ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={styles.suggestedTags}>
          {filteredSuggestedTags.map((tag) => (
            <TouchableOpacity
              key={tag}
              onPress={() => handleToggleTag(tag)}
              style={[styles.suggestedTag, { borderColor: theme.colors.border, backgroundColor: theme.colors.surface }]}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: false }}
            >
              <Text preset="caption" color="text" style={styles.tagText}>#{tag}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { marginTop: 4, marginBottom: 12 },
  label: { fontWeight: '800', letterSpacing: 0.8, marginBottom: 8 },
  selectedTags: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  selectedTag: { minHeight: 32, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 16, paddingHorizontal: 10, gap: 5 },
  tagText: { fontWeight: '700' },
  inputRow: { minHeight: 40, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 8, paddingLeft: 12, paddingRight: 4 },
  input: { flex: 1, minHeight: 38, paddingVertical: 0, fontSize: 14 },
  addButton: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  suggestedTags: { gap: 8, paddingTop: 8, paddingRight: 8 },
  suggestedTag: { minHeight: 32, borderWidth: 1, borderRadius: 16, paddingHorizontal: 12, alignItems: 'center', justifyContent: 'center' },
});
