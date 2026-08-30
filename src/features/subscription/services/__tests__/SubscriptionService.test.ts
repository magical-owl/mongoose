import { SubscriptionService } from '../SubscriptionService';
import { UnavailableSubscriptionPaymentGateway } from '../UnavailableSubscriptionPaymentGateway';
import { useSubscriptionStore } from '@stores/useSubscriptionStore';
import { DEFAULT_SUBSCRIPTION_PACKAGES } from '../../domain/SubscriptionCatalog';
import type { ISubscriptionEntitlementRepository } from '../../repositories/ISubscriptionEntitlementRepository';
import type { CustomerEntitlement } from '../../domain/Subscription';
import { failure, success } from '@/shared/utils/result';
import { APP_IDENTITY } from '@/config/appIdentity';
import type { ISubscriptionPaymentGateway } from '../ISubscriptionPaymentGateway';

class MemoryEntitlementRepository implements ISubscriptionEntitlementRepository {
  private entitlement: CustomerEntitlement | null = null;

  public async get() {
    return success(this.entitlement);
  }

  public async save(entitlement: CustomerEntitlement) {
    this.entitlement = entitlement;
    return success(entitlement);
  }

  public async clear() {
    this.entitlement = null;
    return success(undefined);
  }
}

class SyncingPaymentGateway implements ISubscriptionPaymentGateway {
  public constructor(private readonly currentEntitlement: CustomerEntitlement | null) {}

  public async getCurrentEntitlement() {
    return success(this.currentEntitlement);
  }

  public async purchasePackage() {
    return failure({
      code: 'PURCHASE_NOT_CONFIGURED',
      message: 'Purchases are not configured.',
    });
  }

  public async restorePurchases() {
    return success(this.currentEntitlement);
  }
}

