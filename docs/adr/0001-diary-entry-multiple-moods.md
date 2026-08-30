# ADR 0001: Diary Entry Multiple Moods

## Status

Accepted

## Context

Diary entries previously stored one optional manual mood in `manualMood`. Users now need to select more than one mood for a single diary entry, while existing entries, filters, insights, archive, calendar, drafts, exports, and restores must keep working.

Diary entry content is highly confidential personal data, so the change must stay within the existing encrypted repository flow and must not introduce new persistence paths or telemetry.

## Decision

Add `manualMoods` as the canonical mood field on `DiaryEntry`, storing an ordered array of `ManualMood` values. Keep `manualMood` as the primary mood for backwards compatibility with existing readers and older serialized records.

Normalize mood selection through shared domain helpers:

- Deduplicate selected moods.
- Treat `neutral` as exclusive when combined with other moods.
- Derive `manualMoods` from legacy `manualMood` during schema migration and draft hydration.
- Derive `manualMood` from the first selected mood when saving.

Bump the diary storage schema version from `4` to `5`.

## Alternatives Considered

- Replace `manualMood` outright: rejected because older entries and any legacy readers would lose a stable primary mood field.
- Store moods as tags: rejected because moods drive dedicated filters, calendar markers, and insights with different semantics than user tags.

## Consequences

Multiple mood selection is now available in create, edit, and entry detail metadata surfaces. Existing entries continue to migrate in place through the repository-owned schema path. Mood filters and analytics can count entries under each selected mood.

Rollback would require collapsing `manualMoods` back to the first mood and keeping only `manualMood`.

## Compliance Gates

Reference [`agents/compliance-gates.md`](../../agents/compliance-gates.md).

```text
Gates applied: data storage, privacy/logging, accessibility, regression testing
Validation run: npm run typecheck; targeted Jest pending in implementing change
Residual risk: visual density of multiple mood labels on very narrow screens should be reviewed on device
Human review needed: product/design approval for neutral-exclusive mood behavior
```

## Follow-Up

- Verify multi-mood labels on small phones and tablet widths during UI QA.
