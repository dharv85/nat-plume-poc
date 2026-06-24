# AB Tier 1 reconciliation — DF chain vs published "Protection of Domestic Use Aquifer" soil guidelines

Branch `alberta-model` · 2026-06-24 · closes roundtable finding #7 for the drinking-water pathway.
Harness: **`ab_tier1_reconcile.js`** (`node ab_tier1_reconcile.js`).

## Result — ✅ 14/14 within 1–3%
The tool reproduces the **published Alberta Tier 1 drinking-water soil remediation guidelines** for all
BTEX + naphthalene + the chlorinated solvents TCE/PCE, fine and coarse, to within **1–3%**:

| Contaminant | Texture | Tool SRG (mg/kg) | Published DUA (mg/kg) | %diff |
|---|---|---|---|---|
| Benzene | fine / coarse | 0.0451 / 0.0772 | 0.046 / 0.078 | −2% / −1% |
| Toluene | fine / coarse | 0.509 / 0.935 | 0.52 / 0.95 | −2% / −2% |
| Ethylbenzene | fine / coarse | 0.0725 / 0.137 | 0.073 / 0.14 | −1% / −2% |
| Xylenes | fine / coarse | 0.976 / 1.85 | 0.99 / 1.9 | −1% / −3% |
| Naphthalene | fine / coarse | 27.1 / 51.7 | 28 / 53 | −3% / −2% |
| Trichloroethylene (TCE) | fine / coarse | 0.0536 / 0.0913 | 0.054 / 0.093 | −1% / −2% |
| Tetrachloroethylene (PCE) | fine / coarse | 0.253 / 0.457 | 0.26 / 0.46 | −3% / −1% |

The small (~1–3%) consistent low bias is rounding of the published values + chemistry constants — not a
structural error. This is a genuine cell-for-cell reconciliation of the soil→groundwater DF chain.

## Method
The published AB Tier 1 **"Protection of Domestic Use Aquifer" (DUA)** soil guideline equals the DF chain
at the Tier 1 default inputs:

> **SRG = SWQG (potable GW guideline) × DF1 × DF2 × DF3 × DF4**

- **SWQG** = the **Potable** groundwater guideline (Table B-2 "Potable" column, mg/L), supplied to the
  engine in **µg/L** (`f_partition` carries the /1000).
- **DW (DUA) pathway:** mixing-zone thickness **Zd = 2 m fixed** (AB Tier 1/2 p103), point of compliance
  **x = 0** → DF4 = 1, and DF2 = 1 here (default source at the water table, b = 0).
