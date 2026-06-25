# Alberta Tier 2 — metals handling & guideline-value screening table

**Branch `alberta-model` · 2026-06-24 · NEEDS EMMA'S RESOLUTION.**

## The issue (needs clear resolution)
AB Tier 2 **does not derive soil→groundwater guidelines for inorganics/metals** ("uncertainties in
metal partitioning" — assess by site-specific groundwater sampling). The tool now reflects this: under
the **AB framework**, selecting a metal **blocks the Steps 1–3 soil→GW pathway** and asks the user to
enter the **observed groundwater concentration** (C₀) directly.

**Important distinction — two separate things:**
- **Soil→GW modelling** (deriving C₀ from a soil concentration): **excluded** for metals in AB. ✅ blocked in the tool.
- **Groundwater compliance standard** (the threshold the plume is screened against): **still applies** —
  AB *does* publish groundwater guideline values for metals. The tool keeps showing these.

So for a metal under AB: user enters observed GW C₀ → plume is modelled → screened against the AB GW
guideline below.

## ⚠️ What still needs resolution (for Emma)
1. **Confirm this is the intended metals workflow** (block soil→GW derivation; model from observed GW;
   screen against the GW guideline).
2. **Confirm/curate the guideline values** in the table below — they are from the **EQuIS TRAINING**
   export (set: *AB GW Tier 1, Agricultural Land, Coarse*), flagged "verify", and the applicable value
   varies by **land use, water use, and soil texture** (this table shows ONE representative set).
3. **Source the missing values** (— below) — not present in this set; confirm the correct AB criteria.
4. Decide whether the tool should **auto-select the correct AB GW set** per land/water use (today it
   uses the framework default).

## Metals screening table — tool metals vs AB GW guideline (representative set)
Set shown: **AB GW Tier 1 · Agricultural Land · Coarse** (EQuIS TRAINING — verify).

| Metal | CAS | AB GW guideline (this set) | DB has Kd? |
|---|---|---|---|
| Arsenic | 7440-38-2 | 0.005 mg/L | yes |
| Barium | 7440-39-3 | 2.0 mg/L | yes |
| Beryllium | 7440-41-7 | — | yes |
| Cadmium | 7440-43-9 | 9e-05 mg/L | yes |
| Chloride ion | 16887-00-6 | 100.0 mg/L | yes |
| Chromium hexavalent | 18540-29-9 | 0.001 mg/L | yes |
| Chromium trivalent | 16065-83-1 | 0.0049 mg/L | yes |
| Cobalt | 7440-48-4 | — | yes |
| Copper | 7440-50-8 | 0.007 mg/L | yes |
| Cyanide | 57-12-5 | — | yes |
| Lead | 7439-92-1 | 0.001 mg/L | yes |
| Manganese | 7439-96-5 | 0.02 mg/L | yes |
| Mercury | 7439-97-6 | 5e-06 mg/L | yes |
| Molybdenum | 7439-98-7 | — | yes |
| Nickel | 7440-02-0 | 0.029 mg/L | yes |
| Selenium | 7782-49-2 | 0.002 mg/L | yes |
| Sodium ion | 17341-25-2 | — | yes |
| Uranium | 7440-61-1 | 0.01 mg/L | yes |
| Vanadium | 7440-62-2 | — | yes |
| Zinc | 7440-66-6 | 0.03 mg/L | yes |

*"—" = not present in this representative set; confirm the correct AB value/criteria.*
*"DB has Kd?" indicates whether the tool's BC Protocol 28 entry carries a sorption Kd (used only if a
user models the metal plume from an entered C₀; AB does not derive it).*

## Tool behaviour summary (implemented)
- AB + metal → soil→GW pathway blocked, clear in-app message (compliance explicitly noted), C₀ freed
  for manual entry.
- AB + metal → the AB GW compliance standard still loads from the compliance selector and is drawn as
  the plume threshold.
- BC / manual frameworks: metals handled as before (BC models metals via Kd).
