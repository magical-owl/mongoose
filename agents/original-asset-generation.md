# Original Asset Generation Reference

Use this reference when generating or revising project-owned stickers, wallpaper patterns, journal covers, app icons, splash assets, or other bundled illustrations.

This guide reduces IP and style-confusion risk, but it is not legal clearance. Final release assets still need human review using [`agents/ip-asset-review.md`](ip-asset-review.md) and the register in [`assets/ASSET_REGISTER.md`](../assets/ASSET_REGISTER.md).

## Required Inputs

- Asset purpose: sticker, pattern background, journal cover, app icon, splash, or other.
- Subject: ordinary generic object, scene, or motif.
- Output format: transparent PNG for stickers/pattern motifs; opaque PNG for covers/icons unless specified.
- Size target and usage surface.
- Provenance notes: generation prompt, script, source date, and any reference ownership/license.

## Visual DNA

Use a cozy analog-journal identity:

- Chunky, softly squashed, pillowy forms with controlled asymmetry.
- Strong, simple silhouettes that remain readable at small sizes.
- Compact proportions over tall or highly detailed compositions.
- One charmingly exaggerated feature per subject when it helps personality.
- Warm soft-charcoal primary outlines, with gentle line-weight variation.
- A subtle secondary sketch line on selected contour portions only. Keep it irregular, incomplete, and offset.
- Dusty, desaturated pastels: one dominant pastel, one supporting pastel, one darker earthy accent, and neutral cream where needed.
- Subtle dry-crayon or colored-pencil fill texture with small irregular coverage changes.
- No conventional digital gradients. Use tiny hand-offset shadows on selected edges.
- Tiny imperfect chalk or pencil highlights where useful.
- A subtle storybook tilt when appropriate.
- One tiny imperfect four-point hand-drawn spark when compositionally appropriate. Keep it secondary and vary placement across assets.

## Controlled Imperfection

Intentional imperfections should make the asset feel handmade, not broken:

- Slightly uneven curves.
- Subtly unequal sides.
- Small line wobbles.
- Slightly off-center details.
- Imperfect repeated shapes.
- Minor hand-colored texture variation.

Do not create malformed anatomy, warped objects, unreadable silhouettes, noisy texture, or edge artifacts.

## Expression

- Do not automatically add faces to objects.
- Prefer expression through shape, posture, color, and proportions.
- When a face is appropriate, use tiny dot eyes and a minimal curved mouth.
- Avoid generic emoji-style expressions.

## Composition

For stickers:

- One primary subject.
- Centered composition.
- Generous breathing room.
- No environmental scene or background scenery.
- Fully transparent background.
- Clean isolated subject.
- Exceptionally clean outer silhouette with no white halos, fringe pixels, background remnants, semi-transparent contamination, or edge residue.

For pattern backgrounds:

- Use sparse, repeating motifs with enough negative space for app UI.
- Keep motifs simple, readable, and lower-contrast than stickers.
- Avoid obvious boxed symmetry, visible seams, motif overlap, and crowded repetition.
- Prefer transparent motif tiles that work over light and dark app backgrounds.

For journal covers:

- Use simple original scenes or symbolic compositions.
- Avoid brand-like marks, readable text, real product packaging, recognizable buildings, and character-like mascots.
- Preserve legibility under title and entry-count overlays.

## Originality Requirements

Create a new, independently designed illustration.

Do not reproduce or closely imitate existing:

- Characters.
- Mascots.
- Franchises.
- Logos.
- Branded products or packaging.
- Copyrighted illustrations.
- Sticker collections.
- Distinctive fictional objects.
- The distinctive style of a named living artist, illustrator, studio, company, franchise, or brand.

Do not introduce recognizable trademarked symbols, brand markings, signature costumes, character-specific facial features, or visual elements strongly associated with existing IP.

For ordinary objects, use generic functional characteristics while creating original proportions, decorative details, colors, and composition.

If a concept risks resembling recognizable IP, reinterpret it into a generic independently designed subject.

## Prompt Template

```text
Create an original hand-drawn diary [asset type] illustration with a distinctive cozy analog-journal identity.

Subject: [generic subject]
Usage: [sticker / pattern background / journal cover / app icon / splash]
Output: [transparent PNG / opaque PNG], [dimensions]

Use chunky, softly squashed, pillowy forms with controlled asymmetry. Prioritize a strong, compact silhouette readable at small size. Add one charming exaggerated feature if it helps the subject.

Use warm soft-charcoal outlines with subtle irregular line weight and an incomplete secondary sketch line on selected contour portions. Use dusty desaturated pastels, subtle dry-crayon texture, tiny hand-offset shadows, and imperfect chalk/pencil highlights. Include one tiny imperfect four-point spark only if compositionally appropriate.

Keep the mood cozy, quiet, nostalgic, personal, slightly playful, handmade, and warm without becoming childish.

Do not imitate any named artist, studio, brand, franchise, sticker collection, mascot, copyrighted character, logo, product packaging, or distinctive fictional object. Use only generic functional characteristics and original proportions/details.
```

## Review Checklist

- [ ] Asset purpose and output constraints are recorded.
- [ ] Prompt or generator source is recorded.
- [ ] No external image references were used unless owned or license-cleared.
- [ ] No named living artist, studio, brand, franchise, or existing sticker collection was used as a style target.
- [ ] No recognizable copyrighted characters, logos, brand marks, product packaging, or celebrity likenesses appear.
- [ ] Sticker edges are clean on transparent background.
- [ ] Pattern tiles repeat continuously without boxed symmetry, seams, overlap, or visual crowding.
- [ ] Asset remains readable at intended in-app size.
- [ ] Asset is entered or updated in [`assets/ASSET_REGISTER.md`](../assets/ASSET_REGISTER.md).
- [ ] Human IP/design review remains marked as required before release.
