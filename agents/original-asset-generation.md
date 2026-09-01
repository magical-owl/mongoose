# Original Asset Generation Reference

Use this reference when generating or revising project-owned stickers, wallpaper patterns, journal covers, app icons, splash assets, or other bundled illustrations.

This guide reduces IP and style-confusion risk, but it is not legal clearance. Final release assets still need human review using [`agents/ip-asset-review.md`](ip-asset-review.md) and the register in [`assets/ASSET_REGISTER.md`](../assets/ASSET_REGISTER.md).

## Release Posture

Prefer this asset pipeline:

1. Generate AI drafts for concept exploration only.
2. Human designer redraws or materially polishes the selected draft into an original final asset.
3. Human reviewer checks the final asset for confusing similarity, trademarks, watermarks, artifacts, and app-fit.
4. Only approved final exports are bundled for release.

AI-generated output may be committed as draft evidence or temporary development art, but it must not be treated as release-cleared by default. Final release art should have clear human authorship through redraw, composition changes, vector cleanup, repainting, or equivalent design work.

## Required Inputs

- Asset purpose: sticker, pattern background, journal cover, app icon, splash, or other.
- Subject: ordinary generic object, scene, or motif.
- Output format: transparent PNG for stickers/pattern motifs; opaque PNG for covers/icons unless specified.
- Size target and usage surface.
- Provenance notes: generation prompt, script, source date, and any reference ownership/license.
- Draft/final status: concept draft, redraw source, human-polished final, or release candidate.
- Human handoff intent: what the designer should preserve and what they should change.

## Reference Rules

Use clean inputs:

- Allowed: owned sketches, internal design notes, generic verbal mood boards, public-domain references with documented source, or simple object descriptions.
- Avoid: marketplace sticker sheets, wallpaper screenshots, stock-watermarked images, social media artwork, fan art, branded packaging, character images, celebrity photos, and named-artist style references.
- Do not upload third-party reference images into an image generator unless ownership or commercial-use rights are documented.
- When a user provides a third-party visual reference, convert it into neutral words: spacing, density, subject category, palette direction, and composition. Do not copy motif arrangement, exact shapes, character posture, or distinctive details.
- If the reference includes watermarks, logos, recognizable characters, or platform screenshots, use it only to discuss risks and generate a safer independent brief.

## Generation Packet

Before generating or revising assets, write a short packet:

```text
Asset ID:
Purpose:
Draft or final:
Subject:
Usage surface:
Dimensions:
Background:
Palette:
Style DNA:
Forbidden references:
Designer handoff notes:
Review owner:
```

For multi-asset sets, define shared rules once and list each asset ID separately. Keep subject prompts generic and concrete.

## Visual DNA

Use a cozy analog-journal identity:

- Chunky, softly squashed, pillowy forms with controlled asymmetry.
- Strong, simple silhouettes that remain readable at small sizes.
- Compact proportions over tall or highly detailed compositions.
- One charmingly exaggerated feature per subject when it helps personality.
- Warm soft-charcoal primary outlines, with gentle line-weight variation.
- A subtle secondary sketch line on selected contour portions only. Keep it irregular, incomplete, and offset.
- Dusty, desaturated pastels: one dominant pastel, one supporting pastel, one darker earthy accent, and neutral cream where needed.
- Subtle handmade paper or colored-pencil grain with small irregular coverage changes. Avoid visible repeated stroke lines or banding.
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
- Export with enough pixel density for the largest in-app display size, then downscale in the app when needed.
- Avoid large transparent padding. Leave breathing room, but do not make the tappable/visual bounds feel disconnected.

For pattern backgrounds:

- Use sparse, repeating motifs with enough negative space for app UI.
- Keep motifs simple, readable, and lower-contrast than stickers.
- Avoid obvious boxed symmetry, visible seams, motif overlap, and crowded repetition.
- Prefer transparent motif tiles that work over light and dark app backgrounds.
- Use staggered motif placement and varied scale/rotation so the repeat feels continuous rather than grid-boxed.
- Keep each tile seamless on all four edges. Test by viewing at least a 2-by-2 repeat.
- Do not use detailed faces, characters, or tiny complex objects in background patterns.
- Keep contrast low enough that primary UI remains readable in light mode and dark mode.

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

## Draft Prompt Guardrails

Prompts should optimize for redrawable drafts:

