import type { Product, ProductIOS, Purchase } from 'expo-iap';
import { NativeSubscriptionPaymentGateway, type NativeIapClient } from '../NativeSubscriptionPaymentGateway';
import { DEFAULT_SUBSCRIPTION_PACKAGES } from '../../domain/SubscriptionCatalog';

class MockNativeIapClient implements NativeIapClient {
  public connected = false;
  public finishedPurchases: Purchase[] = [];
  public products: Product[] = [];
  public requestResult: Purchase | Purchase[] | null = null;
  public availablePurchases: Purchase[] = [];

  public async connect(): Promise<void> {
    this.connected = true;
  }

  public async disconnect(): Promise<void> {
    this.connected = false;
  }

  public async fetchProducts(): Promise<Product[]> {
    return this.products;
  }

  public async requestPurchase(): Promise<Purchase | Purchase[] | null> {
    return this.requestResult;
  }

  public async restorePurchases(): Promise<void> {}

  public async getAvailablePurchases(): Promise<Purchase[]> {
    return this.availablePurchases;
  }

  public async finishTransaction(purchase: Purchase): Promise<void> {
    this.finishedPurchases.push(purchase);
  }
}

describe('NativeSubscriptionPaymentGateway', () => {
  const premiumPackage = DEFAULT_SUBSCRIPTION_PACKAGES[0]!;

  it('maps native product metadata into the package catalog', async () => {
    const client = new MockNativeIapClient();
    client.products = [createProduct({ displayPrice: '$7.99', price: 7.99, title: 'Mongoose Premium' })];
    const gateway = new NativeSubscriptionPaymentGateway(client);

    const result = await gateway.getPackages([premiumPackage]);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data[0]?.priceString).toBe('$7.99');
      expect(result.data[0]?.priceNumber).toBe(7.99);
      expect(result.data[0]?.title).toBe('Mongoose Premium');
    }
  });

  it('grants and finishes premium for a completed native purchase', async () => {
    const client = new MockNativeIapClient();
    const purchase = createPurchase({ productId: premiumPackage.productId });
    client.requestResult = purchase;
    const gateway = new NativeSubscriptionPaymentGateway(client);

    const result = await gateway.purchasePackage(premiumPackage);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.isPro).toBe(true);
      expect(result.data.activeTier).toBe('pro_lifetime');
      expect(result.data.willRenew).toBe(false);
    }
    expect(client.finishedPurchases).toEqual([purchase]);
  });

  it('does not grant premium for a pending purchase', async () => {
    const client = new MockNativeIapClient();
    client.requestResult = createPurchase({
      productId: premiumPackage.productId,
      purchaseState: 'pending',
    });
    const gateway = new NativeSubscriptionPaymentGateway(client);

    const result = await gateway.purchasePackage(premiumPackage);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe('PURCHASE_PENDING');
    }
    expect(client.finishedPurchases).toHaveLength(0);
  });

  it('restores and finishes an active native purchase', async () => {
    const client = new MockNativeIapClient();
    const purchase = createPurchase({ productId: premiumPackage.productId });
    client.availablePurchases = [purchase];
    const gateway = new NativeSubscriptionPaymentGateway(client);

    const result = await gateway.restorePurchases();

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data?.isPro).toBe(true);
      expect(result.data?.activeTier).toBe('pro_lifetime');
    }
    expect(client.finishedPurchases).toEqual([purchase]);
  });

  it('syncs an active entitlement without finishing a transaction', async () => {
    const client = new MockNativeIapClient();
    const purchase = createPurchase({ productId: premiumPackage.productId });
    client.availablePurchases = [purchase];
    const gateway = new NativeSubscriptionPaymentGateway(client);

    const result = await gateway.getCurrentEntitlement();

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data?.isPro).toBe(true);
      expect(result.data?.activeTier).toBe('pro_lifetime');
    }
    expect(client.finishedPurchases).toEqual([]);
  });

  it('does not sync a revoked entitlement', async () => {
    const client = new MockNativeIapClient();
    client.availablePurchases = [
      createPurchase({
        productId: premiumPackage.productId,
        revocationDateIOS: Date.UTC(2026, 0, 2),
      }),
    ];
    const gateway = new NativeSubscriptionPaymentGateway(client);

    const result = await gateway.getCurrentEntitlement();

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toBeNull();
    }
  });
});

function createProduct(overrides: Partial<ProductIOS> = {}): ProductIOS {
  return {
    currency: 'USD',
    description: 'Premium access',
    displayName: 'Premium',
    displayNameIOS: 'Premium',
    displayPrice: '$9.99',
    id: DEFAULT_SUBSCRIPTION_PACKAGES[0]!.productId,
    isFamilyShareableIOS: false,
    jsonRepresentationIOS: '{}',
    platform: 'ios',
    price: 9.99,
    title: 'Premium',
    type: 'in-app',
    typeIOS: 'non-consumable',
    ...overrides,
  };
}

function createPurchase(overrides: Partial<Purchase> = {}): Purchase {
  return {
    id: 'purchase-id',
    isAutoRenewing: false,
    productId: DEFAULT_SUBSCRIPTION_PACKAGES[0]!.productId,
    purchaseState: 'purchased',
    purchaseToken: 'purchase-token',
    quantity: 1,
    store: 'apple',
    transactionDate: Date.UTC(2026, 0, 1),
    transactionId: 'transaction-id',
    ...overrides,
  };
}
