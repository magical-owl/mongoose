import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@providers/ThemeProvider';
import { Text } from '@shared/components/Text';
import { SectionLabel } from '@shared/components/SectionLabel';
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
  const [isTagInputFocused, setIsTagInputFocused] = useState(false);
  const inputWidth = useRef(new Animated.Value(42)).current;

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
  const isTagInputExpanded = isTagInputFocused || Boolean(tagInput);

  useEffect(() => {
    Animated.timing(inputWidth, {
      toValue: isTagInputExpanded ? 132 : 42,
      duration: 180,
      useNativeDriver: false,
    }).start();
  }, [inputWidth, isTagInputExpanded]);

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
      <SectionLabel>
        {t('entryTagsSection')}
      </SectionLabel>
      <View style={styles.selectorRow}>
        <Animated.View style={[styles.inputWrap, { width: inputWidth, backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
          {!tagInput && !isTagInputFocused ? (
            <View pointerEvents="none" style={styles.placeholderIcon}>
              <Ionicons name="pricetag-outline" size={18} color={theme.colors.tint} />
            </View>
          ) : null}
          <TextInput
            value={tagInput}
            onChangeText={setTagInput}
            placeholder=""
            placeholderTextColor={theme.colors.textSecondary}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="done"
            onSubmitEditing={handleAddTag}
            onFocus={() => setIsTagInputFocused(true)}
            onBlur={() => setIsTagInputFocused(false)}
            style={[styles.input, { color: theme.colors.text, fontFamily: theme.fontFamily }]}
            accessibilityLabel={t('entryTagInputA11y')}
          />
        </Animated.View>
        <TouchableOpacity
          onPress={handleAddTag}
          disabled={!canAddTag}
          style={[
            styles.addButton,
            {
              backgroundColor: canAddTag ? theme.colors.tint : theme.colors.surface,
              borderColor: canAddTag ? theme.colors.tint : theme.colors.border,
            },
          ]}
          accessibilityRole="button"
          accessibilityLabel={t('entryTagAddA11y')}
        >
          <Ionicons name="add" size={18} color={canAddTag ? theme.colors.background : theme.colors.textSecondary} />
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
              <Text preset="caption" style={[styles.tagText, { color: theme.colors.tint }]}>#{tag}</Text>
              <Ionicons name="close" size={13} color={theme.colors.tint} />
            </TouchableOpacity>
          ))}
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
  selectedTag: { minHeight: 34, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 17, paddingHorizontal: 12, gap: 5 },
  tagText: { fontSize: 14, lineHeight: 18, fontWeight: '800' },
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
  addButton: { width: 34, height: 34, borderRadius: 17, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  suggestedTag: { minHeight: 34, borderWidth: 1, borderRadius: 17, paddingHorizontal: 12, alignItems: 'center', justifyContent: 'center' },
});
