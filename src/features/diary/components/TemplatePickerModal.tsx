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
  Alert,
} from 'react-native';
import { Modal } from '@shared/components/Modal';
import { Text } from '@shared/components/Text';
import { useTheme } from '@providers/ThemeProvider';
import { TEMPLATES, TEMPLATE_CATEGORIES, Template } from '../domain/Template';

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
  const categoryKeys = Object.keys(TEMPLATE_CATEGORIES);
  const [activeCategory, setActiveCategory] = useState<string>(categoryKeys[0] || '');

  const templateIds = TEMPLATE_CATEGORIES[activeCategory] || [];
  const currentTemplates = templateIds.map((id) => TEMPLATES[id]!).filter(Boolean);

  const getTypeColor = (type: Template['type']) => {
    switch (type) {
      case 'reflection': return '#1E90FF';
      case 'gratitude':  return '#FF6B6B';
      case 'planning':   return '#4ECDC4';
      case 'review':     return '#45B7D1';
      case 'creative':   return '#96CEB4';
      default:           return theme.colors.tint;
    }
  };

  const handlePreview = (item: Template) => {
    Alert.alert(
      `${item.icon} ${item.title} Preview`,
      item.content,
      [{ text: 'Close', style: 'cancel' }, { text: 'Use Template', onPress: () => { onSelectTemplate(item); onClose(); } }]
    );
  };

  return (
    <Modal visible={visible} onDismiss={onClose} title="📝 Writing Templates" accessibilityLabel="Writing templates picker">
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
              accessibilityLabel={`Category ${cat}`}
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
          const accentColor = getTypeColor(item.type);
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
                <Text style={{ fontSize: 24, marginRight: 10 }}>{item.icon}</Text>
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
                  style={[styles.btn, { backgroundColor: accentColor }]}
                  onPress={() => {
                    onSelectTemplate(item);
                    onClose();
                  }}
                  activeOpacity={0.7}
                  accessibilityLabel={`Add ${item.title} template`}
                >
                  <Text preset="caption" style={{ color: '#fff', fontWeight: '700' }}>
                    + Insert Template
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.btnOutline, { borderColor: theme.colors.border }]}
                  onPress={() => handlePreview(item)}
                  activeOpacity={0.7}
                  accessibilityLabel={`Preview ${item.title}`}
                >
                  <Text preset="caption" color="textSecondary">
                    Preview
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
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  list: {
    paddingVertical: 4,
    gap: 10,
  },
  card: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
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
  btn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
  },
  btnOutline: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
});
