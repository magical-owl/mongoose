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
import { useTranslation } from '@/localization/i18n';
import { config } from '@/config/ConfigService';

export interface PaywallModalProps {
  visible: boolean;
  onClose: () => void;
  appName?: string;
  title?: string;
  subtitle?: string;
  features?: string[];
  onSuccess?: () => void;
}

export const PaywallModal: React.FC<PaywallModalProps> = ({
  visible,
  onClose,
  appName = 'App',
  title,
  subtitle,
  features,
  onSuccess,
}) => {
  const t = useTranslation();
  const displayTitle = title || `${t('premiumPaywallUnlockPrefix')} ${appName} Premium`;
  const displaySubtitle = subtitle || t('premiumPaywallSubtitle');
  const displayFeatures = features ?? [
    t('premiumPaywallFeatureEntries'),
    t('premiumPaywallFeatureStickers'),
    t('premiumPaywallFeatureInsights'),
    t('premiumPaywallFeatureThemes'),
    t('premiumPaywallFeatureOffline'),
  ];
  const { isPro, packages, isLoading, purchasePackage, restorePurchases, revertToFree } = useSubscription();
  const [selectedPkg, setSelectedPkg] = useState<SubscriptionPackage | null>(
    packages[0] || null
  );

  const handlePurchase = async () => {
    if (!selectedPkg) return;
    const result = await purchasePackage(selectedPkg);
    if (result.success) {
      Alert.alert(t('premiumPurchaseSuccessTitle'), t('premiumPurchaseSuccessMessage'), [
        {
          text: t('commonOk'),
          onPress: () => {
            onSuccess?.();
            onClose();
          },
        },
      ]);
    } else {
      Alert.alert(t('premiumPurchaseFailedTitle'), result.error.message);
    }
  };

  const handleRestore = async () => {
    const result = await restorePurchases();
    if (result.success) {
      if (result.data.isPro) {
        Alert.alert(t('premiumRestoreSuccessTitle'), t('premiumRestoreSuccessMessage'), [
          {
            text: t('commonOk'),
            onPress: () => {
              onSuccess?.();
              onClose();
            },
          },
        ]);
      } else {
        Alert.alert(t('premiumNoPurchasesTitle'), t('premiumNoPurchasesMessage'));
      }
    } else {
      Alert.alert(t('premiumRestoreFailedTitle'), result.error.message);
    }
  };

  const handleRevertToFree = async () => {
    const result = await revertToFree();
    if (result.success) {
      Alert.alert(t('premiumRevertSuccessTitle'), t('premiumRevertSuccessMessage'));
      onClose();
    } else {
      Alert.alert(t('premiumRevertFailedTitle'), result.error.message);
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
            <Text style={styles.badge}>{t('premiumPaywallBadge')}</Text>
            <Text style={styles.title}>{displayTitle}</Text>
            <Text style={styles.subtitle}>{displaySubtitle}</Text>
          </View>

          {/* Features List */}
          <View style={styles.featuresContainer}>
            {displayFeatures.map((item, index) => (
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
                {t('premiumLifetimeCta')}
              </Text>
            )}
          </TouchableOpacity>

          {/* Restore Purchases Button (Mandatory App Store Guideline 3.1.1) */}
          <TouchableOpacity style={styles.restoreButton} onPress={handleRestore} disabled={isLoading}>
            <Text style={styles.restoreText}>{t('premiumRestoreButton')}</Text>
          </TouchableOpacity>

          {isPro && config.isDev ? (
            <TouchableOpacity style={styles.revertButton} onPress={handleRevertToFree} disabled={isLoading}>
              <Text style={styles.revertText}>{t('premiumRevertToFreeButton')}</Text>
            </TouchableOpacity>
          ) : null}

          {/* Legal Footer */}
          <Text style={styles.legalFooter}>
            {t('premiumLegalFooter')}
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
  revertButton: {
    paddingVertical: 8,
    marginBottom: 20,
  },
  revertText: {
    color: '#FCA5A5',
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
