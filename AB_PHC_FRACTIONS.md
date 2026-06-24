# PHC fractions — the AB Tier 1 summation method, and how the tool should handle F1–F4

Branch `alberta-model` · 2026-06-24 · follow-up to `AB_TIER1_RECONCILIATION.md` (the PHC-fraction flag).
Reviews the Alberta Tier 1 (2024) **sub-fraction summation equations** (Appendix C, §C.2.2.5, p120–121)
and recommends how the tool should treat PHC fractions.

> **DECISION (Dan, 2026-06-24): DEFER all PHC-fraction implementation until a clear need.**
> No lumped F1/F2 entries and no summation are being built now. The methodology + recommendation below
> are captured so the work is ready to pick up the moment an Alberta site with PHC-fraction data needs
> screening. **When that need arises:** quick path = lumped published Tier 1 F1/F2 guidelines as the
> screening standard (steps 1–2 below); fuller path = optional speciated Tier-2 summation (step 4).
> Current state stays as-is: CCME sub-fractions remain in `ab_a6.json`; F3/F4 have no GW pathway; the
> harness (`ab_tier1_reconcile.js`) documents the fractions honestly.

## What the guideline actually does (verbatim method)
AB does **not** assign one Koc to a lumped fraction. Each PHC fraction (F1 = C6–C10, F2 = >C10–C16,
etc.) is split into **sub-fractions** by structure (aliphatic vs aromatic) and carbon range, each with its
own guideline, then **combined by a reciprocal (harmonic) mass-weighted summation**:

**Eq. 1 — fraction guideline:**
> `SGRG = 1 / Σᵢ ( Fᵢ / SGRGᵢ )`
> SGRG = soil (mg/kg) or groundwater (mg/L) guideline for the fraction; Fᵢ = assumed mass proportion of
> sub-fraction *i* (Table C-10); SGRGᵢ = guideline for sub-fraction *i*. Soil uses soil proportions,
> groundwater uses groundwater proportions.

**Eq. 2 — groundwater proportions from soil proportions (equilibrium partitioning):**
> `Gᵢ = Fᵢ(soil) · ρb / (θw + Koc·foc·ρb + H′·θa)` , then `Fᵢ(gw) = Gᵢ / Σ Gᵢ` (normalized)

- Soil proportions `Fᵢ(soil)` are **adopted directly from CCME (2008)** (Table C-10).
- Individual exposure-pathway guidelines are **capped at 30,000 mg/kg** (CCME CWS-PHC consistency).
- The same Eq. 1 produces both the lumped **groundwater** guideline (F1 = 2.2, F2 = 1.1 mg/L) and the
  lumped **DUA soil** guideline (F1 = 1100/2200, F2 = 1500/2900 mg/kg) — they are the *published* result.

This is exactly why our single-substance harness can't reproduce lumped F1/F2: the published number is a
reciprocal combination of *several* sub-fraction guidelines, not a DF run on one Koc. (F1 looked close
because its most-mobile sub-fraction, Aliphatic C6–C8, dominates the reciprocal sum; F2 doesn't have a
single dominator.)

## What re-deriving in the tool would require
To run Eq. 1 ourselves we'd need, per sub-fraction: **(a)** the sub-fraction *guideline* SGRGᵢ, and
**(b)** the proportions Fᵢ. Status:
- `Fᵢ(soil)` — available (Table C-10 / CCME 2008). `Fᵢ(gw)` — derivable from Eq. 2 (we already have Koc,
  H′, foc, ρb, θw, θa in `ab_a6.json` + site params). ✅
- **`SGRGᵢ` (sub-fraction guidelines) — NOT in the AB tables or `ab_a6.json`.** They are intermediate
  CCME (2008a) values; only the *lumped* F1/F2 guidelines are published in AB Tier 1. ✗ ← the blocker.

So re-deriving means transcribing the full CCME (2008a) sub-fraction guideline set and reproducing AB's
toxicity/partition derivation — significant work and transcription risk, to regenerate a number AB has
**already published**.

## Recommendation — use the published lumped guideline; don't re-derive (with a Tier-2 path kept open)

**1． Add lumped `F1` and `F2` as screening substances whose guideline is the PUBLISHED Tier 1 value**
(loaded as a compliance standard from the tables/EQuIS, like every other standard — not computed in
client code). This is what site work needs: labs report **lumped F1–F4**, and the screen is
lumped-conc vs lumped-guideline. It also keeps us bit-for-bit aligned with the legally binding number and
honours the guardrail that compliance values come from the regulator, not from our re-derivation.
   - **F3 / F4:** no groundwater pathway (published "–"); keep excluded from the soil→GW screen.

**2． For the map/plume only, give F1/F2 a representative transport Koc/H′** (the engine needs
retardation to draw a plume). Two defensible options, clearly labelled *"representative — visualization
only; compliance uses the published guideline"*:
   - the **proportion-weighted bulk partition** from Eq. 2's denominator (most faithful to the method), or
   - the **controlling sub-fraction** (Aliphatic C6–C8 for F1) as a conservative-mobility proxy.

**3． Keep the CCME sub-fractions in `ab_a6.json`.** They're correct and are the inputs for (a) the
representative partition in step 2 and (b) a future **speciated / Tier-2** option.

**4． Defer the full Eq. 1 summation to a Tier-2 enhancement, documented now.** It only earns its keep
when a lab provides **actual sub-fraction concentrations** and the user wants a *site-specific* fraction
guideline using their own proportions instead of CCME defaults. At that point implement Eq. 1 + Eq. 2 with
the `ab_a6.json` sub-fraction Koc/H′ — but it still needs the sub-fraction guidelines SGRGᵢ (item (b)
above), so it's gated on sourcing those from CCME (2008a). Flag for Emma/Craig.

### Why not implement the summation now
- The official result is **already published** — re-deriving risks divergence (rounding, proportion
  assumptions, sub-fraction-guideline sourcing) from the binding Tier 1 number, for zero screening benefit.
- It adds a CCME (2008a) data dependency + transcription risk (`SGRGᵢ`) the screening path doesn't need.
- Screening = lumped-vs-lumped; storing the published lumped guideline delivers that directly.

## Action items
- [ ] Add `F1`, `F2` lumped entries (published Tier 1 guideline as standard; representative Koc/H′ flagged).
- [ ] Confirm with **Emma**: representative-Koc choice for the plume; whether speciated Tier-2 derivation is
      ever in scope (if so, **Craig** to source CCME 2008a sub-fraction guidelines).
- [ ] Keep F3/F4 out of the soil→GW screen (no GW pathway).
- [ ] If/when speciated mode is wanted: implement Eq. 1 + Eq. 2 (Table C-10 proportions + sub-fraction
      guidelines); reconcile against the published lumped values as the check.
