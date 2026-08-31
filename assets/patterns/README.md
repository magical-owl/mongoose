# Pattern Background Assets

These wallpaper tiles are AI-generated raster draft assets created for Mongoose on 2026-09-01 with the built-in Codex image generation tool. They are original sparse seasonal patterns intended only as low-opacity decorative app backgrounds during development.

Release status: draft. Replace or re-review before release after original reference art is available.

## Files

- `pattern-spring.png` - blossom flowers, tulips, daisies, and bees.
- `pattern-summer.png` - suns, sunglasses, ocean waves, and ice cream.
- `pattern-autumn.png` - pumpkins, apples, autumn leaves, and acorns.
- `pattern-winter.png` - snowflakes, fireplace, scarves, and snow globes.

## Shared Prompt Constraints

Each asset used a season-specific version of this sparse reference-guided prompt structure:

```text
Use case: stylized-concept
Asset type: mobile app transparent wallpaper pattern tile
Input images: use the provided images only as pattern-design references for spacing, simplicity, edge-cropped repeat behavior, and flat playful motif style. Do not copy any subject, animal, watermark, layout, or exact artwork from the references.
Primary request: original seasonal transparent PNG seamless pattern tile for app wallpaper.
Subject: simple flat seasonal motifs plus tiny filler marks.
Style/medium: very simple flat illustration, clean hand-drawn shapes, minimal details, rounded friendly forms, no watercolor realism, no 3D, no shadows.
Composition/framing: seamless square repeat tile; organic scattered layout; balanced spacing like nursery wallpaper; some motifs intentionally continue off the tile edges for seamless repeat; no boxed quadrant layout; no visible grid; medium-sparse density with plenty of transparent space.
Constraints: transparent background with preserved alpha; original generated artwork; no text; no logos; no watermark; no brand marks; no copyrighted characters; no people; no reference-art copying.
Avoid: boxed layout, exact quadrants, rows, columns, tiled grid feeling, realistic painting, dense sticker sheet, heavy texture, gradients, shadows, deformed objects, background fill.
```

## IP Notes

- Source: Built-in Codex image generation tool.
- License/provenance: Generated specifically for this project; user-provided images were used only as style/layout references, not as edit targets or source artwork.
- Attribution: No attribution required by the generation workflow.
- Trademark/likeness controls: Prompts prohibited logos, brand marks, copyrighted characters, people, and recognizable protected styles.
- Post-processing: Neutral light transparency-preview checkerboard pixels were removed with the existing `pngjs` package to restore alpha.
- Human review needed: Required before release for final asset acceptance and IP risk review.
