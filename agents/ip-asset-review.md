# IP And Asset Review Reference

Use this reference when adding or changing assets, fonts, icons, illustrations, stickers, sounds, generated images, product names, app names, or branded material.

## Required Context

- `agents/02-design-agent.md`
- `agents/compliance-gates.md`
- `agents/original-asset-generation.md` when generated or project-authored illustration assets are involved.
- `docs/AppDesignGuidelines.md`
- Asset source, license, generation prompt, or provenance notes.

## Review Checklist

- Asset source is known and recorded.
- License permits the intended app, commercial, and distribution use.
- Attribution requirements are documented.
- Generated image usage records the prompt/source, draft/final status, model/tool when known, and generation date.
- AI-generated assets are treated as drafts unless a human redraw or material human polish step is documented.
- Final release candidates include designer handoff notes or source evidence showing what changed from the generated draft.
- Third-party reference images were not used as generator inputs unless ownership or commercial-use rights are documented.
- Generated assets avoid confusing similarity to protected works, real people, existing sticker collections, brands, logos, and product packaging.
- Generated illustration assets follow the original-asset visual DNA and originality requirements in `agents/original-asset-generation.md`.
- Prompts and review notes do not rely on named artist, studio, company, franchise, game, film, sticker-pack, or brand style targets, including examples like "Studio Ghibli-like", "Disney-like", "Pixar-style", "Sanrio-like", "Pokemon-style", or "Animal Crossing-style".
- Any protected-style shorthand has been converted into neutral medium, texture, composition, palette, and mood language before generation or approval.
- App names, product names, and marks have human owner review before release.
- Third-party logos, brand marks, celebrity likenesses, and copyrighted characters are not used without authorization.
- Asset dimensions and file size are suitable for mobile.
- Accessibility text is provided for meaningful images.

## Web Reference Review

Use web research to check whether an asset category is likely to be confused with existing brands, products, sticker packs, emoji sets, or protected visual identities. This is a screening step, not legal clearance.

- Prefer official sources for rule interpretation: USPTO trademark guidance, U.S. Copyright Office AI/copyright guidance, Apple App Store Review Guidelines, Google Play policy, and license owner pages.
- For trademark risk, check whether the asset creates a similar name, appearance, meaning, or overall commercial impression to a third-party mark.
- For design marks, identify the asset's prominent visual elements before searching. Record the plain-language keywords and, when useful, USPTO design search code categories checked.
- For copyright risk, reject assets that copy or closely imitate existing artwork, marketplace sticker sheets, platform emoji, characters, mascots, logos, celebrity/public-figure photos, or watermarked/stock preview art.
- For AI-generated assets, confirm human creative contribution is recorded before treating the asset as a release candidate.
- If a third-party reference was used only as category research, record "reference not uploaded; converted to neutral constraints" in the review notes.

## Frame Sticker Review

Frame stickers need extra trade-dress review because ordinary photo and stationery frames can resemble branded physical products.

- No brand names, logos, product-line names, packaging marks, readable text, fake serial numbers, film-stock markings, or watermark-like artifacts.
- No exact replica of recognizable instant-photo borders, camera film frames, scrapbook kits, stationery labels, adhesive notes, or branded paper products.
- The frame should read as a generic original diary decoration, not as a commercial product or app/platform sticker.
- If the frame is meant to hold a user photo, verify the center opening or mask behavior works cleanly at the intended in-app size.
- Review filenames, pack names, UI copy, and alt/accessibility labels for brand-adjacent wording.
- Escalate if the frame's silhouette, border proportions, colors, or decorative marks feel strongly associated with one real product or brand.

## Human Escalation

Escalate when provenance, commercial license, trademark clearance, likeness rights, generated-image similarity, or store-policy acceptability is uncertain.

## Output

```text
Asset:
Source:
License:
Attribution:
Generated/edited:
Draft/final status:
Prompt/source notes:
Reference inputs:
Web search/review notes:
Human redraw/polish evidence:
Trademark/likeness risk:
Accessibility text:
Decision:
Human review needed:
```
