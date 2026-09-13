# Monetization Feature Audit

Last updated: 2026-09-13

## Objective

Define a low-risk free vs premium split for the current diary app while keeping the basic product useful, private, and understandable. This audit is a product and release-planning document; implementation should still happen through the subscription service, plan-limit service, and explicit entitlement checks.

## Current State

Monetization is enabled through `src/config/releaseFeatures.ts`.

Already implemented gates:

- Free users can create up to 3 diary entries per day.
- Free users can add up to 9 new stickers per day.
- Premium users have unlimited daily entries and sticker usage.
- Sticker packs support `free` and `premium` access tiers.
- Premium sticker packs currently include Winter, Spring, and Fall.
- Paywall surfaces exist in journal home, diary entry list, create entry, edit/view entry modals, and settings.
- Purchase and restore purchase infrastructure uses native store billing through `expo-iap`.

Current free sticker packs:

- Cat
- School
- Summer
- Scribble Art

Current premium sticker packs:

- Winter
- Spring
- Fall

## Recommended Current Release Split

### Free

Keep the core diary loop free:

- Create, edit, delete, and view diary entries within the daily free entry limit.
- Create and manage journals.
- Add one or more moods.
- Add tags.
- Add cover photos.
- Add reflection comments.
- Attach one image to a reflection.
- Use memory reactions on entries and reflections.
- Use view counters and view history recording.
- Use basic diary paper backgrounds, including Blank.
- Use basic journal backgrounds.
- Use all main navigation screens: Journal, Calendar, Rediscover, Insights, Settings.
- Use app lock/passcode where available.
- Export/delete/clear-data flows must remain free because they are user-rights and trust features.

### Premium

Use premium for depth, volume, and personalization:

- Unlimited diary entries per day.
- Unlimited daily sticker usage.
- Premium sticker packs.
- Premium diary paper backgrounds.
- Premium journal cover backgrounds.
- Premium app background themes.
- Advanced Insights sections.
- Advanced Rediscover sections.
- Future export-as-image themes or polished share templates, if added.

## Specific Feature Recommendations

| Feature | Recommended Tier | Reason |
|---|---|---|
| Basic diary entry creation | Free with daily limit | Core product must remain usable. |
| Unlimited diary entry creation | Premium | Clear value, already implemented. |
| Basic journal creation | Free | Users need organization without paying. |
| Unlimited journals | Free for now | Gating journal count can feel punitive early. Revisit only after usage data. |
| Entry cover photo | Free | Core memory capture feature. |
| Journal cover photo | Free | Basic personalization. |
| Built-in basic journal backgrounds | Free | Helps new users without requiring photo permissions. |
| Premium journal backgrounds | Premium | Good personalization upsell. |
| Diary paper Blank, Vintage parchment, Soft lined paper | Free | Baseline writing comfort. |
| Extra diary paper styles | Premium | Cosmetic, low trust risk. |
| App background theme None and one default seasonal theme | Free | Avoid making the app feel visually broken on free tier. |
| Extra app background themes | Premium | Cosmetic, easy to explain. |
| Free sticker packs | Free | Gives users the sticker feature. |
| Premium sticker packs | Premium | Already modeled with `accessTier`. |
| Daily sticker usage over 9 new stickers | Premium | Already implemented; good volume gate. |
| Mood selection | Free | Fundamental journaling metadata. |
| Tags | Free | Fundamental organization. |
| Memory reactions | Free | Lightweight personal expression. |
| Reflection comments | Free | Core journaling continuation loop. |
| Reflection image attachment | Free for now | Recently added core feature; gating immediately may feel harsh. Revisit later. |
| Calendar view | Free | Main navigation and retrieval feature. |
| Basic Rediscover: Surprise, On This Day, Old Photos | Free | Makes stored entries valuable. |
| Advanced Rediscover: Most Viewed, Mood Rewind, Looking Back, This Month Before | Premium candidate | Derived memory features are good premium depth. |
| Basic Insights numbers | Free | Helps users trust their data and app value. |
| Advanced Insights trends, top tags/stickers/reactions, time-of-day patterns | Premium candidate | Analytical depth is a reasonable paid benefit. |
| App lock/passcode | Free | Privacy/security should not be paywalled for a diary app. |
| Data deletion/export | Free | Compliance and user trust requirement. |
| Language/theme accessibility settings | Free | Accessibility and comprehension should not be paywalled. |

## Features Not To Monetize

Do not gate these behind premium:

- Data deletion.
- Restore access to user-created local data.
- App lock or passcode protection.
- Basic accessibility settings.
- Language selection.
- Privacy/security controls.
- Ability to remove a background theme.
- Ability to view existing entries the user already created.

These are trust, safety, or user-rights surfaces. Gating them can create store-review and user-trust risk.

## Implementation Follow-Ups

Recommended next implementation order:

1. Done: Add a single source of truth for premium feature keys in `PremiumFeature.ts`.
2. Done: Add a service-level entitlement helper in `PremiumAccessService.ts`.
3. Done: Keep `PlanLimitService` for numeric limits only.
4. Done: Add access tiers to journal backgrounds, diary paper backgrounds, and app pattern backgrounds.
5. Done: Gate premium visual assets in the current picker components, with lock UI and paywall routing.
6. Pending final product decision: Decide whether advanced Rediscover and advanced Insights should be gated at launch.
7. Done: Update paywall copy to match the current gated and recommended premium feature list.
8. In progress: Add tests for each gated picker and each gated service branch. Current coverage includes premium access service, plan limits, journal background tiers, diary paper tiers, app background tiers, journal cover picker behavior, diary paper picker behavior, and paywall modal rendering.

## Copy And Store Risks

Current paywall copy says Premium includes:

- Unlimited diary entries per day.
- Unlimited daily sticker use.
- Advanced insights and trends.
- Premium themes, papers, covers, and sticker packs.
- Advanced rediscover collections.

This is directionally compatible with the recommendation, but it should not ship until the actual gates match the copy. If advanced insights, advanced rediscover, or premium visual assets are not implemented yet, either implement those gates or soften the copy.

## Required Reviews Before Release

- Product review: confirm final free/premium split and pricing.
- Monetization/store review: confirm IAP product IDs, restore flow, entitlement states, and paywall wording.
- Security/privacy review: confirm no privacy or data-rights feature is gated.
- QA review: test fresh install, free user, premium user, restore purchase, offline entitlement, expired/missing purchase, and development revert.
- Localization review: update paywall and settings copy after the final split is selected.

## Human Decisions Needed

- Whether Premium is lifetime-only for launch or should include subscriptions later.
- Whether advanced Rediscover and advanced Insights should be premium at launch or left free until the app has more usage feedback.
- Which visual assets are premium: diary papers, journal backgrounds, app background themes, or all three.
- Final premium name and product ID before store submission.
