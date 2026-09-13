import type { CustomerEntitlement } from '../domain/Subscription';
import type { PremiumFeature } from '../domain/PremiumFeature';
import type { Result } from '@/shared/types/architecture';
import { failure, success } from '@/shared/utils/result';
import { releaseFeatures } from '@/config/releaseFeatures';

export const PREMIUM_ACCESS_ERROR_CODES = {
  premiumRequired: 'PREMIUM_REQUIRED',
} as const;

export function canUsePremiumFeature(
  _feature: PremiumFeature,
  entitlement: Pick<CustomerEntitlement, 'isPro'>,
): boolean {
  if (!releaseFeatures.monetization) return true;
  return entitlement.isPro;
}

export function validatePremiumFeatureAccess(
  feature: PremiumFeature,
  entitlement: Pick<CustomerEntitlement, 'isPro'>,
): Result<void> {
  if (canUsePremiumFeature(feature, entitlement)) {
    return success(undefined);
  }

  return failure({
    code: PREMIUM_ACCESS_ERROR_CODES.premiumRequired,
    message: 'Premium is required for this feature.',
    details: { feature },
  });
}