describe('SubscriptionService', () => {
  let service: SubscriptionService;
  let entitlementRepository: MemoryEntitlementRepository;

  beforeEach(() => {
    entitlementRepository = new MemoryEntitlementRepository();
    service = new SubscriptionService(undefined, entitlementRepository);
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
      expect(result.data).toHaveLength(1);
      expect(result.data[0]?.tier).toBe('pro_lifetime');
      expect(result.data[0]?.title).toBe(APP_IDENTITY.premiumName);
      expect(result.data[0]?.priceString).toBe('$9.99 once');
      expect(result.data[0]?.priceNumber).toBe(9.99);
    }
  });

  it('grants development Premium for the one-time purchase', async () => {
    const premiumPkg = DEFAULT_SUBSCRIPTION_PACKAGES[0]!;
    const result = await service.purchasePackage(premiumPkg);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.isPro).toBe(true);
      expect(result.data.activeTier).toBe('pro_lifetime');
      expect(result.data.expirationDate).toBeUndefined();
    }
    const storedEntitlementResult = await entitlementRepository.get();
    expect(storedEntitlementResult.success).toBe(true);
    if (storedEntitlementResult.success) {
      expect(storedEntitlementResult.data?.isPro).toBe(true);
    }
  });

  it('grants development lifetime Premium without an expiration date', async () => {
    const lifetimePkg = DEFAULT_SUBSCRIPTION_PACKAGES[0]!;
    const result = await service.purchasePackage(lifetimePkg);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.isPro).toBe(true);
      expect(result.data.activeTier).toBe('pro_lifetime');
      expect(result.data.expirationDate).toBeUndefined();
      expect(result.data.willRenew).toBe(false);
    }
  });

  it('restores locally saved development purchases', async () => {
    const premiumPkg = DEFAULT_SUBSCRIPTION_PACKAGES[0]!;
    const purchaseResult = await service.purchasePackage(premiumPkg);
    expect(purchaseResult.success).toBe(true);
    useSubscriptionStore.getState().reset();

    const restoreResult = await service.restorePurchases();

    expect(restoreResult.success).toBe(true);
    if (restoreResult.success) {
      expect(restoreResult.data.activeTier).toBe('pro_lifetime');
    }
    const storedEntitlementResult = await entitlementRepository.get();
    expect(storedEntitlementResult.success).toBe(true);
    if (storedEntitlementResult.success) {
      expect(storedEntitlementResult.data?.isPro).toBe(true);
    }
  });

  it('reverts a development premium purchase back to the free tier', async () => {
    const premiumPkg = DEFAULT_SUBSCRIPTION_PACKAGES[0]!;
    const purchaseResult = await service.purchasePackage(premiumPkg);
    expect(purchaseResult.success).toBe(true);

    const revertResult = await service.revertToFree();

    expect(revertResult.success).toBe(true);
    if (revertResult.success) {
      expect(revertResult.data.isPro).toBe(false);
      expect(revertResult.data.activeTier).toBe('free');
      expect(revertResult.data.willRenew).toBe(false);
    }
    const storedEntitlementResult = await entitlementRepository.get();
    expect(storedEntitlementResult.success).toBe(true);
    if (storedEntitlementResult.success) {
      expect(storedEntitlementResult.data).toBeNull();
    }
    expect((await service.restorePurchases()).success).toBe(false);
  });

  it('returns a restore error when no development purchase exists', async () => {
    const restoreResult = await service.restorePurchases();

    expect(restoreResult.success).toBe(false);
    if (!restoreResult.success) expect(restoreResult.error.code).toBe('NO_PURCHASES_TO_RESTORE');
  });

  it('fails closed when native billing is not configured', async () => {
    const unavailableService = new SubscriptionService(
      new UnavailableSubscriptionPaymentGateway(),
      entitlementRepository
    );
    const premiumPkg = DEFAULT_SUBSCRIPTION_PACKAGES[0]!;

    const purchaseResult = await unavailableService.purchasePackage(premiumPkg);
    const restoreResult = await unavailableService.restorePurchases();

    expect(purchaseResult.success).toBe(false);
    if (!purchaseResult.success) {
      expect(purchaseResult.error.code).toBe('PURCHASE_NOT_CONFIGURED');
    }
    expect(restoreResult.success).toBe(false);
    if (!restoreResult.success) {
      expect(restoreResult.error.code).toBe('NO_PURCHASES_TO_RESTORE');
    }
    const storedEntitlementResult = await entitlementRepository.get();
    expect(storedEntitlementResult.success).toBe(true);
    if (storedEntitlementResult.success) {
      expect(storedEntitlementResult.data).toBeNull();
    }
  });

  it('initializes from the native current entitlement when available', async () => {
    const entitlement: CustomerEntitlement = {
      isPro: true,
      activeTier: 'pro_lifetime',
      originalPurchaseDate: new Date(Date.UTC(2026, 0, 1)).toISOString(),
      willRenew: false,
    };
    const syncingService = new SubscriptionService(
      new SyncingPaymentGateway(entitlement),
      entitlementRepository
    );

    const result = await syncingService.initialize();

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual(entitlement);
    }
    const storedEntitlementResult = await entitlementRepository.get();
    expect(storedEntitlementResult.success).toBe(true);
    if (storedEntitlementResult.success) {
      expect(storedEntitlementResult.data).toEqual(entitlement);
    }
  });

  it('clears stored premium access when native current entitlement is missing', async () => {
    await entitlementRepository.save({
      isPro: true,
      activeTier: 'pro_lifetime',
      willRenew: false,
    });
    const syncingService = new SubscriptionService(
      new SyncingPaymentGateway(null),
      entitlementRepository
    );

    const result = await syncingService.initialize();
    const storedEntitlementResult = await entitlementRepository.get();

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.isPro).toBe(false);
      expect(result.data.activeTier).toBe('free');
    }
    expect(storedEntitlementResult.success).toBe(true);
    if (storedEntitlementResult.success) {
      expect(storedEntitlementResult.data).toBeNull();
    }
  });
});
