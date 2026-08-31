import { useState } from 'react';
import { StyleSheet, TouchableOpacity, View, type StyleProp, type ViewStyle } from 'react-native';
import { Modal } from '@shared/components/Modal';
import { Text } from '@shared/components/Text';
import { useTheme } from '@providers/ThemeProvider';
import { useTranslation } from '@/localization/i18n';

interface TagBadgeListProps {
  readonly tags: readonly string[];
  readonly maxVisible?: number;
  readonly onCover?: boolean;
  readonly compact?: boolean;
  readonly overflowPopup?: boolean;
  readonly style?: StyleProp<ViewStyle>;
  readonly testID?: string;
}

export function TagBadgeList({
  tags,
  maxVisible,
  onCover = false,
  compact = false,
  overflowPopup = false,
  style,
  testID,
}: TagBadgeListProps): React.JSX.Element | null {
  const theme = useTheme();
  const t = useTranslation();
  const [showOverflow, setShowOverflow] = useState(false);
  const visibleTags = maxVisible ? tags.slice(0, maxVisible) : tags;
  const hiddenTags = maxVisible ? tags.slice(maxVisible) : [];

  if (tags.length === 0) return null;

  const renderTagBadge = (tag: string, popup = false) => (
    <View
      key={tag}
      style={[
        styles.badge,
        compact && !popup && styles.compactBadge,
        popup && styles.popupBadge,
        {
          backgroundColor: onCover && !popup ? 'rgba(0, 0, 0, 0.42)' : theme.colors.surface,
          borderColor: onCover && !popup ? 'rgba(255, 255, 255, 0.28)' : theme.colors.border,
        },
      ]}
      accessibilityLabel={tag}
      testID={testID && !popup ? `${testID}-${tag}` : undefined}
    >
      <Text
        preset="caption"
        numberOfLines={1}
        color={onCover && !popup ? undefined : 'textSecondary'}
        style={[
          styles.badgeText,
          compact && !popup && styles.compactText,
          onCover && !popup && { color: theme.colors.stickerControlText },
        ]}
      >
        #{tag}
      </Text>
    </View>
  );

  return (
    <View style={[styles.row, compact && styles.compactRow, style]} testID={testID}>
      {visibleTags.map((tag) => renderTagBadge(tag))}
      {hiddenTags.length > 0 ? (
        <TouchableOpacity
          style={[
            styles.badge,
            compact && styles.compactBadge,
            {
              backgroundColor: onCover ? 'rgba(0, 0, 0, 0.42)' : theme.colors.surface,
              borderColor: onCover ? 'rgba(255, 255, 255, 0.28)' : theme.colors.border,
            },
          ]}
          disabled={!overflowPopup}
          activeOpacity={0.7}
          onPress={() => setShowOverflow(true)}
          accessibilityLabel={hiddenTags.map((tag) => `#${tag}`).join(', ')}
          accessibilityRole={overflowPopup ? 'button' : undefined}
          testID={testID ? `${testID}-overflow` : undefined}
        >
          <Text
            preset="caption"
            numberOfLines={1}
            color={onCover ? undefined : 'textSecondary'}
            style={[
              styles.badgeText,
              compact && styles.compactText,
              onCover && { color: theme.colors.stickerControlText },
            ]}
          >
            +{hiddenTags.length}
          </Text>
        </TouchableOpacity>
      ) : null}
      {overflowPopup && showOverflow ? (
        <Modal
          visible={showOverflow}
          onDismiss={() => setShowOverflow(false)}
          title={t('entryTagsSection')}
          accessibilityLabel={t('entryTagsSection')}
        >
          <View style={styles.popupRow}>
            {tags.map((tag) => renderTagBadge(tag, true))}
          </View>
        </Modal>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 6 },
  compactRow: { gap: 4 },
  badge: { minHeight: 26, maxWidth: 118, borderWidth: 1, borderRadius: 13, paddingHorizontal: 9, alignItems: 'center', justifyContent: 'center' },
  compactBadge: { minHeight: 22, maxWidth: 86, borderRadius: 11, paddingHorizontal: 7 },
  popupBadge: { maxWidth: 180 },
  badgeText: { fontWeight: '700' },
  compactText: { fontSize: 11, lineHeight: 14 },
  popupRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingBottom: 12 },
});
