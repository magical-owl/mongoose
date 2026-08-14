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

  it('does not grant Pro before native billing is configured', async () => {
    const monthlyPkg = DEFAULT_SUBSCRIPTION_PACKAGES[0]!;
    const result = await service.purchasePackage(monthlyPkg);

    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.code).toBe('PURCHASE_NOT_CONFIGURED');
    expect(useSubscriptionStore.getState().isPro).toBe(false);
  });

  it('does not grant lifetime Pro before native billing is configured', async () => {
    const lifetimePkg = DEFAULT_SUBSCRIPTION_PACKAGES[2]!;
    const result = await service.purchasePackage(lifetimePkg);

    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.code).toBe('PURCHASE_NOT_CONFIGURED');
  });

  it('does not claim to restore purchases before native billing is configured', async () => {
    const restoreResult = await service.restorePurchases();
    expect(restoreResult.success).toBe(false);
    if (!restoreResult.success) expect(restoreResult.error.code).toBe('RESTORE_NOT_CONFIGURED');
  });
});