- Ask for a single clear subject for stickers, not a complex scene.
- Ask for simple, readable shapes over dense detail.
- Ask for original proportions and decorative details.
- Ask for no text, no logos, no labels, no packaging, no signatures, and no watermarks.
- Ask for a transparent background for stickers and motifs.
- Ask for clean edge separation and no white halo.
- Ask for consistent camera angle and scale across a set.
- Ask for a limited palette and the same outline treatment across the collection.
- Avoid terms that strongly imply an existing property, such as mascot, cartoon mouse, anime studio, luxury logo, movie poster, branded toy, or game character.
- Avoid "make it like this image." Use "loosely inspired by these non-protected qualities" only when the reference is owned or license-cleared.

Quality requirements:

- No malformed anatomy or object structure.
- No accidental extra limbs, duplicated parts, broken outlines, fake text, or watermark-like marks.
- No confusing similarity to known characters, logos, apps, games, franchises, or sticker collections.
- No background remnants on transparent exports.
- No crowded details that disappear at small sticker size.

## Redraw Handoff

Every accepted AI draft should include designer instructions:

- Preserve: subject, rough mood, approximate palette family, compact silhouette, and app usage constraints.
- Change: exact contour, secondary details, line rhythm, decorative marks, texture placement, and any element that looks too generic or too similar to known work.
- Improve: edge quality, silhouette clarity at small size, consistent set proportions, and visual balance.
- Remove: fake text, watermark-like artifacts, unintentional marks, over-rendered texture, and any brand-like or character-like detail.

The final human-polished asset should be visually related to the draft brief, but not a direct trace of generated output or third-party references.

## Prompt Template

```text
Create an original hand-drawn diary [asset type] draft for human redraw and polish.

Subject: [generic subject]
Usage: [sticker / pattern background / journal cover / app icon / splash]
Output: [transparent PNG / opaque PNG], [dimensions]
Status: concept draft, not release-cleared final art

Use chunky, softly squashed, pillowy forms with controlled asymmetry. Prioritize a strong, compact silhouette readable at small size. Add one charming exaggerated feature if it helps the subject.

Use warm soft-charcoal outlines with subtle irregular line weight and an incomplete secondary sketch line on selected contour portions. Use dusty desaturated pastels, subtle handmade grain, tiny hand-offset shadows, and imperfect chalk/pencil highlights. Include one tiny imperfect four-point spark only if compositionally appropriate.

Keep the mood cozy, quiet, nostalgic, personal, slightly playful, handmade, and warm without becoming childish.

Do not imitate any named artist, studio, brand, franchise, sticker collection, mascot, copyrighted character, logo, product packaging, or distinctive fictional object. Use only generic functional characteristics and original proportions/details.

Do not include readable text, signatures, watermarks, brand marks, fake labels, or background scenery unless explicitly required by the asset type.
```

## Review Checklist

- [ ] Asset purpose and output constraints are recorded.
- [ ] Prompt or generator source is recorded.
- [ ] Asset is marked as draft, redraw source, human-polished final, or release candidate.
- [ ] No external image references were used unless owned or license-cleared.
- [ ] No named living artist, studio, brand, franchise, or existing sticker collection was used as a style target.
- [ ] No recognizable copyrighted characters, logos, brand marks, product packaging, or celebrity likenesses appear.
- [ ] AI drafts have designer handoff notes that specify what to preserve, change, improve, and remove.
- [ ] Final release candidate includes evidence of human redraw or material human polish.
- [ ] Sticker edges are clean on transparent background.
- [ ] Pattern tiles repeat continuously without boxed symmetry, seams, overlap, or visual crowding.
- [ ] Asset remains readable at intended in-app size.
- [ ] Asset is entered or updated in [`assets/ASSET_REGISTER.md`](../assets/ASSET_REGISTER.md).
- [ ] Human IP/design review remains marked as required before release.

## Rejection Triggers

Reject or regenerate the asset when any of these appear:

- Watermark-like marks, fake signatures, fake text, or logo-like symbols.
- Strong resemblance to an existing character, mascot, brand, product package, or sticker collection.
- Named-artist, studio, franchise, or marketplace style dependency in the prompt.
- Crowded details that fail at small size.
- Boxed pattern seams, visible overlap, or repeated motifs that look copied/pasted.
- Transparent PNG edge halos, fringe pixels, or background contamination.
- Generated artifacts that would require guesswork to redraw correctly.
