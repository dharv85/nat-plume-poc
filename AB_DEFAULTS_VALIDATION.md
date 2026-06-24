# AB input-defaults validation — tool vs Alberta Tier 2 Appendix A

**Branch:** `alberta-model` · **Date:** 2026-06-24 · **For Emma to confirm against source tables.**
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
(Tool currently fixes x_poc = 10; AB varies x by water use — to wire per use.)

## Open items to confirm with Emma
1. **Effective porosity (ne):** tool uses 0.25. **Not listed in Table A-2** — confirm AB's ne /
   the value CCME uses for the saturated seepage velocity (v = K·i/ne).
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

The tool currently lets each input be edited independently. **Decision for Emma:** enforce the C-2
linked groups (e.g. editing K prompts/forces a paired i), or leave free-edit with a note. Not yet
implemented.