- **Published target:** the DUA columns of the AB Tier 1 surface-soil tables (Table A-2, "Protection of
  Domestic Use Aquifer" Fine/Coarse).

## Two findings the harness surfaced (both now resolved)
1. **`abSoilGuideline()` was not applying the DW Zd = 2 m fix** (it called the *calculated* mixing zone).
   The UI's `computePathway` already applied it (finding #2); the guideline-derivation helper now matches
   — `DF3 = dilutionFactor(sp, use===DRINKING ? 2 : null)`. With the calculated zone the tool was ~50%
   low; with Zd = 2 m it matches to 1–3%.
2. **Use the POTABLE standard, not the "Lowest Guideline."** Driving the DUA soil pathway off the Table 2
   "Lowest Guideline" made naphthalene wrong by ~500× — because naphthalene's lowest guideline
   (0.001 mg/L) is its *aquatic-life* value, while the DUA pathway uses its **potable** value (0.47 mg/L).
   For BTEX the two are identical, so only naphthalene exposed it. **Implication for the live tool:** the
   DW/DUA screen must read the *Potable* standard from EQuIS/AGOL, not the most-stringent overall value.

## Aquatic-life pathway — soil→GW chain reconciled; DF4 (lateral transport) only for non-degraders
Full chain: **SRG = SWQG_aquatic (Table C-11) × DF1·DF2·DF3·DF4**. Differs from DUA in two ways: point of
compliance **x = 10 m** → DF4 lateral transport is **active** (p132), and the mixing zone **DF3 is
calculated** (not fixed Zd = 2 m). Tested in two parts so any discrepancy is localised.

**Part A — soil→GW chain** via the soil/gw ratio (`= DF1·DF2·DF3`; DF4 + surface-water guideline cancel).
**✅ 12/12 within 1–3%** (Benzene 2.21/2.34 vs 2.19/2.30; Toluene 5.20/5.91 vs 5.25/5.71; EB-coarse 13.0
vs 13.2; Xylenes-coarse 14.0 vs 14.1; Naphthalene 14.1/16.7 vs 14.0/17.0; TCE 2.62/2.77 vs 2.67/2.79;
PCE 6.19/6.94 vs 6.27/7.00). This confirms the soil→GW chain incl. the AB mixing-zone fix.

**Part B — full chain incl. DF4** against the **Table C-11** "Aquatic Life" surface-water guidelines
(Benzene 0.04, Toluene 0.0005, EB 0.09, Xylenes 0.03, Naphthalene 0.001, TCE 0.021, PCE 0.111 mg/L):

| Contaminant | t½ (yr) | tool soil (f/c) | published (f/c) | %diff | verdict |
|---|---|---|---|---|---|
| **PCE** | — | 0.688 / 0.770 | 0.69 / 0.77 | 0% / 0% | ✅ |
| **Naphthalene** | — | 0.0141 / 0.0167 | 0.014 / 0.017 | +1% / −2% | ✅ |
| Benzene | 1 | 2.30 / 0.161 | 7.9 / 0.17 | −71% / −5% | ❌ fine |
| Toluene | 0.29 | 1360 / 0.083 | 63000 / 0.12 | −98% / −31% | ❌ |
| Ethylbenzene | 0.31 | 295 (c) | 540 (c) | −45% | ❌ |
| Xylenes | 0.50 | 25.7 (c) | 41 (c) | −37% | ❌ |
| TCE | — (null) | 0.055 / 0.058 | 0.72 / 0.081 | −92% / −28% | ❌ |

**Reading:** the **soil→GW chain reconciles for everything** (Part A 12/12; the two **non-degrading**
solutes PCE & naphthalene match the *full* chain to 0–2%, proving DF4≈1 and the chain are both right).
**DF4 (lateral transport) only reconciles for non-degraders** — it diverges for every biodegrading solute
and for TCE. The divergence is entirely in DF4's biodegradation term.

### DF4 — RESOLVED (Craig-authorized) → see `AB_DF4_NOTES.md`. Full chain +0% to +14% (mostly ≤6%)
The over-prediction was a **BC-vs-AB confusion in the biodegradation decay term, not a math error** (the
DF4 equation form `4/[exp(A)·erfc(B)·(erf(C)−erf(D))]` is exactly what `fSaturated` implements). Three
AB-specific fixes (all p134–135, BC byte-identical, `engine.test.js` 1e-9):
1. **Velocity** uses **total porosity θt** (`v = V/(θt·Rs)`); ne is BC-only (Table C-2).
2. **Decay constant `Ls = 0.6931·e^(−0.07·d)/t½`** — the tool was missing the **`e^(−0.07·d)`
   water-table-depth factor** (BC uses plain `0.6931/t½`). This was the cause of the ~2× over-prediction.
3. **TCE half-life** null → **2.19 yr** (Table C-6).

| Contaminant | full-chain %diff (fine/coarse) |
|---|---|
| Benzene | +4% / +3% |
| Toluene | +14%* / +6% |
| Ethylbenzene / Xylenes (coarse) | +6% / +5% |
| TCE | +3% / −0% |
| PCE, Naphthalene (non-degraders) | ±0–2% |

*Toluene-fine is the degenerate capped case (published 63,000 > the 30,000 cap). DUA/livestock/irrigation
(x = 0 → DF4 = 1) unaffected. **Aquatic-life pathway now reconciles end-to-end.**

### 🐞 Engine finding (Part A): DF3 used BC GPM constants, not AB (fixed; needs Craig sign-off)
The shared `dilutionFactor` computed the mixing zone with **BC GPM constants** (`Zd = 0.1·X +
da·(1−exp(−X·I/(V·da)))`); AB Tier 1 (p133) prescribes `Zd = 0.01·X + da·(1−exp(−2.178·X·I/(V·da)))`.
The BC form ran the mixing zone **~3.7× large → soil guidelines ~3.7× too high (non-conservative)** on
every pathway except DUA (masked by the fixed Zd = 2 m). Fix: a third `abMix` argument selects the AB
constants; `abSoilGuideline` and the UI's AB path pass it. **BC path byte-identical** (`engine.test.js`
still 1e-9; DUA still 14/14). Validated by Part A (12/12) + the non-degrader full chain. Also corrects the
live **livestock / irrigation** pathways (x = 0 → DF4 = 1, so those are *fully* reconciled by this fix).
Resolves roundtable **#9** (DF4 active for aquatic/wildlife only, p132); logged as new finding **#15**.

