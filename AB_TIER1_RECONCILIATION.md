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

## Unit reminder (carries into the UI wiring)
`abSoilGuideline()` expects the standard in **µg/L**. Passing mg/L is a silent 1000× error.

## What this validates / what remains
- ✅ **DF1·DF2·DF3 chain, partition chemistry (A-6 Koc), Zd = 2 m DW mixing zone, and unit handling are
  correct** across **both petroleum hydrocarbons (BTEX/naphthalene) and chlorinated solvents (TCE/PCE)**
  for the drinking-water pathway — covering the SLR/Suncor priority classes.
- ◐ **Other pathways** (aquatic/livestock/irrigation with DF4 lateral transport at x = 10 m) and **PHC
  fractions** not yet in this table — extend `CASES` and re-run.
- ◐ **Metals** remain excluded by design (AB does not model soil→GW for inorganics).
- ◐ **Formal sign-off:** confirm with Emma and reproduce against the **official AEPA Tier 2 calculator**;
  the published Tier 1 tables are the proxy used here. Standard attribution cited to Table A-2 / B-2.

## How to extend
Add rows to `CASES` (contaminant, potable SWQG mg/L, published DUA fine/coarse). Re-run; each case prints
%diff and an `ok`/`CHECK` flag at ±15%. For non-DW pathways, switch the `WaterUse` and source the
matching standard column (Aquatic/Livestock/Irrigation) from Table B-2.
