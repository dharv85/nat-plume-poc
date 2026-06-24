# DF4 (lateral transport) — handoff to Craig

Branch `alberta-model` · 2026-06-24 · **Craig authorized the engine change** (separate session). This
documents the saturated-transport (Step 4 / DF4) reconciliation against the published AB Tier 1 aquatic
guidelines, what's fixed, and the residual that needs the **official AB Tier 2 calculator** to close.

## Context
The aquatic-life soil guideline = SWQG_aquatic (Table C-11) × DF1·DF2·DF3·DF4, with DF4 = lateral
groundwater transport over x = 10 m (`fSaturated`, the frozen Domenico core). Harness:
`ab_tier1_reconcile.js` (Part B). "Published DF4" below = published GW guideline / C-11 surface-water
guideline (since gw = SWQG·DF4).

## ✅ Fixed (validated)
1. **AB ignores effective porosity ne (BC-only).** Per Emma + AB Tier 1 Table C-2 (lists only *Soil Total
   Porosity θt = 0.47/0.36*, no ne) and p134 (`v = V/(θt·Rs)`), `fSaturated` now uses **θt (sp.n)** for
   the seepage velocity in AB mode (`abMode=true`); BC keeps ne (byte-identical, `engine.test.js` 1e-9).
2. **TCE saturated half-life null → 2.19 yr** (Table C-6, CCME). TCE coarse DF4 went −92% → **+7%** (ok).
3. **Non-degraders fully reconcile** (PCE 0%, naphthalene ±2%) — confirms DF1·DF2·DF3 *and* the DF4
   dispersion term are correct.

## ⚠ Residual — biodegrader DF4 over-predicts the published values ~2× (needs official calculator)
With the documented θt method + sourced half-lives, DF4 for biodegrading solutes runs **higher than
published** (so the soil guideline is *less* stringent — non-conservative vs AB's numbers):

| Contaminant | t½ (yr) | tool DF4 (f/c) | published DF4 (f/c) | full-chain %diff (f/c) |
|---|---|---|---|---|
| Benzene | 1 | 202 / 2.15 | ~90 / 1.85 | +126% / +18% |
| Toluene | 0.29 | 2.9e8 / 84 | ~2.4e7 / 42 | +1077% / +107% |
| Ethylbenzene | 0.31 | — / 1330 | — / 456 | — / +188% |
| Xylenes | 0.50 | — / 226 | — / 96.7 | — / +132% |
| TCE | 2.19 | 21.9 / 1.49 | 12.9 / 1.38 | +67% / +7% |

**What we ruled out (so you don't have to):**
- *Porosity convention:* ne (old) **under**-predicted; θt (now) **over**-predicts. Published sits between,
  but θt is the documented/Emma-confirmed convention — so the gap is **not** the porosity choice.
- *Steady vs transient:* `fSaturated(…,steady)` and `…transient t=500` give identical DF4 here (plume is
  at steady state by 500 yr) — not the time basis.
- *Transverse-dispersion factor of 2:* checked — would break the non-degraders (PCE DF4≈1), so the
  single-`erf` centreline form is right. The residual is in the **longitudinal decay term** only.
- *Magnitude:* the over-prediction tracks half-life/Koc (worst for short-t½, high-Koc), i.e. it's in how
  **biodegradation attenuation** is computed along the flow path.

**For Craig — the open question:** the documented DF4 equation (p134) + sourced parameters yields ~2× the
attenuation-credit AB's published guidelines imply. Likely candidates: the exact DF4 equation form AB's
**official Tier 2 calculator** uses (vs our Domenico `fSaturated`), the saturated half-life values for
benzene/toluene/EB/xylenes, or a decay treatment detail (e.g. decay on retarded vs un-retarded travel).
**Action:** run benzene + TCE (fine & coarse) through the official AB Tier 2 calculator and compare DF4
cell-for-cell; that will pin the equation/parameter difference. Until then the aquatic/wildlife pathway is
**convention-correct but not magnitude-reconciled for biodegraders** — flagged, not trusted.

## Not affected
DUA/potable, livestock, irrigation pathways use **x = 0 → DF4 = 1**, so they're unaffected by this and
remain reconciled (DUA 14/14; livestock/irrigation reconciled by the DF3 `abMix` fix). PCE & all
non-degraders reconcile fully. The issue is **only** DF4's biodegradation term for aquatic/wildlife.
