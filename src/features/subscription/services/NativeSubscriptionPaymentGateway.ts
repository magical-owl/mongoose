import {
  endConnection,
  fetchProducts,
  finishTransaction,
  getAvailablePurchases,
  initConnection,
  requestPurchase,
  restorePurchases,
  type Product,
  type ProductOrSubscription,
  type Purchase,
} from 'expo-iap';
import type { Result } from '@/shared/types/architecture';
import { failure, success } from '@/shared/utils/result';
import { APP_IDENTITY } from '@/config/appIdentity';
import type { CustomerEntitlement, SubscriptionPackage } from '../domain/Subscription';
import type { ISubscriptionPaymentGateway } from './ISubscriptionPaymentGateway';

export interface NativeIapClient {
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  fetchProducts(productIds: readonly string[]): Promise<Product[]>;
  requestPurchase(productId: string): Promise<Purchase | Purchase[] | null>;
  restorePurchases(): Promise<void>;
  getAvailablePurchases(): Promise<Purchase[]>;
  finishTransaction(purchase: Purchase): Promise<void>;
}

export class ExpoNativeIapClient implements NativeIapClient {
  private isConnected = false;

  public async connect(): Promise<void> {
    if (this.isConnected) return;
    await initConnection();
    this.isConnected = true;
  }

  public async disconnect(): Promise<void> {
    if (!this.isConnected) return;
    await endConnection();
    this.isConnected = false;
  }

  public async fetchProducts(productIds: readonly string[]): Promise<Product[]> {
    const result = await fetchProducts({ skus: [...productIds], type: 'in-app' });
    return (result ?? []).filter(isProduct);
  }

  public async requestPurchase(productId: string): Promise<Purchase | Purchase[] | null> {
    return requestPurchase({
      request: {
        apple: { sku: productId },
        google: { skus: [productId] },
      },
      type: 'in-app',
    });
  }

  public async restorePurchases(): Promise<void> {
    await restorePurchases();
  }

  public async getAvailablePurchases(): Promise<Purchase[]> {
    return getAvailablePurchases();
  }

  public async finishTransaction(purchase: Purchase): Promise<void> {
    await finishTransaction({ purchase, isConsumable: false });
  }
}

export class NativeSubscriptionPaymentGateway implements ISubscriptionPaymentGateway {
  public constructor(
    private readonly client: NativeIapClient = new ExpoNativeIapClient(),
    private readonly restorableProductIds: readonly string[] = [APP_IDENTITY.premiumLifetimeProductId]
  ) {}

  public async getPackages(fallbackPackages: readonly SubscriptionPackage[]): Promise<Result<SubscriptionPackage[]>> {
    try {
      await this.client.connect();
      const products = await this.client.fetchProducts(fallbackPackages.map((pkg) => pkg.productId));
      const nativePackages = fallbackPackages.map((pkg) => {
        const product = products.find((item) => item.id === pkg.productId);
        return product
          ? {
              ...pkg,
              title: product.title || pkg.title,
              priceString: product.displayPrice || pkg.priceString,
              priceNumber: product.price ?? pkg.priceNumber,
            }
          : pkg;
      });
      return success(nativePackages);
    } catch (error) {
      return failure({
        code: 'PURCHASE_CATALOG_UNAVAILABLE',
        message: error instanceof Error ? error.message : 'Unable to load native purchase catalog.',
      });
    }
  }

  public async getCurrentEntitlement(): Promise<Result<CustomerEntitlement | null>> {
    try {
      await this.client.connect();
      const purchases = await this.client.getAvailablePurchases();
      const purchase = purchases.find((item) => this.restorableProductIds.includes(item.productId) && this.isValidPurchase(item));
      if (!purchase) return success(null);

      return success(this.createLifetimeEntitlement(purchase));
    } catch (error) {
      return failure({
        code: 'ENTITLEMENT_SYNC_FAILED',
        message: error instanceof Error ? error.message : 'Failed to sync current purchase entitlement.',
      });
    }
  }

  public async purchasePackage(pkg: SubscriptionPackage): Promise<Result<CustomerEntitlement>> {
    try {
      await this.client.connect();
      const requestResult = await this.client.requestPurchase(pkg.productId);
      const purchase = this.findValidPurchase(toPurchases(requestResult), pkg.productId)
        ?? this.findValidPurchase(await this.client.getAvailablePurchases(), pkg.productId);

      if (!purchase) {
        return failure({
          code: 'PURCHASE_PENDING',
          message: 'Purchase is pending or was not completed.',
        });
      }

      await this.client.finishTransaction(purchase);
      return success(this.createEntitlement(pkg, purchase));
    } catch (error) {
      return failure({
        code: 'PURCHASE_FAILED',
        message: error instanceof Error ? error.message : 'Purchase failed.',
      });
    }
  }

  public async restorePurchases(): Promise<Result<CustomerEntitlement | null>> {
    try {
      await this.client.connect();
      await this.client.restorePurchases();
      const purchases = await this.client.getAvailablePurchases();
      const purchase = purchases.find((item) => this.restorableProductIds.includes(item.productId) && this.isValidPurchase(item));
      if (!purchase) return success(null);

      await this.client.finishTransaction(purchase);
      return success(this.createLifetimeEntitlement(purchase));
    } catch (error) {
      return failure({
        code: 'RESTORE_PURCHASES_FAILED',
        message: error instanceof Error ? error.message : 'Failed to restore purchases.',
      });
    }
  }

  private findValidPurchase(purchases: readonly Purchase[], productId: string): Purchase | null {
    return purchases.find((purchase) => purchase.productId === productId && this.isValidPurchase(purchase)) ?? null;
  }

  private isValidPurchase(purchase: Purchase): boolean {
    if (purchase.purchaseState !== 'purchased') return false;
    if ('isSuspendedAndroid' in purchase && purchase.isSuspendedAndroid) return false;
    if ('revocationDateIOS' in purchase && purchase.revocationDateIOS) return false;
    return true;
  }

  private createEntitlement(pkg: SubscriptionPackage, purchase: Purchase): CustomerEntitlement {
    return {
      isPro: true,
      activeTier: pkg.tier,
      originalPurchaseDate: new Date(purchase.transactionDate).toISOString(),
      willRenew: pkg.period !== 'lifetime' && purchase.isAutoRenewing,
    };
  }

  private createLifetimeEntitlement(purchase: Purchase): CustomerEntitlement {
    return {
      isPro: true,
      activeTier: 'pro_lifetime',
      originalPurchaseDate: new Date(purchase.transactionDate).toISOString(),
      willRenew: false,
    };
  }
}

function toPurchases(value: Purchase | Purchase[] | null): Purchase[] {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

function isProduct(value: ProductOrSubscription): value is Product {
  return value.type === 'in-app';
}

export const nativeSubscriptionPaymentGateway = new NativeSubscriptionPaymentGateway();
