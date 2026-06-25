# Alberta Tier 2 model — status summary

Branch **`alberta-model`** · local preview **http://localhost:8001** · updated 2026-06-24.
Detailed validation + citations: **`AB_DEFAULTS_VALIDATION.md`**. Source document: *Alberta Tier 2
Soil & Groundwater Remediation Guidelines, 2024-06* (Appendix A, Appendix C, Table 6).

> Guardrail honoured throughout: BC's validated Domenico/BIOSCREEN path is **byte-identical**
> (`engine.test.js` still 1e-9). AB-specific saturated-transport (DF4) corrections were made **with
> Craig's authorization** (2026-06-24) and are flag-gated so BC is untouched. Discrepancies were
> **flagged and sourced**, then reconciled against the published AB Tier 1 guidelines.

> **★ Reconciliation complete (2026-06-24):** the DF1–DF4 chain now reproduces the published AB Tier 1
> soil guidelines across **all groundwater-protection pathways — DUA 14/14, Aquatic 12/12, Livestock 10/10,
> Wildlife 5/5** — to within ±1–5% (mostly ±1%), the residual being 100% published 2-s.f. rounding (audited
> in `ab_residual_analysis.js`). See **`AB_TIER1_RECONCILIATION.md`** and **`AB_DF4_NOTES.md`**.

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
| **DF3 mixing zone (AB)** | `dilutionFactor` now uses AB constants `Zd = 0.01·X + da·(1−e^(−2.178·X·I/(V·da)))` (was BC's 0.1·X / coef 1, ~3.7× too large). Opt-in; BC unchanged. | p133 |
| **DF4 lateral transport (AB)** | `fSaturated` AB mode: velocity uses θt; decay `Ls = 0.6931·e^(−0.07·d)/t½` (added the missing depth factor); TCE t½ = 2.19 yr. Craig-authorized; BC byte-identical. | p134–135, C-6 |
| **Hydraulic conductivity K** | AB K = **320/32 m/yr** (Table C-2), not 1e-5/1e-6 m/s (=315.6/31.6, ~1.4% low). | Table C-2 |
| **Tier 1 reconciliation** | Full DF1–DF4 chain reproduces published AB Tier 1 soil guidelines: **DUA 14/14, Aquatic 12/12, Livestock 10/10, Wildlife 5/5** (±1–5%, rounding-limited). `ab_tier1_reconcile.js`. | Tables A-2/B-2/C-11 |
| **Validation record** | `AB_DEFAULTS_VALIDATION.md` (defaults) + `AB_TIER1_RECONCILIATION.md` (reconciliation) + `AB_DF4_NOTES.md` (DF4) + `ab_residual_analysis.js` (residual audit). | — |

## 🔎 Remaining — for Emma (science sign-off)
> **★ Emma: start at [`AB_EMMA_REVIEW.md`](AB_EMMA_REVIEW.md)** — the single consolidated sign-off checklist
> (chemistry/defaults, reconciliation acceptance, Tier-2/engine items, metals, production standards).

1. **Confirm the transcribed values** — A-2/A-3 defaults, C-1 ranges, and A-6 chemistry against her copy of the guidance (I transcribed + verified line-by-line, but a second set of eyes on regulatory numbers).
2. ✅ **PHC sub-fraction half-lives** — CONFIRMED (Dan): F1 C6–C10 = 1.95 yr, F2 C10–C16 = 4.79 yr, F3/F4 non-degrading.
3. ✅ **Pentachlorophenol** — DECIDED (Dan): AB uses the single Koc (2500). Implemented.
4. ✅ **3 'skipped' substances RESOLVED (Dan)** — Diisopropanolamine added as fixed **Kd = 2.2**; PFOS added as **Koc = 1,445**; Nonylphenol+ethox. mapped to A-6 **'Nonylphenol' Koc = 141,254**. All 19 tool organics now have A-6 values.
5. ✅ **Table C-2 linked groups** — DECIDED (Dan): **free-edit** with a clear in-UI note (added under AB) listing the linked groups the user must adjust together manually.

## ⚠️ Remaining — engine-level (Craig) / behaviour to confirm
6. ◐ **AB metals** — tool behaviour DONE (under AB, metals block the soil→GW pathway; message now makes explicit that the **AB GW compliance standard still applies**; C₀ freed for observed entry). **STILL NEEDS EMMA'S RESOLUTION** on the metals workflow + guideline values — see **`AB_METALS_SCREENING.md`** (screening table of all 20 metals vs AB GW guideline values).
7. ✅ **Saturated transport mode** — DONE: selecting AB sets the plume to **transient, t = 500 yr** (AB DF4); selecting BC sets steady-state (BC GPM). User can still override.
8. ✅ **Mixing-zone Z_d = 2 m for the DW pathway** — DONE: engine `dilutionFactor` now fixes Zd=2 m when the water use is Drinking Water (backward-compatible; other pathways still calculate).
9. ✅ **Point of compliance x by water use** — DONE: a Water-use selector sets the POC distance — Drinking water / **Irrigation / Livestock (= agricultural)** = x 0; Aquatic (surface water) / Wildlife = x 10 m. Plume shows a POC marker + PASS/EXCEEDS readout at that x.

## 🧭 Remaining — broader (before regulatory use)
10. ✅ DONE — **Reconciliation.** There is **no official AB Tier 2 calculator**; the published AB Tier 1
    guidelines are the authoritative target. The tool reconciles to them across all GW-protection pathways
    (DUA/Aquatic/Livestock/Wildlife) to ±1–5% (rounding-limited). `AB_TIER1_RECONCILIATION.md`. Still
    advisable: Emma's independent eyes on the worked examples + the transcribed standards.
11. **Production compliance standards** — the AB GW standards currently shown are from the **EQuIS TRAINING** export (flagged "verify"); swap for production EQuIS standards.
12. **CSM / vapour-intrusion scope banner** (roundtable #6) and **porosity auto-derivation from ρb** (#5) — still open.

## How to review
Open **http://localhost:8001**, set **Source pathway → Jurisdiction = AB Tier 2**. Try the Fine/Coarse
toggle, the read-only I/d_a, the AB-tagged contaminants in the picker, and the `[AB A-6]` chemistry tag
in the Contaminant panel. Compare against `AB_DEFAULTS_VALIDATION.md`.
