import { z } from 'zod';

export const SubscriptionTierSchema = z.enum(['free', 'pro_monthly', 'pro_yearly', 'pro_lifetime']);
export type SubscriptionTier = z.infer<typeof SubscriptionTierSchema>;

export const SubscriptionPackageSchema = z.object({
  id: z.string(),                // e.g. "zenjournal_pro_monthly", "zenjournal_pro_yearly", "zenjournal_pro_lifetime"
  productId: z.string(),         // StoreKit / Google Play product ID
  tier: SubscriptionTierSchema,
  title: z.string(),            // e.g. "Pro Monthly", "Pro Yearly", "Pro Lifetime"
  priceString: z.string(),       // e.g. "$4.99/mo", "$29.99/yr", "$79.99"
  priceNumber: z.number(),
  period: z.enum(['month', 'year', 'lifetime']),
  badge: z.string().optional(),  // e.g. "BEST VALUE - SAVE 50%", "ONE-TIME PAYMENT"
});

export type SubscriptionPackage = z.infer<typeof SubscriptionPackageSchema>;

export const CustomerEntitlementSchema = z.object({
  isPro: z.boolean().default(false),
  activeTier: SubscriptionTierSchema.default('free'),
  expirationDate: z.string().optional(), // ISO date string or undefined for lifetime
  originalPurchaseDate: z.string().optional(),
  willRenew: z.boolean().default(false),
});

export type CustomerEntitlement = z.infer<typeof CustomerEntitlementSchema>;
