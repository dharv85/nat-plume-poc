# Alberta Tier 1/2 — Review & sign-off checklist for Emma

**Branch `alberta-model` · 2026-06-24 · For Emma Kirsh (AB regulatory lead, P.Geol).**

This is the single consolidated list of everything that needs your confirmation. Items are prioritized;
each says **what to check**, the **source**, **why it matters**, and where the detail lives. Tick the box
or note a correction. Nothing here is a tool bug — these are regulatory-judgement / second-reviewer calls
that should be owned by a P.Geol before the tool is used on a real Alberta site.

> **Context in 3 lines:** the tool's soil→groundwater chain (DF1–DF4) now reproduces the **published AB
> Tier 1 (2024) soil guidelines** across all groundwater-protection pathways — **DUA 14/14, Aquatic 12/12,
> Livestock 10/10, Wildlife 5/5**, to within published 2-significant-figure precision. There is **no
> official AB Tier 2 calculator**, so the published Tier 1 guidelines are the authoritative target.
> Detail: `AB_TIER1_RECONCILIATION.md`. The asks below are the sign-offs that close it out.

---

## Priority 1 — Chemistry & defaults (your core domain)
- [ ] **A-6 / Table C-6 chemistry (34 contaminants)** — independent check of Koc, H′, solubility, and
  saturated half-lives against your copy of the guidance. The tool's values (`ab_a6.json`) were transcribed
  + verified line-by-line and **match Table C-6 exactly** for the 7 reconciled contaminants, but the full
  set needs a second set of P.Geol eyes. *Source: AB Tier 1 Table C-6 / Tier 2 Table A-6. Detail:
  `AB_DEFAULTS_VALIDATION.md`.*
- [ ] **Site defaults (Tables C-2 / C-3 / A-2):** K = 320/32 m/yr, I = 0.06/0.012, θt = 0.36/0.47,
  ρb = 1.7/1.4, foc = 0.005, d (water table) = 3 m, da (aquifer) = 5 m, Z = 3 m, Y = X = 10 m, t = 500 yr,
  x = 0 (potable/ag) / 10 m (surface water/wildlife). All guidance-sourced — confirm they're the values you
  expect for generic Tier 1.
- [ ] **C-1 allowable input ranges** — confirm the texture-dependent ranges wired into the tool's
  "outside range" flagging.

## Priority 2 — Accept the reconciliation
- [ ] **Worked-example acceptance.** Review the reconciliation tables (BTEX, naphthalene, TCE, PCE; fine &
  coarse; all four pathways) and confirm you accept that the tool reproduces the published Tier 1 numbers.
  Residual is ±1–5%, audited as **100% rounding** (`ab_residual_analysis.js`). *Detail:
  `AB_TIER1_RECONCILIATION.md`.*
- [ ] **DUA pathway uses the *Potable* groundwater standard** (Table B-2 "Potable" column), **not** the
  Table 2 "Lowest Guideline." This matters: e.g. naphthalene's lowest guideline (0.001 mg/L) is its
  *aquatic* value; its potable value is 0.47. Confirm this is correct, and that the **live DW screen must
  read the Potable column** from EQuIS.
- [ ] **Naphthalene potable SWQG = 0.47 mg/L** — the one case ~2% off; traced to this published value's
  2-s.f. rounding (≈0.48 internal). Confirm 0.47 is the value to use.

## Priority 3 — Tier-2 / engine items (with Craig)
- [ ] **DF4 decay factor `Ls = 0.6931·e^(−0.07·d)/t½`** — please **eyeball the actual guidance equation
  (Tier 1 p134–135)**. It is load-bearing (it's what makes the biodegrading solutes reconcile) and was
  reconstructed from a messy PDF extraction; confirm the form and that "d" = water-table depth. It is
  **validated only at d = 3 m** (Tier 1 default) — for **Tier-2 site-specific depths** it's an
  extrapolation. *Detail: `AB_DF4_NOTES.md`.*
- [ ] **DF2 unsaturated-zone decay for b > 0** — at the Tier 1 default the source is at the water table
  (b = 0 → DF2 = 1), so this path is untested. Confirm AB's convention before any site with an unsaturated
  zone above the source.

## Priority 4 — Metals (needs your resolution)
- [ ] **Metals workflow + guideline values.** The tool blocks the soil→GW pathway for inorganics (correct —
  AB doesn't model it) and falls back to observed groundwater + the AB GW compliance standard. The screening
  table of all 20 metals vs AB GW guideline values needs your resolution. *Detail: `AB_METALS_SCREENING.md`.*

## Priority 5 — Production compliance standards
- [ ] **Replace the TRAINING export.** The AB GW standards currently shown are from an EQuIS **TRAINING**
  export (flagged "verify") with some missing metal values. Swap for **production** EQuIS standards,
  use/texture-specific, fail-closed when none loads.

## Deferred / FYI (no action now)
- **PHC lumped F1/F2** — deferred (Dan) until a PHC-driven site needs them. The tool stores CCME
  sub-fractions; lumped F1/F2 use a summation method (`AB_PHC_FRACTIONS.md`). Flag if a near-term site
  changes this.
- **Irrigation** — AB has no irrigation guideline for BTEX/PHC/chlorinated organics (inorganics/pesticides
  only), so there's nothing to screen for organics on that pathway.

## ✅ Already confirmed/decided (recorded — no need to revisit)
- **TCE saturated half-life = 2.19 yr** (Table C-6, CCME) — **confirmed by you, 2026-06-24**.
- PHC sub-fraction half-lives F1 = 1.95 / F2 = 4.79 yr; PCP single Koc = 2500; DIPA Kd = 2.2; PFOS
  Koc = 1,445; Nonylphenol mapping; C-2 linked groups as free-edit-with-note — all decided by Dan.
- d = 3 m, t = 500 yr, and the other site characteristics — guidance-confirmed (Table C-3).
- DF4 saturated-transport engine changes — authorized by Craig; BC path byte-identical (`engine.test.js`
  1e-9).

---

### Where to find things
| Need | Doc |
|---|---|
| Reconciliation results + method | `AB_TIER1_RECONCILIATION.md` |
| DF4 derivation, decay factor, review notes | `AB_DF4_NOTES.md` |
| Input defaults vs Appendix A / C | `AB_DEFAULTS_VALIDATION.md` |
| Metals | `AB_METALS_SCREENING.md` |
| PHC fractions | `AB_PHC_FRACTIONS.md` |
| Residual audit (rounding proof) | `ab_residual_analysis.js` |
| Run the reconciliation yourself | `node ab_tier1_reconcile.js` |
| Expert review + code review | `AB_ROUNDTABLE_REVIEW.md` (§3 findings, §6 code review) |
