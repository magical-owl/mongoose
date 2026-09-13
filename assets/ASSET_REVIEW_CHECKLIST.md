# Asset Review Checklist

Use this checklist before TestFlight, Play internal testing, and release candidate builds. This is a practical review record, not legal clearance. Escalate uncertain IP, trademark, likeness, or licensing questions to the human owner and, when needed, a qualified legal reviewer.

Related references:

- [`ASSET_REGISTER.md`](ASSET_REGISTER.md)
- [`../agents/ip-asset-review.md`](../agents/ip-asset-review.md)
- [`../agents/original-asset-generation.md`](../agents/original-asset-generation.md)

## Review Status Key

- `Pending`: not reviewed yet.
- `Needs Polish`: usable direction, but visual quality or extraction needs work.
- `Needs Replacement`: do not ship this asset group as-is.
- `Approved For Test`: acceptable for internal/TestFlight testing.
- `Approved For Release`: human-reviewed and acceptable for store submission.

## Global Checks

- [ ] Every bundled asset is listed in [`ASSET_REGISTER.md`](ASSET_REGISTER.md).
- [ ] Asset source or generation method is recorded.
- [ ] AI-generated assets have prompt/source notes where available.
- [ ] No asset includes readable accidental text, signatures, watermarks, logos, or brand marks.
- [ ] No asset resembles a protected character, mascot, franchise, platform emoji, or known sticker collection.
- [ ] No asset uses a named living artist, studio, company, franchise, or brand style target.
- [ ] Asset dimensions are appropriate for in-app use.
- [ ] Transparent assets have clean edges with no halos, fringe pixels, or background remnants.
- [ ] Assets remain readable at their actual in-app display size.
- [ ] Light mode and dark mode readability have been checked where the asset appears behind UI/text.
- [ ] Final release candidates have human IP/design review recorded.

## Pre-Generation Checks

Use this before creating a new asset group, especially when the concept overlaps with physical products, brands, common marketplace art, or recognizable visual formats.

- [ ] Asset purpose, intended display size, and output dimensions are defined.
- [ ] Pack name and individual asset names use generic language, not brand-adjacent terms.
- [ ] Web research was used only to identify common visual risks and forbidden cues.
- [ ] Third-party reference images were not uploaded into a generator unless ownership or commercial-use rights are documented.
- [ ] Prompt uses neutral medium, structure, palette, mood, and composition terms instead of named artist/studio/franchise/brand references.
- [ ] Forbidden elements are listed in the generation packet.

### Frame Sticker Pack Pre-Generation

- [ ] Pack name avoids branded camera, film, scrapbook, stationery, and instant-photo product names.
- [ ] Frame concepts avoid exact commercial product proportions, film-stock markings, serial numbers, color stripes, and logo-like placements.
- [ ] Each frame has an original shape language: uneven handmade edges, distinct corner treatment, and app-owned palette choices.
- [ ] If frames are meant to sit over user photos, transparent cutout or mask requirements are documented before generation.

## Review Queue

| Asset group | Paths | Visual quality | IP/style risk | App fit | Status | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| App icon and splash | `assets/icon.png`, `assets/favicon.png`, `assets/splash-icon.png`, `assets/splash-logo.png`, `assets/splash-placeholder.png` | Pending | Pending | Pending | Pending | Temporary until final app name and brand direction are chosen. |
| Android adaptive icon | `assets/android-icon-background.png`, `assets/android-icon-foreground.png`, `assets/android-icon-monochrome.png` | Pending | Pending | Pending | Pending | Review after final app identity is chosen. |
| Journal cover backgrounds | `assets/journal-backgrounds/*.png` | Pending | Pending | Pending | Pending | Check scenery consistency, no recognizable real locations, no artifacts, readable cover overlays. |
| Diary paper backgrounds | `assets/diary-paper/*.png` | Pending | Pending | Pending | Pending | Check body text readability, dark-mode behavior, and repeated/tiling artifacts. |
| App pattern backgrounds | `assets/patterns/*.png`, `assets/patterns/motifs/*.png` | Pending | Pending | Pending | Pending | Check seamless repeat, motif size, background contrast, and visual noise. |
| Memory reaction icons | `assets/reactions/*.png` | Pending | Pending | Pending | Pending | Check icon clarity at 24-42 px and no emoji/platform lookalike risk. |
| Sticker pack: Cat | `assets/stickers/cat/*.png` | Pending | Pending | Pending | Pending | Check all six stickers at picker size and placed-sticker size. |
| Sticker pack: School | `assets/stickers/school/*.png` | Pending | Pending | Pending | Pending | Re-check pencil and backpack extraction after latest cleanup. |
| Premium sticker pack: Summer | `assets/stickers/summer/*.png` | Pending | Pending | Pending | Pending | Confirm premium lock behavior and small-size readability. |
| Sticker pack: Scribble Art | `assets/stickers/scribble/*.png` | Pending | Pending | Pending | Pending | Check that scribble assets look intentional, not malformed. |
| Premium sticker pack: Memory Frames | `assets/stickers/frames/*.png` | Pending | Pending | Pending | Pending | Check frame cutout behavior, transparent-edge specks, trade-dress risk, and whether frames work over user photos. |
| Premium sticker pack: Winter | `assets/stickers/winter/*.png` | Pending | Pending | Pending | Pending | Check seasonal consistency and small-size readability. |
| Premium sticker pack: Spring | `assets/stickers/spring/*.png` | Pending | Pending | Pending | Pending | Check bee/butterfly are generic and not mascot-like. |
| Premium sticker pack: Fall | `assets/stickers/fall/*.png` | Pending | Pending | Pending | Pending | Check mushroom/apple/pie for clean edges and generic design. |
| Source sheets | `assets/stickers/source-sheets/*.png` | Pending | Pending | Pending | Pending | Keep for provenance; not directly surfaced in app UI. |

## Per-Asset Notes Template

Use this when an individual asset needs a decision separate from its group.

```text
Asset:
Path:
Reviewer:
Date:
Visual quality:
IP/style risk:
App fit:
Decision:
Required changes:
Follow-up owner:
```

## Release Blockers

Do not mark an asset group `Approved For Release` when any of these are true:

- Watermark, signature, accidental text, logo, or brand-like mark is visible.
- The asset is confusingly similar to a known character, franchise, app, sticker pack, emoji set, or marketplace artwork.
- Transparent edges contain obvious halos, source-sheet leftovers, or background contamination.
- The asset is unreadable or visually muddy at its intended in-app size.
- The asset makes nearby text or controls hard to read.
- Source/provenance is missing from [`ASSET_REGISTER.md`](ASSET_REGISTER.md).
- Human review has not been completed for a release candidate.
