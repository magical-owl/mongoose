/**
 * TemplatePickerModal
 *
 * Modal allowing users to browse and insert writing template questions into their diary entry.
 */

import { useState } from 'react';
import {
  View,
  TouchableOpacity,
  ScrollView,
  FlatList,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Modal } from '@shared/components/Modal';
import { Text } from '@shared/components/Text';
import { useTheme } from '@providers/ThemeProvider';
import { TEMPLATES, TEMPLATE_CATEGORIES, Template } from '../domain/Template';
import { useTranslation } from '@/localization/i18n';

interface TemplatePickerModalProps {
  readonly visible: boolean;
  readonly onClose: () => void;
  readonly onSelectTemplate: (template: Template) => void;
}

export function TemplatePickerModal({
  visible,
  onClose,
  onSelectTemplate,
}: TemplatePickerModalProps) {
  const theme = useTheme();
  const t = useTranslation();
  const categoryKeys = Object.keys(TEMPLATE_CATEGORIES);
  const [activeCategory, setActiveCategory] = useState<string>(categoryKeys[0] || '');

  const templateIds = TEMPLATE_CATEGORIES[activeCategory] || [];
  const currentTemplates = templateIds.map((id) => TEMPLATES[id]!).filter(Boolean);

  const getTypeIcon = (type: Template['type']): keyof typeof Ionicons.glyphMap => {
    switch (type) {
      case 'gratitude': return 'heart-outline';
      case 'planning': return 'checkmark-circle-outline';
      case 'review': return 'refresh-outline';
      case 'creative': return 'color-palette-outline';
      default: return 'document-text-outline';
    }
  };

  return (
    <Modal visible={visible} onDismiss={onClose} title={t('templatesTitle')} accessibilityLabel={t('templatesPickerA11y')} scrollable={false}>
      {/* Category Tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabs}
      >
        {categoryKeys.map((cat) => {
          const active = cat === activeCategory;
          return (
            <TouchableOpacity
              key={cat}
              style={[
                styles.tab,
                {
                  backgroundColor: active ? theme.colors.tint : 'transparent',
                  borderColor: active ? theme.colors.tint : theme.colors.border,
                },
              ]}
              onPress={() => setActiveCategory(cat)}
              accessibilityLabel={`${t('templateCategoryA11y')} ${cat}`}
            >
              <Text
                preset="caption"
                style={{ color: active ? '#fff' : theme.colors.text, fontWeight: '600' }}
              >
                {cat}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Templates List */}
      <FlatList
        data={currentTemplates}
        keyExtractor={(item) => item.id}
        style={{ maxHeight: 380 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => {
          return (
            <View
              style={[
                styles.card,
                {
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.border,
                },
              ]}
            >
              <View style={styles.cardHeader}>
                <View style={[styles.typeMark, { backgroundColor: theme.colors.tint + '18' }]}>
                  <Ionicons name={getTypeIcon(item.type)} size={19} color={theme.colors.tint} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text preset="label" color="text" style={{ fontWeight: '700' }}>
                    {item.title}
                  </Text>
                  <Text
                    preset="caption"
                    color="textSecondary"
                    numberOfLines={2}
                    style={{ marginTop: 2 }}
                  >
                    {item.description}
                  </Text>
                </View>
              </View>

              <View style={styles.cardActions}>
                <TouchableOpacity
                  style={[styles.btn, { backgroundColor: theme.colors.tint }]}
                  onPress={() => {
                    onSelectTemplate(item);
                    onClose();
                  }}
                  activeOpacity={0.7}
                  accessibilityLabel={`${t('templateAddA11y')}: ${item.title}`}
                >
                  <Ionicons name="add" size={16} color="#fff" />
                  <Text preset="caption" style={{ color: '#fff', fontWeight: '700' }}>
                    {t('templateInsert')}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        }}
      />
    </Modal>
  );
}

const styles = StyleSheet.create({
  tabs: {
    flexDirection: 'row',
    gap: 6,
    paddingBottom: 12,
    paddingHorizontal: 2,
  },
  tab: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  list: {
    paddingVertical: 4,
    gap: 10,
  },
  card: {
    borderRadius: 8,
    borderWidth: 1,
    padding: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  typeMark: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
  },
});