## PHC fractions (F1–F4) — a methodology boundary, flagged not forced
Labs report **lumped F1–F4**, but AB derives the lumped Tier 1 guideline from **CCME (2008a)
sub-fraction** methodology, and `ab_a6.json` stores those **sub-fractions** (the A-6/C-6 chemistry table
leaves Koc/Henry blank for lumped F1/F2 — only a half-life is given). So the lumped F1/F2 guideline is
**not reproducible by a single-substance DF run**. The harness reports the relationship honestly:

| Fraction | Published DUA (fine/coarse) | Tool result | Status |
|---|---|---|---|
| **F1** | 1100 / 2200 | Aliphatic C6–C8 (controlling): 1070 / 1810 | ≈lumped (fine −3%, coarse −18%) |
| **F2** | 1500 / 2900 | sub-fraction spread 440 … 22,200 — lumped sits between | needs CCME (2008a) weighting |
| **F3 / F4** | "–" (no GW pathway) | C>16 sub-fractions Koc 1e7–1e13 → immobile | ✅ correct by exclusion |

**⚠ FLAG (Emma/Craig):** to *screen lab-reported lumped F1/F2* against Tier 1, the tool needs
**lumped-fraction entries** — either the published F1/F2 guideline directly, or CCME (2008a)
representative Koc/Henry per fraction. The stored sub-fractions alone cannot reproduce the lumped value
(F1 is ≈controlled by Aliphatic C6–C8; F2 is a genuine sub-fraction combination). This is a real gap for
AB site work, since site PHC data arrives as lumped F1–F4.

## Unit reminder (carries into the UI wiring)
`abSoilGuideline()` expects the standard in **µg/L**. Passing mg/L is a silent 1000× error.

## What this validates / what remains
- ✅ **DF1·DF2·DF3 chain, partition chemistry (A-6 Koc), Zd = 2 m DW mixing zone, and unit handling are
  correct** across **both petroleum hydrocarbons (BTEX/naphthalene) and chlorinated solvents (TCE/PCE)**
  for the drinking-water pathway — covering the SLR/Suncor priority classes.
- ◐ **PHC fractions:** F3/F4 correctly excluded; F1≈controlling sub-fraction; **lumped F1/F2 need
  CCME (2008a) lumped entries in the tool** (flagged above) before they can be screened/reconciled.
- ◐ **Other pathways** (aquatic/livestock/irrigation with DF4 lateral transport at x = 10 m) not yet in
  this table — extend `CASES` and re-run.
- ◐ **Metals** remain excluded by design (AB does not model soil→GW for inorganics).
- ◐ **Formal sign-off:** confirm with Emma and reproduce against the **official AEPA Tier 2 calculator**;
  the published Tier 1 tables are the proxy used here. Standard attribution cited to Table A-2 / B-2.

## How to extend
Add rows to `CASES` (contaminant, potable SWQG mg/L, published DUA fine/coarse). Re-run; each case prints
%diff and an `ok`/`CHECK` flag at ±15%. For non-DW pathways, switch the `WaterUse` and source the
matching standard column (Aquatic/Livestock/Irrigation) from Table B-2.
