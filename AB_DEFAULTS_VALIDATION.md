# AB input-defaults validation — tool vs Alberta Tier 2 Appendix A

**Branch:** `alberta-model` · **Date:** 2026-06-24 · **For Emma to confirm against source tables.**

> **STATUS UPDATE (2026-06-24):** every "❌ WRONG" value flagged below has since been **corrected in the
> tool and reconciled** against the published AB Tier 1 guidelines (K → 320/32 m/yr, I → 0.06/0.012, Y → 10,
> x by water use, θt not ne). The DF1–DF4 chain now reproduces the published soil guidelines across all
> GW-protection pathways to ±1–5% (see `AB_TIER1_RECONCILIATION.md`). The table below is retained as the
> record of what was found.
**Source:** Alberta Tier 2 Soil & Groundwater Remediation Guidelines (2024-06), **Appendix A** —
Table **A-2** (Soil & Hydrogeological Parameters), Table **A-3** (Site Characteristics).
Values in A-2/A-3 are "from CCME (2006a) except as noted." AB defines **two soil scenarios:
Fine** and **Coarse**.

> Guardrail: this VALIDATES and FLAGS; it does not change the validated transport math. Default
> *values* are config — proposed corrections are listed for Emma's sign-off before applying.

## Result: 3 discrepancies, rest OK
The tool's single AB default matches AB **Coarse soil** for the soil properties, but **K,
infiltration, and source width are wrong** (legacy of "BC defaults with K/i swapped" — never set
from the AB tables).

| Parameter | Sym | Tool AB default | AB A-2 **Fine** | AB A-2 **Coarse** | Status |
|---|---|---|---|---|---|
| Bulk density | ρb | 1.7 g/cm³ | 1.4 | 1.7 | ✅ = Coarse |
| Total porosity | θt (n) | 0.36 | 0.47 | 0.36 | ✅ = Coarse |
| Moisture-filled porosity | θw (nw) | 0.119 | 0.168 | 0.119 | ✅ = Coarse |
| Fraction organic carbon | foc | 0.005 | 0.005 | 0.005 | ✅ match |
| Hydraulic gradient | i | 0.028 | 0.028 | 0.028 | ✅ match |
| **Saturated hydraulic conductivity** | **K** | **3×10⁻⁷ m/s (≈9.5 m/y)** | **32 m/y (1.0×10⁻⁶ m/s)** | **320 m/y (1.0×10⁻⁵ m/s)** | ❌ **WRONG** (≈3×–34× low) |
| **Recharge / infiltration** | **I** | **0.55 m/y** (BC Vancouver) | **0.012 m/y** | **0.06 m/y** | ❌ **WRONG** (≈9×–46× high) |
| **Source width ⊥ flow** | **Y** | **20 m** | 10 (A-3) | 10 | ❌ **WRONG** (AB = 10) |
| Source length ∥ flow | X | 10 m | 10 | 10 | ✅ match |
| Source depth | Z | 3 m | 3 | 3 | ✅ match |
| Depth to groundwater | d | 3 m | 3 | 3 | ✅ match |
| Aquifer thickness | da | 5 m | 5 | 5 | ✅ match |
| Transport time (transient) | t | 500 yr | 500 | 500 | ✅ match |

## Points of compliance (A-3) — for the x input
- Distance to **surface water** user: x = 10 m
- Distance to **potable** / **agricultural** water user: x = 0 m
(✅ DONE — x now varies by water use: potable/livestock/irrigation = 0, surface water/wildlife = 10 m.)

## Open items to confirm with Emma
1. ✅ RESOLVED — **Effective porosity (ne) is BC-only.** AB Table C-2 lists only **total porosity θt**
   (no ne); AB DF4 velocity is `v = V/(θt·Rs)`. The tool's AB path uses θt; ne is retained for BC only.
