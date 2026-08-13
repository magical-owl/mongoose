import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  SafeAreaView,
  Alert,
} from 'react-native';
import { useSubscription } from '../../features/subscription/hooks/useSubscription';
import { SubscriptionPackage } from '../../features/subscription/domain/Subscription';

export interface PaywallModalProps {
  visible: boolean;
  onClose: () => void;
  appName?: string;
  title?: string;
  subtitle?: string;
  features?: string[];
  onSuccess?: () => void;
}

const GENERIC_PRO_FEATURES = [
  '✨ Unlimited Access to All Premium Features',
  '🤖 Advanced AI Assistance & Insights',
  '🔒 Enhanced Security & Biometric Protection',
  '☁️ Encrypted Sync & Cloud Backup',
  '⚡ Ad-Free Experience & Priority Support',
];

export const PaywallModal: React.FC<PaywallModalProps> = ({
  visible,
  onClose,
  appName = 'App',
  title,
  subtitle = 'Get unlimited access to all premium features',
  features = GENERIC_PRO_FEATURES,
  onSuccess,
}) => {
  const displayTitle = title || `Unlock ${appName} Pro`;
  const { packages, isLoading, purchasePackage, restorePurchases } = useSubscription();
  const [selectedPkg, setSelectedPkg] = useState<SubscriptionPackage | null>(
    packages[1] || packages[0] || null // Default to Annual / Best Value
  );

  const handlePurchase = async () => {
    if (!selectedPkg) return;
    const result = await purchasePackage(selectedPkg);
    if (result.success) {
      Alert.alert('🎉 Welcome to Pro!', 'Your subscription is now active.', [
        {
          text: 'OK',
          onPress: () => {
            onSuccess?.();
            onClose();
          },
        },
      ]);
    } else {
      Alert.alert('Purchase Failed', result.error.message);
    }
  };

  const handleRestore = async () => {
    const result = await restorePurchases();
    if (result.success) {
      if (result.data.isPro) {
        Alert.alert('Purchases Restored', 'Your Pro subscription has been restored.', [
          {
            text: 'OK',
            onPress: () => {
              onSuccess?.();
              onClose();
            },
          },
        ]);
      } else {
        Alert.alert('No Purchases Found', 'No active subscription was found for this Apple ID.');
      }
    } else {
      Alert.alert('Restore Failed', result.error.message);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
            <Text style={styles.badge}>PRO UNLOCK</Text>
            <Text style={styles.title}>{displayTitle}</Text>
            <Text style={styles.subtitle}>{subtitle}</Text>
          </View>

          {/* Features List */}
          <View style={styles.featuresContainer}>
            {features.map((item, index) => (
              <View key={index} style={styles.featureRow}>
                <Text style={styles.featureText}>{item}</Text>
              </View>
            ))}
          </View>

          {/* Package Selector (Monthly, Yearly, Lifetime) */}
          <View style={styles.packagesContainer}>
            {packages.map((pkg) => {
              const isSelected = selectedPkg?.id === pkg.id;
              return (
                <TouchableOpacity
                  key={pkg.id}
                  style={[styles.packageCard, isSelected && styles.packageCardSelected]}
                  onPress={() => setSelectedPkg(pkg)}
                  activeOpacity={0.8}
                >
                  {pkg.badge && (
                    <View style={styles.packageBadge}>
                      <Text style={styles.packageBadgeText}>{pkg.badge}</Text>
                    </View>
                  )}
                  <View style={styles.packageHeader}>
                    <Text style={styles.packageTitle}>{pkg.title}</Text>
                    <Text style={styles.packagePrice}>{pkg.priceString}</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* CTA Action Button */}
          <TouchableOpacity
            style={styles.ctaButton}
            onPress={handlePurchase}
            disabled={isLoading}
            activeOpacity={0.8}
          >
            {isLoading ? (
              <ActivityIndicator color="#0F172A" />
            ) : (
              <Text style={styles.ctaButtonText}>
                {selectedPkg?.period === 'lifetime' ? 'Unlock Lifetime Access' : 'Start Pro Subscription'}
              </Text>
            )}
          </TouchableOpacity>

          {/* Restore Purchases Button (Mandatory App Store Guideline 3.1.1) */}
          <TouchableOpacity style={styles.restoreButton} onPress={handleRestore} disabled={isLoading}>
            <Text style={styles.restoreText}>Restore Purchases</Text>
          </TouchableOpacity>

          {/* Legal Footer */}
          <Text style={styles.legalFooter}>
            Subscriptions auto-renew unless canceled at least 24 hours before the end of the current period.
            Manage subscriptions in Apple ID Settings.
          </Text>
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
  scrollContent: {
    padding: 24,
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
    width: '100%',
  },
  closeButton: {
    alignSelf: 'flex-end',
    padding: 8,
  },
  closeText: {
    color: '#94A3B8',
    fontSize: 20,
    fontWeight: 'bold',
  },
  badge: {
    color: '#10B981',
    fontWeight: '700',
    fontSize: 12,
    letterSpacing: 1.5,
    marginBottom: 8,
  },
  title: {
    color: '#F8FAFC',
    fontSize: 26,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    color: '#94A3B8',
    fontSize: 14,
    textAlign: 'center',
  },
  featuresContainer: {
    width: '100%',
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  featureRow: {
    paddingVertical: 8,
  },
  featureText: {
    color: '#F8FAFC',
    fontSize: 15,
    fontWeight: '500',
  },
  packagesContainer: {
    width: '100%',
    marginBottom: 20,
  },
  packageCard: {
    backgroundColor: 'rgba(30, 41, 59, 0.6)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    position: 'relative',
  },
  packageCardSelected: {
    borderColor: '#10B981',
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
  },
  packageBadge: {
    position: 'absolute',
    top: -10,
    right: 16,
    backgroundColor: '#8B5CF6',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  packageBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  packageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  packageTitle: {
    color: '#F8FAFC',
    fontSize: 16,
    fontWeight: 'bold',
  },
  packagePrice: {
    color: '#10B981',
    fontSize: 16,
    fontWeight: '700',
  },
  ctaButton: {
    width: '100%',
    backgroundColor: '#10B981',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  ctaButtonText: {
    color: '#0F172A',
    fontSize: 17,
    fontWeight: 'bold',
  },
  restoreButton: {
    paddingVertical: 8,
    marginBottom: 20,
  },
  restoreText: {
    color: '#94A3B8',
    fontSize: 14,
    textDecorationLine: 'underline',
  },
  legalFooter: {
    color: '#64748B',
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 16,
  },
});
