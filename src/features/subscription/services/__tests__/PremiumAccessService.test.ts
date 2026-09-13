import { canUsePremiumFeature, validatePremiumFeatureAccess, PREMIUM_ACCESS_ERROR_CODES } from '../PremiumAccessService';

describe('PremiumAccessService', () => {
  it('allows premium users to use premium features', () => {
    expect(canUsePremiumFeature('premium-sticker-packs', { isPro: true })).toBe(true);
  });

  it('blocks free users from premium features', () => {
    const result = validatePremiumFeatureAccess('premium-app-background-themes', { isPro: false });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe(PREMIUM_ACCESS_ERROR_CODES.premiumRequired);
      expect(result.error.details).toEqual({ feature: 'premium-app-background-themes' });
    }
  });
});

