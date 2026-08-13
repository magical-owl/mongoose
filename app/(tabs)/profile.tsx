/**
 * Settings & Profile Screen
 *
 * Designed based on reference app Settings UI:
 * - Well-defined row options with icons, titles, subtitles, and right arrows
 * - Appearance modal with live Dark Mode toggle switch & theme mode selectors
 * - AI Companion picker modal
 * - Profile details edit modal
 * - Data & Storage management (JSON export & reset)
 * - Subscription / Pro membership
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
  Clipboard,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/providers/ThemeProvider';
import { Text } from '@shared/components/Text';
import { Modal } from '@shared/components/Modal';
import { Button } from '@shared/components/Button';
import { CompanionPickerModal } from '@/features/diary/components/CompanionPickerModal';
import { COMPANION_OPTIONS } from '@/features/diary/domain/Companion';
import { useDiary } from '@/features/diary/hooks/useDiary';
import { useProfileForm } from '@/features/profile/hooks/useProfileForm';
import { useSubscription } from '@/features/subscription/hooks/useSubscription';
import { PaywallModal } from '@/shared/components/PaywallModal';

export default function SettingsScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { entries, selectedCompanion, setSelectedCompanion, deleteDiaryEntry } = useDiary();
  const { isPro, activeTier } = useSubscription();
  const { profile, saveProfile, clearProfile } = useProfileForm();

  // Modals
  const [showAppearanceModal, setShowAppearanceModal] = useState(false);
  const [showCompanionModal, setShowCompanionModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showDataModal, setShowDataModal] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);

  // Profile form state
  const [displayName, setDisplayName] = useState(profile?.displayName ?? '');
  const [email, setEmail] = useState(profile?.email ?? '');
  const [bio, setBio] = useState(profile?.bio ?? '');

  const activeCompanion = COMPANION_OPTIONS.find((c) => c.id === selectedCompanion) || COMPANION_OPTIONS[0]!;

  const handleExportData = () => {
    try {
      const dataStr = JSON.stringify({ entries, profile }, null, 2);
      Clipboard.setString(dataStr);
      Alert.alert('✅ Exported', 'All diary entries and profile data copied to clipboard as JSON!');
    } catch {
      Alert.alert('Error', 'Failed to export data.');
    }
  };

  const handleResetApp = () => {
    Alert.alert(
      '⚠️ Reset App Data',
      'This will erase all your diary entries and profile data. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Yes, Reset Everything',
          style: 'destructive',
          onPress: async () => {
            for (const e of entries) {
              await deleteDiaryEntry(e.id);
            }
            await clearProfile();
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
      subtitle: theme.isDark ? 'Dark Mode (Active)' : 'Light Mode (Active)',
      icon: '🎨',
      onPress: () => setShowAppearanceModal(true),
    },
    {
      id: 'companion',
      title: 'AI Companion',
      subtitle: `${activeCompanion.avatar} ${activeCompanion.name}`,
      icon: '🤖',
      onPress: () => setShowCompanionModal(true),
    },
    {
      id: 'profile',
      title: 'Profile Details',
      subtitle: profile?.displayName || 'Set your display name and bio',
      icon: '👤',
      onPress: () => {
        setDisplayName(profile?.displayName ?? '');
        setEmail(profile?.email ?? '');
        setBio(profile?.bio ?? '');
        setShowProfileModal(true);
      },
    },
    {
      id: 'subscription',
      title: 'Membership & Pro',
      subtitle: isPro ? `Pro Plan (${activeTier.toUpperCase()})` : 'Free Plan (Tap to upgrade)',
      icon: '👑',
      onPress: () => setShowPaywall(true),
    },
    {
      id: 'data',
      title: 'Data & Storage',
      subtitle: `Export ${entries.length} entries or backup JSON`,
      icon: '💾',
      onPress: () => setShowDataModal(true),
    },
    {
      id: 'reset',
      title: 'Reset App',
      subtitle: 'Delete all entries and start fresh',
      icon: '🗑️',
      onPress: handleResetApp,
      isDestructive: true,
    },
  ];

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + 16,
          paddingBottom: insets.bottom + 32,
        }}
        showsVerticalScrollIndicator={false}
      >
        <Text preset="h1" style={[styles.title, { color: theme.colors.text }]}>
          ⚙️ Settings
        </Text>

        <View style={styles.optionsList}>
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
                <Text style={styles.optionIcon}>{option.icon}</Text>
                <View style={styles.optionText}>
                  <Text
                    preset="label"
                    style={{
                      fontSize: 16,
                      fontWeight: '600',
                      color: option.isDestructive ? theme.colors.error : theme.colors.text,
                    }}
                  >
                    {option.title}
                  </Text>
                  <Text preset="caption" color="textSecondary" style={{ marginTop: 2 }}>
                    {option.subtitle}
                  </Text>
                </View>
              </View>
              <Text style={{ fontSize: 20, color: theme.colors.textSecondary }}>›</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* ── 1. Appearance Modal ───────────────────────────────────────────── */}
      <Modal
        visible={showAppearanceModal}
        onDismiss={() => setShowAppearanceModal(false)}
        title="🎨 Appearance & Theme"
        accessibilityLabel="Appearance settings"
      >
        {/* Dark mode switch */}
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

        {/* Theme mode options */}
        <View style={{ paddingTop: 16 }}>
          <Text preset="caption" color="textSecondary" style={{ fontWeight: '700', marginBottom: 10 }}>
            THEME MODE PREFERENCE
          </Text>
          <View style={{ flexDirection: 'row', gap: 10 }}>
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
        title="👤 Profile Details"
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
        title="💾 Data & Storage"
        accessibilityLabel="Data and storage modal"
      >
        <View style={{ gap: 12, paddingVertical: 8 }}>
          <TouchableOpacity
            style={[styles.modalRowBtn, { borderColor: theme.colors.border, backgroundColor: theme.colors.surface }]}
            onPress={handleExportData}
          >
            <Text style={{ fontSize: 22, marginRight: 12 }}>📋</Text>
            <View style={{ flex: 1 }}>
              <Text preset="label" color="text">Export Data (JSON)</Text>
              <Text preset="caption" color="textSecondary">Copy all diary entries to clipboard</Text>
            </View>
          </TouchableOpacity>
        </View>
      </Modal>

      {/* ── 5. Paywall / Pro Modal ───────────────────────────────────────── */}
      <PaywallModal
        visible={showPaywall}
        onClose={() => setShowPaywall(false)}
        appName="Mongoose"
        subtitle="Unlock unlimited AI companion features, themes, and storage"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  title: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  optionsList: { flex: 1 },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 18,
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
    width: 32,
    textAlign: 'center',
  },
  optionText: { flex: 1 },
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
