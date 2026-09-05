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
- Do not use named artists, studios, companies, franchises, games, films, animation houses, or brands as style targets. This includes prompts such as "Studio Ghibli-like", "Disney-like", "Pixar-style", "Sanrio-like", "Pokemon-style", "Animal Crossing-style", or "in the style of [named artist/studio/franchise]".
- Replace protected-style wording with neutral medium and mood language, such as "cozy hand-drawn diary illustration", "colored-pencil texture", "soft charcoal outline", "rounded handmade forms", "dusty pastel palette", or "warm analog journal aesthetic".

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

## Right-Sized Output Targets

Do not overestimate image generation size. Generate each asset only large enough for its actual in-app purpose, with a modest scale buffer for high-density screens. Oversized source files slow builds, increase app size, and can make tiny UI assets look over-detailed or muddy after downscaling.

Use these defaults unless a specific screen needs more:

- Stickers: transparent square PNG, `512x512` default. Use `768x768` only for stickers designed to be placed very large on the diary canvas. Avoid `1024x1024` or larger for ordinary stickers.
- Memory reaction/emote icons: transparent square PNG, `256x256` default. Use `384x384` only if the icon has a larger button state or needs extra edge cleanup. Keep the silhouette bold and simple.
- Pattern background tiles: transparent or low-contrast tile PNG, `768x768` default. Use `1024x1024` only when the repeat needs larger spacing. Test the tile as a 2-by-2 repeat before approving it.
- Diary paper backgrounds: texture PNG, `1024x1024` default unless the implementation requires a different repeat/crop behavior. Keep texture subtle and compressible.
- Journal cover images: wide opaque PNG, `1280x720` default for app use. Use `1600x900` when the cover is shown full-width on large devices. Avoid larger exports unless the asset is also used for marketing.
- App icon and splash assets: follow platform-required dimensions exactly. Do not invent larger drafts beyond the required export target.

Every generated asset packet must include both `Dimensions` and `Intended display size`. If the generated size is larger than these defaults, document why.

## Current Art Direction Layer

Current app art direction: soft low-poly journal style.

This layer is deliberately separate from the permanent originality and review rules. If the product theme changes, replace this section and leave the rest of the asset safety process intact.

Apply this layer to new or regenerated bundled illustration assets unless the human owner explicitly selects another direction:

- Use simplified geometric planes, faceted silhouettes, and soft polygonal color blocks.
- Let low-poly construction define the structure: strong readable forms, angular light planes, and simple faceted shadows.
- Let analog journal finishing define the surface: warm soft-charcoal outlines where useful, gentle line-weight variation, dusty desaturated pastels, subtle paper or colored-pencil grain, and tiny imperfect highlights.
- Use low-poly lighting: a few matte angular shadow and highlight facets instead of glossy digital gradients.
- Keep the mood cozy, quiet, personal, and diary-friendly, not game-like, sci-fi, corporate, or mascot-heavy.
- Use restrained, desaturated palettes that work with light and dark app themes: one dominant pastel, one supporting pastel, one darker earthy accent, and neutral cream where needed.
- For stickers and reaction icons, keep one centered subject with enough transparent breathing room and a clean silhouette.
- For journal covers, use simple generic scenes with broad low-poly shapes and safe overlay areas for title text.
- For pattern backgrounds, use sparse low-poly motifs with low contrast and seamless repeat behavior.
- Avoid describing the style through named artists, studios, franchises, games, brands, marketplace sticker packs, or living illustrators.

## Visual DNA

Use a cozy analog-journal identity:

- Chunky, softly squashed, pillowy forms with controlled asymmetry.
- Strong, simple silhouettes that remain readable at small sizes.
- Compact proportions over tall or highly detailed compositions.
- One charmingly exaggerated feature per subject when it helps personality.
- Prefer shape-first low-poly construction. Use outlines to reinforce the silhouette and cozy journal feel, not as the main structure.
- If outlines are used, keep them warm and soft with gentle line-weight variation; an incomplete secondary sketch line may appear on selected contour portions only. Keep it irregular, incomplete, and offset.
- Dusty, desaturated pastels: one dominant pastel, one supporting pastel, one darker earthy accent, and neutral cream where needed.
- Subtle paper grain or matte surface texture only. Avoid visible repeated stroke lines, horizontal bands, noisy crayon streaks, or over-texturing.
- No conventional digital gradients. Use simple angular low-poly shadow facets, tiny hand-offset shadows on selected edges, and selected chalk/pencil-like highlights.
- A subtle storybook tilt when appropriate.
- One small decorative spark may appear when compositionally appropriate. Keep it secondary and vary placement across assets.

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
- Favor cute, presentable proportions through soft squash, rounded mass, and a clear focal feature rather than dense decoration.
- Use readable personality cues: posture, tilt, scale contrast, small cheek marks, or one restrained face only when it helps the subject.
- Keep the outer contour chunky and confident; avoid assets that read as thin line icons at in-app size.
- Use subtle texture as surface polish, not visible horizontal/vertical bands, scratch lines, or noisy crayon streaks.
- Add small offset shadows and imperfect highlights to make the asset feel finished while preserving a clean silhouette.
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
- Favor soft filled scenic shapes, layered silhouettes, and gentle atmospheric blocks over thin line-art details.
- Keep important subjects large enough to read behind header controls and cover text overlays.
- Use subtle grain and haze for warmth, but avoid busy texture or small marks that compete with diary titles.
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
- Avoid named-style shorthand even when the requested style feels generic or popular. Do not ask for assets to look like Studio Ghibli, Disney, Pixar, Sanrio, Pokemon, Animal Crossing, a known mobile game, a known sticker pack, or any named artist/studio/franchise/brand.
- Prefer descriptive art-direction language: medium, texture, silhouette, palette, lighting, composition, and mood.

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

Apply the current art direction layer from this guide. For the current soft low-poly journal theme, use faceted geometric forms, matte polygonal color planes, sparse angular highlights/shadows, warm soft-charcoal silhouette outlines where useful, dusty desaturated pastels, subtle paper or colored-pencil grain, and strong readable silhouettes. Avoid thin line-art, noisy crayon texture, visible repeated bands, heavy sketch marks, and named artist/studio/franchise style references.

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
