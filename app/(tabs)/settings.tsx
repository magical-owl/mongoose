/**
 * Settings Screen
 *
 * Consolidated Settings & Profile screen:
 * - Title: ⚙️ Settings (24px bold)
 * - Defined option rows: Appearance, AI Companion, Profile Details, Data & Storage, Reset App
 * - Modals for Appearance, Companion, Profile Details and Data Export
 */

import { useState } from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Switch,
  Alert,
  TextInput,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/providers/ThemeProvider';
import { Text } from '@shared/components/Text';
import { Icon, type IconProps } from '@shared/components/Icon';
import { Modal } from '@shared/components/Modal';
import { Button } from '@shared/components/Button';
import { CompanionPickerModal } from '@/features/diary/components/CompanionPickerModal';
import { COMPANION_OPTIONS } from '@/features/diary/domain/Companion';
import { useDiary } from '@/features/diary/hooks/useDiary';
import { useProfileForm } from '@/features/profile/hooks/useProfileForm';
import { useAppStore } from '@/stores/useAppStore';
import { appLockService } from '@/services/AppLockService';
import { dataDeletionService } from '@/services/DataDeletionService';
import { diaryBackupService } from '@/services/DiaryBackupService';
import { useJournalExtras } from '@/features/journal/hooks/useJournalExtras';
import { accentColors, type AccentColor } from '@/theme/accents';

