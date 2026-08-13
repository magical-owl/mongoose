import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { CompanionType, COMPANION_OPTIONS } from '../domain/Companion';

interface CompanionPickerModalProps {
  visible: boolean;
  onClose: () => void;
  selectedCompanion: CompanionType;
  onSelectCompanion: (companion: CompanionType) => void;
}

export const CompanionPickerModal: React.FC<CompanionPickerModalProps> = ({
  visible,
  onClose,
  selectedCompanion,
  onSelectCompanion,
}) => {
  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Select AI Companion</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeText}>✕</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.listContainer}>
          {COMPANION_OPTIONS.map((item) => {
            const isSelected = item.id === selectedCompanion;
            return (
              <TouchableOpacity
                key={item.id}
                style={[styles.card, isSelected && styles.cardSelected]}
                onPress={() => {
                  onSelectCompanion(item.id);
                  onClose();
                }}
                activeOpacity={0.8}
              >
                <Text style={styles.avatar}>{item.avatar}</Text>
                <View style={styles.info}>
                  <Text style={styles.name}>{item.name}</Text>
                  <Text style={styles.description}>{item.description}</Text>
                  <Text style={styles.greeting}>"{item.greeting}"</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  title: {
    color: '#F8FAFC',
    fontSize: 20,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 4,
  },
  closeText: {
    color: '#94A3B8',
    fontSize: 20,
    fontWeight: 'bold',
  },
  listContainer: {
    padding: 16,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
  },
  cardSelected: {
    borderColor: '#10B981',
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
  },
  avatar: {
    fontSize: 48,
    marginRight: 16,
  },
  info: {
    flex: 1,
  },
  name: {
    color: '#F8FAFC',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  description: {
    color: '#94A3B8',
    fontSize: 13,
    marginBottom: 6,
  },
  greeting: {
    color: '#10B981',
    fontSize: 12,
    fontStyle: 'italic',
  },
});