2. **Which soil scenario is the AB default** in the tool — Coarse (more mobile / conservative) or
   user-selectable Fine/Coarse? Recommend a **Fine/Coarse toggle**.
3. **Chemical defaults (Table A-6: Koc, Henry's, half-lives):** tool currently uses BC Protocol 28
   DB. Emma noted "most match AB Table A-6" — a separate cross-check of A-6 is still to do.
4. Confirm K units handling (AB tables are m/yr; tool stores K in m/s).

## Proposed corrections (pending Emma sign-off)
Replace the single AB default with the two AB scenarios from A-2/A-3:

| | Fine | Coarse |
|---|---|---|
| ρb | 1.4 | 1.7 |
| n (θt) | 0.47 | 0.36 |
| nw (θw) | 0.168 | 0.119 |
| foc | 0.005 | 0.005 |
| K (m/s) | 1.0×10⁻⁶ | 1.0×10⁻⁵ |
| i | 0.028 | 0.028 |
| I (m/y) | 0.012 | 0.06 |
| X | 10 | 10 |
| Y | 10 | 10 |
| Z | 3 | 3 |
| d | 3 | 3 |
| da | 5 | 5 |
| t | 500 | 500 |

Implementation: an AB **Fine/Coarse soil toggle** in the pathway that loads the matching column.
Apply only after Emma confirms against her copy of Appendix A.

---

## AB allowable ranges — Appendix C Table C-1 (wired into input flagging)
Texture-dependent illustrative ranges, now driving the AB range flags (inputs outside are flagged
but still allowed). K converted m/y → m/s.

| Parameter | id | Coarse default / range | Fine default / range |
|---|---|---|---|
| Bulk density ρb | rhob | 1.7 / **1.5–1.8** | 1.4 / **1.3–1.6** |
| Organic carbon foc | foc | 0.005 / **0.0005–0.007** | 0.005 / **0.0005–0.03** |
| Sat. hydraulic cond. K | K | 320 m/y / **32–3200 m/y** (1.01e-6–1.01e-4 m/s) | 32 m/y / **0.032–32 m/y** (1.01e-9–1.01e-6 m/s) |
| Hydraulic gradient i | igr | 0.028 / **0.001–0.1** | (same) |
| Thickness of contam. Z | Z | 3 / **0.5–5** | (same) |
| Depth to groundwater d | dwt | 3 / **0–10** | (same) |
| Site length ∥ flow X | Xlen | 10 / **5–30** | (same) |
| Site width ⊥ flow Y | Y | 10 / **5–30** | (same) |
| Distance to surface water | — | 10 / 0–300 | (not yet a tool input) |
| Distance to potable/ag water | — | 0 / 0–300 | (= the x point-of-compliance) |

**Not in C-1 (so no AB range check):** infiltration I, effective porosity n_e, aquifer thickness d_a.
Porosities (n, n_w, n_a) are **calculated** from bulk density (C.8.2), not independently adjustable.

## ⚠️ Governance to confirm with Emma — Table C-2 "Linked Parameter Groups"
AB Tier 2 requires certain parameters be **adjusted together as a group** (if one is site-specific,
all in the group must be):
- **Group 1 – Soil properties:** bulk density + moisture + total/air/water-filled porosity.
- **Group 2 – Source dimensions:** source length, width, depth to contamination, thickness, depth to GW.
- **Group 3 – Hydrogeological:** saturated hydraulic conductivity + hydraulic gradient.
- **Independent (vary individually):** foc, distance to receptor.

**DECIDED (Dan, 2026-06-24):** keep **free-edit**; a clear in-UI note (shown under AB) lists the
linked groups the user must adjust together manually. Implemented.

## "Not in C-1" parameters — confirmed handling from the guidance
Resolved against the AB Tier 2 document (citations below):

| Parameter | Guidance | Source | Tool action |
|---|---|---|---|
| **Infiltration I** | **"Cannot be adjusted at this time, with one exception"** — fixed by texture (coarse 0.06 / fine 0.012 m/y). Exception: fine recharge may apply at a coarse site if a continuous **fine layer ≥1 m** overlies the aquifer. | **Table 6 (p50)**; A-2; p105/108 | ✅ DONE — I **read-only for AB**, set by texture; fine-layer exception checkbox added. |
| **Effective porosity n_e** | **AB does NOT use n_e.** DF4 velocity is **v = V / (θ_t·R_s)** with **θ_t = TOTAL porosity**. | **DF4 eqs, p104** | ✅ DONE — AB velocity uses **total porosity n**; n_e greyed out for AB. |
| **Aquifer thickness d_a** | Not in the adjustable-parameter list → **not adjustable at Tier 2**; fixed at **5 m** (A-3). Used in DF3 mixing. | **Table 6 (p50)**; A-3 | ✅ DONE — d_a **read-only for AB**, fixed 5 m. |

**Also found (engine-level, flag for Craig/Emma):** mixing-zone thickness **Z_d is fixed at 2 m for the
drinking-water pathway** (calculated for all other pathways) — p103 (AB-vs-BC divergence; BC computes
d_m capped at aquifer thickness). The engine currently always calculates the mixing zone.

## Table A-6 chemical cross-check — tool (BC Protocol 28) vs AB Tier 2 A-6
The tool's substance DB is **BC Protocol 28**. AB Tier 2 Table A-6 uses different sources
(EC 2005, USEPA 1996a, CCME 2008, Gustafson 1997). **Koc and solubility differ materially for every
modelled contaminant** (Henry's mostly agrees). Koc drives retardation R = 1 + (ρb/n)·Koc·foc;
solubility caps the leachate — so using BC values for an AB run gives AB-incorrect results.

| Contaminant | Koc tool / **A-6** | H' tool / A-6 | Solubility (mg/L) tool / **A-6** | Half-life (yr) tool / A-6 |
|---|---|---|---|---|
| Benzene | 146 / **81** (+80%) | 0.227 / 0.225 ✓ | 895 / **1780** (−50%) | 1.07 / 1.0 |
| Toluene | 234 / 234 ✓ | 0.271 / 0.274 ✓ | 263 / **515** (−49%) | 0.36 / 0.288 |
| Ethylbenzene | 446 / **537** (−17%) | 0.322 / 0.358 | 84 / **152** (−44%) | 0.79 / 0.312 |
| Xylenes | 383 / **586** (−35%) | 0.271 / 0.252 | 53 / **198** (−73%) | 0.79 / 0.501 |
| Trichloroethylene | 60.7 / **94** (−35%) | 0.403 / 0.422 ✓ | 640 / **1100** (−42%) | none / none |
| Tetrachloroethylene | 94.9 / **265** (−64%) | 0.724 / 0.754 ✓ | 103 / **200** (−48%) | none / none |

**Conclusion:** for AB runs the tool should use **AB Table A-6 chemical values**, not BC Protocol 28.
**Proposed:** add an AB A-6 chemical set; when the AB framework is selected, source Koc / H' /
solubility / half-life from A-6 (changes R and the solubility cap). Pending Emma's sign-off on which
A-6 entries to adopt ("not all AB matched CCME choices" — Emma). Chlorinated solvents carry **no
half-life** in A-6 (non-degrading, conservative) — matches BC P28 treatment.

## Metals — handling & open resolution (see AB_METALS_SCREENING.md)
AB Tier 2 does **not** derive soil→GW guidelines for inorganics. Tool (implemented): under AB, metals
**block the soil→GW pathway** and the user enters the **observed groundwater C₀**; the **AB GW
compliance standard still applies** (now explicit in the in-app message). **OPEN for Emma:** confirm the
metals workflow, curate/verify the AB GW guideline values (training-export, vary by land/water use &
texture), and source the few missing values. Full screening table: **`AB_METALS_SCREENING.md`**.
