# Pattern Background Assets

These wallpaper tiles are composed from project-owned source motifs using `scripts/generate-owned-assets.js patterns`. No third-party image references are used.

## Files

- `pattern-spring.png` - sparse blossom-only pattern.
- `pattern-summer.png` - sparse sun-only pattern.
- `pattern-autumn.png` - sparse leaf-only pattern.
- `pattern-winter.png` - sparse snowflake-only pattern.
- `pattern-rain.png` - sparse cloud-and-raindrop pattern.
- `motifs/spring-blossom.png` - AI-generated source motif.
- `motifs/summer-sun.png` - AI-generated source motif.
- `motifs/autumn-leaf.png` - AI-generated source motif.
- `motifs/winter-snowflake.png` - AI-generated source motif.
- `motifs/rain-cloud.png` - AI-generated source motif.
- `motifs/rain-drop.png` - AI-generated source motif.

## Provenance

- Source: built-in image generation for isolated source motifs, then project-owned procedural composition through `scripts/generate-owned-assets.js patterns`.
- Style: soft low-poly journal direction at level 6, with sparse single-motif seasonal tiles.
- Inputs: no third-party images, stock references, external textures, brand marks, text, copyrighted characters, people, or named artist style targets.
- Generated dimensions: source motifs are `512x512`; final wallpaper tiles are `768x768`.
- Intended display size: subtle full-screen decorative app background.
- Motif rule: each seasonal tile uses one repeated motif type only. Rain intentionally uses two motif types: cloud and raindrop.
- Motif scale: reduced to 75% of the previous generated pattern size.
- Layout rule: each season uses a distinct sparse position map so the theme backgrounds do not share the same visible repetition.
- License intent: original generated assets for this app.
- Attribution: none expected from this generation path.
- Release status: draft until human IP/design review is completed.

## Release Notes

These are draft generated patterns. They are meant to improve visual quality while the final visual direction is unsettled. Final release patterns should be checked for artifacts, confusing similarity, readability in light/dark themes, and seamless repeat behavior, with approval recorded in `assets/ASSET_REGISTER.md`.
