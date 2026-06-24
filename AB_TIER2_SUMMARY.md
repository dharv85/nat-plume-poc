# Alberta Tier 2 model — status summary

Branch **`alberta-model`** · local preview **http://localhost:8001** · updated 2026-06-24.
Detailed validation + citations: **`AB_DEFAULTS_VALIDATION.md`**. Source document: *Alberta Tier 2
Soil & Groundwater Remediation Guidelines, 2024-06* (Appendix A, Appendix C, Table 6).

> Guardrail honoured throughout: the **validated Domenico/BIOSCREEN saturated-transport math is
> unchanged**. All AB work is in input defaults, ranges, chemistry data, and UI. Discrepancies were
> **flagged and sourced**, then corrected at the config/UI layer for Emma to sign off.

## ✅ Completed

| Area | What was done | Source |
|---|---|---|
| **Framework = master driver** | Selecting BC / AB aligns ALL Steps 1–3 inputs + auto-selects the matching compliance standard. | — |
| **AB defaults** | Fine/Coarse soil scenarios with a toggle; corrected the 3 wrong values: **K** (→320/32 m·y⁻¹), **infiltration** (→0.06/0.012), **source width Y** (→10). | Table A-2, A-3 |
| **AB allowable ranges** | Texture-dependent input ranges wired into the "outside range" flagging. | Table C-1 |
| **Infiltration I** | Read-only / fixed by texture (not adjustable) + the "fine layer ≥1 m over coarse" exception checkbox. | Table 6 |
| **Effective porosity** | AB velocity uses **total porosity θt** (v = V/(θt·Rs)), not ne; ne greyed out for AB. | DF4 eqs, p104 |
| **Aquifer thickness d_a** | Read-only / fixed at 5 m (not adjustable). | Table 6, A-3 |
| **A-6 chemistry override** | When AB is selected, Koc / H′ / solubility / half-life come from **Table A-6**, not BC Protocol 28. Source-tagged [AB A-6] / [BC P28]. **34 contaminants** (19 DB-matched + 15 AB-specific). | Table A-6 |
| **AB-specific contaminants** | 15 AB-only entries appear in the picker only under AB: PHC aliphatic/aromatic fractions, vinyl chloride, 1,1-DCE, 1,2-DCA, styrene. | Table A-6 |
| **Validation record** | `AB_DEFAULTS_VALIDATION.md` with every value + citation. | — |

## 🔎 Remaining — for Emma (science sign-off)
1. **Confirm the transcribed values** — A-2/A-3 defaults, C-1 ranges, and A-6 chemistry against her copy of the guidance (I transcribed + verified line-by-line, but a second set of eyes on regulatory numbers).
2. ✅ **PHC sub-fraction half-lives** — CONFIRMED (Dan): F1 C6–C10 = 1.95 yr, F2 C10–C16 = 4.79 yr, F3/F4 non-degrading.
3. ✅ **Pentachlorophenol** — DECIDED (Dan): AB uses the single Koc (2500). Implemented.
4. ✅ **3 'skipped' substances RESOLVED (Dan)** — Diisopropanolamine added as fixed **Kd = 2.2**; PFOS added as **Koc = 1,445**; Nonylphenol+ethox. mapped to A-6 **'Nonylphenol' Koc = 141,254**. All 19 tool organics now have A-6 values.
5. ✅ **Table C-2 linked groups** — DECIDED (Dan): **free-edit** with a clear in-UI note (added under AB) listing the linked groups the user must adjust together manually.

## ⚠️ Remaining — engine-level (Craig) / behaviour to confirm
6. ◐ **AB metals** — tool behaviour DONE (under AB, metals block the soil→GW pathway; message now makes explicit that the **AB GW compliance standard still applies**; C₀ freed for observed entry). **STILL NEEDS EMMA'S RESOLUTION** on the metals workflow + guideline values — see **`AB_METALS_SCREENING.md`** (screening table of all 20 metals vs AB GW guideline values).
7. ✅ **Saturated transport mode** — DONE: selecting AB sets the plume to **transient, t = 500 yr** (AB DF4); selecting BC sets steady-state (BC GPM). User can still override.
8. **Mixing-zone Z_d = 2 m for the drinking-water pathway** (calculated for other pathways) — engine always calculates it. Engine-level note, not changed.
9. **Point of compliance x by water use** — AB varies x (potable/agricultural = 0 m; surface water = 10 m). Tool fixes x_poc = 10. To wire per water use.

## 🧭 Remaining — broader (before regulatory use)
10. **Workbook/calculator reconciliation** — as with BC GPM, AB results should be validated against Alberta's official Tier 2 calculator / worked examples cell-for-cell before any regulatory use. This tool is screening/visualisation.
11. **Production compliance standards** — the AB GW standards currently shown are from the **EQuIS TRAINING** export (flagged "verify"); swap for production EQuIS standards.

## How to review
Open **http://localhost:8001**, set **Source pathway → Jurisdiction = AB Tier 2**. Try the Fine/Coarse
toggle, the read-only I/d_a, the AB-tagged contaminants in the picker, and the `[AB A-6]` chemistry tag
in the Contaminant panel. Compare against `AB_DEFAULTS_VALIDATION.md`.
