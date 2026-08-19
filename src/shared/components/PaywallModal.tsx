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
import { useTheme } from '@/providers/ThemeProvider';

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
  const theme = useTheme();
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
  const ctaTextColor = theme.isDark ? theme.colors.background : theme.colors.card;

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
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Text style={[styles.closeText, { color: theme.colors.textSecondary, fontFamily: theme.fontFamily }]}>✕</Text>
            </TouchableOpacity>
            <Text style={[styles.badge, { color: theme.colors.tint, fontFamily: theme.fontFamily }]}>{t('premiumPaywallBadge')}</Text>
            <Text style={[styles.title, { color: theme.colors.text, fontFamily: theme.fontFamily, fontSize: theme.fontSizes.xxl }]}>{displayTitle}</Text>
            <Text style={[styles.subtitle, { color: theme.colors.textSecondary, fontFamily: theme.fontFamily, fontSize: theme.fontSizes.sm }]}>{displaySubtitle}</Text>
          </View>

          {/* Features List */}
          <View style={[styles.featuresContainer, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
            {displayFeatures.map((item, index) => (
              <View key={index} style={styles.featureRow}>
                <Text style={[styles.featureText, { color: theme.colors.text, fontFamily: theme.fontFamily, fontSize: theme.fontSizes.base }]}>{item}</Text>
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
                  style={[
                    styles.packageCard,
                    {
                      backgroundColor: isSelected ? `${theme.colors.tint}18` : theme.colors.surface,
                      borderColor: isSelected ? theme.colors.tint : theme.colors.border,
                    },
                  ]}
                  onPress={() => setSelectedPkg(pkg)}
                  activeOpacity={0.8}
                >
                  {pkg.badge && (
                    <View style={[styles.packageBadge, { backgroundColor: theme.colors.tint }]}>
                      <Text style={[styles.packageBadgeText, { color: ctaTextColor, fontFamily: theme.fontFamily }]}>{pkg.badge}</Text>
                    </View>
                  )}
                  <View style={styles.packageHeader}>
                    <Text style={[styles.packageTitle, { color: theme.colors.text, fontFamily: theme.fontFamily, fontSize: theme.fontSizes.base }]}>{pkg.title}</Text>
                    <Text style={[styles.packagePrice, { color: theme.colors.tint, fontFamily: theme.fontFamily, fontSize: theme.fontSizes.base }]}>{pkg.priceString}</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* CTA Action Button */}
          <TouchableOpacity
            style={[styles.ctaButton, { backgroundColor: theme.colors.tint }]}
            onPress={handlePurchase}
            disabled={isLoading}
            activeOpacity={0.8}
          >
            {isLoading ? (
              <ActivityIndicator color={ctaTextColor} />
            ) : (
              <Text style={[styles.ctaButtonText, { color: ctaTextColor, fontFamily: theme.fontFamily, fontSize: theme.fontSizes.lg }]}>
                {t('premiumLifetimeCta')}
              </Text>
            )}
          </TouchableOpacity>

          {/* Restore Purchases Button (Mandatory App Store Guideline 3.1.1) */}
          <TouchableOpacity style={styles.restoreButton} onPress={handleRestore} disabled={isLoading}>
            <Text style={[styles.restoreText, { color: theme.colors.textSecondary, fontFamily: theme.fontFamily, fontSize: theme.fontSizes.sm }]}>{t('premiumRestoreButton')}</Text>
          </TouchableOpacity>

          {isPro && config.isDev ? (
            <TouchableOpacity style={styles.revertButton} onPress={handleRevertToFree} disabled={isLoading}>
              <Text style={[styles.revertText, { color: theme.colors.error, fontFamily: theme.fontFamily, fontSize: theme.fontSizes.sm }]}>{t('premiumRevertToFreeButton')}</Text>
            </TouchableOpacity>
          ) : null}

          {/* Legal Footer */}
          <Text style={[styles.legalFooter, { color: theme.colors.textTertiary, fontFamily: theme.fontFamily, fontSize: theme.fontSizes.xs }]}>
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
    fontSize: 20,
    fontWeight: 'bold',
  },
  badge: {
    fontWeight: '700',
    fontSize: 12,
    letterSpacing: 1.5,
    marginBottom: 8,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
  },
  featuresContainer: {
    width: '100%',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
  },
  featureRow: {
    paddingVertical: 8,
  },
  featureText: {
    fontSize: 15,
    fontWeight: '500',
  },
  packagesContainer: {
    width: '100%',
    marginBottom: 20,
  },
  packageCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1.5,
    position: 'relative',
  },
  packageBadge: {
    position: 'absolute',
    top: -10,
    right: 16,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  packageBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  packageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  packageTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  packagePrice: {
    fontSize: 16,
    fontWeight: '700',
  },
  ctaButton: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  ctaButtonText: {
    fontSize: 17,
    fontWeight: 'bold',
  },
  restoreButton: {
    paddingVertical: 8,
    marginBottom: 20,
  },
  restoreText: {
    fontSize: 14,
    textDecorationLine: 'underline',
  },
  revertButton: {
    paddingVertical: 8,
    marginBottom: 20,
  },
  revertText: {
    fontSize: 14,
    textDecorationLine: 'underline',
  },
  legalFooter: {
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 16,
  },
});
