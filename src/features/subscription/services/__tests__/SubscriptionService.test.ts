import { SubscriptionService } from '../SubscriptionService';
import { useSubscriptionStore, DEFAULT_SUBSCRIPTION_PACKAGES } from '@stores/useSubscriptionStore';

describe('SubscriptionService', () => {
  let service: SubscriptionService;

  beforeEach(() => {
    service = new SubscriptionService();
    useSubscriptionStore.getState().reset();
  });

  it('should initialize with default free tier entitlement', async () => {
    const result = await service.initialize();
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.isPro).toBe(false);
      expect(result.data.activeTier).toBe('free');
    }
  });

  it('should return available subscription packages', async () => {
    const result = await service.getPackages();
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.length).toBeGreaterThan(0);
      expect(result.data[0]?.tier).toBe('pro_monthly');
      expect(result.data[1]?.tier).toBe('pro_yearly');
      expect(result.data[2]?.tier).toBe('pro_lifetime');
    }
  });

  it('should successfully purchase a Pro Monthly package', async () => {
    const monthlyPkg = DEFAULT_SUBSCRIPTION_PACKAGES[0]!;
    const result = await service.purchasePackage(monthlyPkg);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.isPro).toBe(true);
      expect(result.data.activeTier).toBe('pro_monthly');
    }
    expect(useSubscriptionStore.getState().isPro).toBe(true);
  });

  it('should successfully purchase a Pro Lifetime package', async () => {
    const lifetimePkg = DEFAULT_SUBSCRIPTION_PACKAGES[2]!;
    const result = await service.purchasePackage(lifetimePkg);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.isPro).toBe(true);
      expect(result.data.activeTier).toBe('pro_lifetime');
      expect(result.data.willRenew).toBe(false);
    }
  });

  it('should support Restore Purchases complying with App Store Guideline 3.1.1', async () => {
    // First make a purchase
    await service.purchasePackage(DEFAULT_SUBSCRIPTION_PACKAGES[1]!);

    // Then call restore
    const restoreResult = await service.restorePurchases();
    expect(restoreResult.success).toBe(true);
    if (restoreResult.success) {
      expect(restoreResult.data.isPro).toBe(true);
      expect(restoreResult.data.activeTier).toBe('pro_yearly');
    }
  });
});