export default function SettingsScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { entries, selectedCompanion, setSelectedCompanion, saveDiaryEntry } = useDiary();
  const biometricLockEnabled = useAppStore((state) => state.biometricLockEnabled);
  const remoteAiConsent = useAppStore((state) => state.remoteAiConsent);
  const setRemoteAiConsent = useAppStore((state) => state.setRemoteAiConsent);
  const { profile, saveProfile } = useProfileForm();
  const { state: journalExtras, replace: replaceJournalExtras } = useJournalExtras();

  // Modals
  const [showAppearanceModal, setShowAppearanceModal] = useState(false);
  const [showCompanionModal, setShowCompanionModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showDataModal, setShowDataModal] = useState(false);
  const [showSecurityModal, setShowSecurityModal] = useState(false);

  // Profile form state
  const [displayName, setDisplayName] = useState(profile?.displayName ?? '');
  const [email, setEmail] = useState(profile?.email ?? '');
  const [bio, setBio] = useState(profile?.bio ?? '');

  const activeCompanion = COMPANION_OPTIONS.find((c) => c.id === selectedCompanion) || COMPANION_OPTIONS[0]!;

  const handleExportData = async () => {
    try {
      await diaryBackupService.exportJson(entries, profile, journalExtras);
      Alert.alert('Exported', 'Your complete diary JSON is ready to share.');
    } catch {
      Alert.alert('Error', 'Failed to export data.');
    }
  };

  const handleEncryptedExport = async () => {
    try {
      await diaryBackupService.exportEncrypted(entries, profile, journalExtras);
      Alert.alert('Encrypted backup created', 'Keep this backup file in a secure location.');
    } catch {
      Alert.alert('Error', 'Failed to create encrypted backup.');
    }
  };

  const handleEncryptedImport = async () => {
    try {
      const imported = await diaryBackupService.importEncrypted();
      if (!imported) return;
      Alert.alert('Restore backup?', `This will add ${imported.entries.length} entries and restore profile data.`, [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Restore',
          onPress: async () => {
            for (const entry of imported.entries) await saveDiaryEntry(entry);
            if (imported.profile) {
              await saveProfile({
                displayName: imported.profile.displayName,
                email: imported.profile.email,
                bio: imported.profile.bio,
              });
            }
            if (imported.journalExtras) await replaceJournalExtras(imported.journalExtras);
            Alert.alert('Restored', 'Your encrypted backup has been restored.');
          },
        },
      ]);
    } catch {
      Alert.alert('Error', 'The backup could not be decrypted or was invalid.');
    }
  };

  const handleBiometricToggle = async (enabled: boolean) => {
    if (enabled) {
      const activated = await appLockService.enable();
      if (!activated) Alert.alert('Biometrics unavailable', 'Set up Face ID, Touch ID, or device biometrics first.');
    } else {
      appLockService.disable();
    }
  };

  const handleResetApp = () => {
    Alert.alert(
      '⚠️ Reset App',
      'This will delete all your diary entries and profile data. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Yes, Reset Everything',
          style: 'destructive',
          onPress: async () => {
            await dataDeletionService.deleteAll();
            Alert.alert('✅ App Reset', 'All data has been cleared.');
          },
        },
      ]
    );
  };

  const handleSaveProfileDetails = async () => {
    await saveProfile({ displayName, email, bio });
    setShowProfileModal(false);
    Alert.alert('Saved', 'Profile updated successfully.');
  };

  const settingsOptions = [
    {
      id: 'appearance',
      title: 'Appearance',
      subtitle: 'Dark mode, theme',
      icon: 'color-palette-outline' as IconProps['name'],
      onPress: () => setShowAppearanceModal(true),
    },
    {
      id: 'companion',
      title: 'AI Companion',
      subtitle: `${activeCompanion.avatar} ${activeCompanion.name}`,
      icon: 'sparkles-outline' as IconProps['name'],
      onPress: () => setShowCompanionModal(true),
    },
    {
      id: 'profile',
      title: 'Profile Details',
      subtitle: profile?.displayName || 'Set display name and bio',
      icon: 'person-outline' as IconProps['name'],
      onPress: () => {
        setDisplayName(profile?.displayName ?? '');
        setEmail(profile?.email ?? '');
        setBio(profile?.bio ?? '');
        setShowProfileModal(true);
      },
    },
    {
      id: 'security',
      title: 'Security & Privacy',
      subtitle: 'Biometric lock and AI privacy controls',
      icon: 'lock-closed-outline' as IconProps['name'],
      onPress: () => setShowSecurityModal(true),
    },
    {
      id: 'data',
      title: 'Data & Storage',
      subtitle: `Export ${entries.length} entries or backup JSON`,
      icon: 'archive-outline' as IconProps['name'],
      onPress: () => setShowDataModal(true),
    },
    {
      id: 'reset',
      title: 'Reset App',
      subtitle: 'Delete all entries and start fresh',
      icon: 'trash-outline' as IconProps['name'],
      onPress: handleResetApp,
      isDestructive: true,
    },
  ];

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + 16,
          paddingBottom: insets.bottom + 80,
        }}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.title, { color: theme.colors.text }]}>
          Settings
        </Text>

        <View style={styles.optionsContainer}>
          {settingsOptions.map((option) => (
            <TouchableOpacity
              key={option.id}
              style={[
                styles.optionRow,
                { borderBottomColor: theme.colors.border },
              ]}
              onPress={option.onPress}
              activeOpacity={0.7}
              accessibilityLabel={`${option.title}, ${option.subtitle}`}
              accessibilityRole="button"
            >
              <View style={styles.optionLeft}>
                <Icon name={option.icon} size={22} color={option.isDestructive ? 'error' : 'textSecondary'} style={styles.optionIcon} />
                <View style={styles.optionText}>
                  <Text
                    style={[
                      styles.optionTitle,
                      { color: option.isDestructive ? theme.colors.error : theme.colors.text },
                    ]}
                  >
                    {option.title}
                  </Text>
                  <Text style={[styles.optionSubtitle, { color: theme.colors.textSecondary }]}>
                    {option.subtitle}
                  </Text>
                </View>
              </View>
              <Text style={[styles.arrow, { color: theme.colors.textSecondary }]}>
                ›
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* ── 1. Appearance Modal ───────────────────────────────────────────── */}
      <Modal
        visible={showAppearanceModal}
        onDismiss={() => setShowAppearanceModal(false)}
        title="Appearance & Theme"
        accessibilityLabel="Appearance settings"
      >
        <View style={[styles.modalRow, { borderBottomColor: theme.colors.border }]}>
          <View style={{ flex: 1 }}>
            <Text preset="label" color="text" style={{ fontSize: 16, fontWeight: '600' }}>
              🌙 Dark Mode
            </Text>
          <Text preset="caption" color="textSecondary" style={{ marginTop: 2 }}>
              Toggle between light and dark themes
            </Text>
          </View>

          <Switch
            value={theme.isDark}
            onValueChange={(value) => theme.setThemeMode(value ? 'dark' : 'light')}
            trackColor={{ false: theme.colors.border, true: theme.colors.tint }}
            thumbColor="#fff"
          />
        </View>

        <View style={{ paddingTop: 16 }}>
          <Text preset="caption" color="textSecondary" style={{ fontWeight: '700', marginBottom: 10 }}>
            THEME MODE PREFERENCE
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
            {(['light', 'dark', 'system'] as const).map((m) => {
              const active = theme.mode === m;
              return (
                <TouchableOpacity
                  key={m}
                  onPress={() => theme.setThemeMode(m)}
                  style={{
                    flex: 1,
                    paddingVertical: 12,
                    borderRadius: 10,
                    borderWidth: active ? 2 : 1,
                    borderColor: active ? theme.colors.tint : theme.colors.border,
                    backgroundColor: active ? theme.colors.tint + '18' : theme.colors.surface,
                    alignItems: 'center',
                  }}
                >
                  <Text
                    preset="caption"
                    style={{
                      fontWeight: '700',
                      textTransform: 'capitalize',
                      color: active ? theme.colors.tint : theme.colors.text,
                    }}
                  >
                    {m === 'light' ? '☀️ Light' : m === 'dark' ? '🌙 Dark' : '📱 System'}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={{ paddingTop: 20 }}>
          <Text preset="caption" color="textSecondary" style={{ fontWeight: '700', marginBottom: 10 }}>
            ACCENT COLOR
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
            {(['red', 'orange', 'yellow', 'green', 'blue', 'indigo', 'violet', 'teal', 'coral', 'rose', 'plum', 'mint', 'slate'] as AccentColor[]).map((color) => {
              const active = theme.accentColor === color;
              return (
                <TouchableOpacity
                  key={color}
                  onPress={() => theme.setAccentColor(color)}
                  accessibilityRole="button"
                  accessibilityLabel={`${accentColors[color].label} accent color${active ? ', selected' : ''}`}
                  style={[styles.colorSwatch, { backgroundColor: accentColors[color][theme.isDark ? 'dark' : 'light'], borderColor: active ? theme.colors.text : theme.colors.border, borderWidth: active ? 3 : 1 }]}
                />
              );
            })}
          </View>
          <Text preset="caption" color="textSecondary" style={{ marginTop: 8 }}>
            Choose the accent used across buttons, highlights, and navigation.
          </Text>
        </View>
      </Modal>

      <Modal
        visible={showSecurityModal}
        onDismiss={() => setShowSecurityModal(false)}
        title="Security & Privacy"
        accessibilityLabel="Security and privacy settings"
      >
        <View style={{ gap: 16, paddingVertical: 8 }}>
          <View style={[styles.modalRow, { borderBottomColor: theme.colors.border }]}>
            <View style={{ flex: 1 }}>
              <Text preset="label" color="text" style={{ fontSize: 16, fontWeight: '600' }}>Biometric App Lock</Text>
              <Text preset="caption" color="textSecondary" style={{ marginTop: 2 }}>Require Face ID, Touch ID, or device biometrics before opening the diary.</Text>
            </View>
            <Switch value={biometricLockEnabled} onValueChange={handleBiometricToggle} trackColor={{ false: theme.colors.border, true: theme.colors.tint }} thumbColor="#fff" />
          </View>
          <View style={[styles.modalRow, { borderBottomColor: theme.colors.border }]}>
            <View style={{ flex: 1 }}>
              <Text preset="label" color="text" style={{ fontSize: 16, fontWeight: '600' }}>Remote AI Summaries</Text>
              <Text preset="caption" color="textSecondary" style={{ marginTop: 2 }}>Allow only when the configured endpoint confirms zero data retention.</Text>
            </View>
            <Switch value={remoteAiConsent} onValueChange={setRemoteAiConsent} trackColor={{ false: theme.colors.border, true: theme.colors.tint }} thumbColor="#fff" />
          </View>
        </View>
      </Modal>

      {/* ── 2. Companion Modal ───────────────────────────────────────────── */}
      <CompanionPickerModal
        visible={showCompanionModal}
        onClose={() => setShowCompanionModal(false)}
        selectedCompanion={selectedCompanion}
        onSelectCompanion={setSelectedCompanion}
      />

      {/* ── 3. Profile Details Modal ─────────────────────────────────────── */}
      <Modal
        visible={showProfileModal}
        onDismiss={() => setShowProfileModal(false)}
        title="Profile Details"
        accessibilityLabel="Profile details modal"
      >
        <View style={{ gap: 12, paddingVertical: 8 }}>
          <View>
            <Text preset="caption" color="textSecondary" style={{ marginBottom: 4 }}>Display Name</Text>
            <TextInput
              value={displayName}
              onChangeText={setDisplayName}
              placeholder="Your name"
              placeholderTextColor={theme.colors.textSecondary}
              style={[
                styles.modalInput,
                { color: theme.colors.text, borderColor: theme.colors.border, backgroundColor: theme.colors.surface },
              ]}
            />
          </View>
          <View>
            <Text preset="caption" color="textSecondary" style={{ marginBottom: 4 }}>Email</Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
              placeholderTextColor={theme.colors.textSecondary}
              style={[
                styles.modalInput,
                { color: theme.colors.text, borderColor: theme.colors.border, backgroundColor: theme.colors.surface },
              ]}
            />
          </View>
          <View>
            <Text preset="caption" color="textSecondary" style={{ marginBottom: 4 }}>Bio</Text>
            <TextInput
              value={bio}
              onChangeText={setBio}
              placeholder="Write a short bio…"
              multiline
              numberOfLines={3}
              placeholderTextColor={theme.colors.textSecondary}
              style={[
                styles.modalInput,
                { color: theme.colors.text, borderColor: theme.colors.border, backgroundColor: theme.colors.surface, minHeight: 70 },
              ]}
            />
          </View>
          <Button label="Save Changes" variant="primary" onPress={handleSaveProfileDetails} style={{ marginTop: 8 }} />
        </View>
      </Modal>

      {/* ── 4. Data & Storage Modal ─────────────────────────────────────── */}
      <Modal
        visible={showDataModal}
        onDismiss={() => setShowDataModal(false)}
        title="Data & Storage"
        accessibilityLabel="Data and storage modal"
      >
        <View style={{ gap: 12, paddingVertical: 8 }}>
          <TouchableOpacity
            style={[styles.modalRowBtn, { borderColor: theme.colors.border, backgroundColor: theme.colors.surface }]}
            onPress={() => { void handleExportData(); }}
          >
            <Text style={{ fontSize: 22, marginRight: 12 }}>📋</Text>
            <View style={{ flex: 1 }}>
              <Text preset="label" color="text">Export Data (JSON)</Text>
              <Text preset="caption" color="textSecondary">Share a complete JSON export file</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.modalRowBtn, { borderColor: theme.colors.border, backgroundColor: theme.colors.surface }]}
            onPress={() => { void handleEncryptedExport(); }}
          >
            <Text style={{ fontSize: 22, marginRight: 12 }}>🔐</Text>
            <View style={{ flex: 1 }}>
              <Text preset="label" color="text">Create Encrypted Backup</Text>
              <Text preset="caption" color="textSecondary">AES-256-GCM backup for private storage</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.modalRowBtn, { borderColor: theme.colors.border, backgroundColor: theme.colors.surface }]}
            onPress={() => { void handleEncryptedImport(); }}
          >
            <Text style={{ fontSize: 22, marginRight: 12 }}>📥</Text>
            <View style={{ flex: 1 }}>
              <Text preset="label" color="text">Restore Encrypted Backup</Text>
              <Text preset="caption" color="textSecondary">Import entries from a backup file</Text>
            </View>
          </TouchableOpacity>
        </View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  optionsContainer: {
    flex: 1,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  optionIcon: {
    fontSize: 24,
    marginRight: 16,
    width: 30,
    textAlign: 'center',
  },
  optionText: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  optionSubtitle: {
    fontSize: 14,
  },
  colorSwatch: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  arrow: {
    fontSize: 20,
    fontWeight: '300',
  },
  modalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  modalInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
  },
  modalRowBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
});
