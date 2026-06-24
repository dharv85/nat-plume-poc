# Expert Roundtable Review — Alberta Tier 2 model & process

Simulated expert review (internal SLR use — simulated personas, not real consultations), 2026-06-24.
Reviewers: **Dr. Carl Mendoza** (hydrogeology/transport physics, U. Alberta), **Gordon Dinwoodie**
(AB Tier 1/2 regulatory method, AEP), **Dr. Ian Hers** (contaminated sites / vapour / CSM / CSAP),
**Kevin Long** (AB practitioner / regulatory acceptance). Files reviewed: AB_DEFAULTS_VALIDATION.md,
AB_TIER2_SUMMARY.md, AB_METALS_SCREENING.md, ab_a6.json, soil_to_gw.js, the AB logic in index.html,
nat_engine.js.

## 1. Opening
A competent, honestly-documented **screening & visualisation tool** whose config layer is carefully
reconciled to the 2024 guidance, with open items transparently flagged. **Not yet a compliance
instrument** — and several open items are load-bearing for regulatory defensibility, not cosmetic.
The panel's strongest collective concern is the gap between how clean the outputs look and how many
unconfirmed assumptions sit behind them.

## 2. Reviewer assessments

### Dr. Carl Mendoza — transport physics
Froze the validated Domenico core — good. Concerns: (1) **Velocity uses total porosity θt** (AB
convention) — conservative for guideline derivation but **non-conservative for plume travel time**
(real seepage velocity uses smaller effective porosity → true transport faster than shown); the user
must know which number they're reading. (2) **Dispersivity scales with x** (αx=0.1x, αy=0.01x) — an
artifact if the compliance point is moved, not site data. (3) **Transient t=500 yr assumes a constant,
non-depleting source** (`domenico()` applies no source decay on the AB path) — emitting fixed C₀ for
500 years with no mass balance is unphysical as a forecast and overstates the far-field plume; it is a
*guideline-derivation construct*, never "the plume in year 500." Retardation R=1+(ρb/n)·Koc·foc is
correct; high-Koc PHC aliphatics → effectively immobile (right).

### Gordon Dinwoodie — AB regulatory method
Appendix A/C transcription is the strongest part (K 320/32, infiltration 0.06/0.012, Y=10; I & d_a
read-only per Table 6; Fine/Coarse toggle correct). Four method-fidelity gaps: (1) **Table C-2 linked
groups not enforced** — a free-edit field + note will be bypassed; **C.8.2 derives porosities FROM bulk
density**, but the tool lets ρb and n be set independently → physically inconsistent inputs =
non-compliant. (2) **Z_d=2 m mixing zone for the DW pathway not applied** — engine always calculates
`dm`; AB fixes 2 m for DW (p103); the "freeze" guardrail is shielding a value AB overrides → wrong DF3
for DW. (3) **Point of compliance x hard-wired to 10 m** — AB sets x=0 for potable/agricultural, 10 m
for surface water (A-3); a potable screen gets unearned 10 m of attenuation = non-conservative. (4)
**DF4 applied only for AQUATIC/WILDLIFE** in `abSoilGuideline` — confirm vs AB's pathway-by-pathway DF4
applicability. Metals exclusion handled correctly; F1/F2 sub-fraction half-lives reasonable but the
mapping needs a cited basis.

### Dr. Ian Hers — practical defensibility / CSM
Docs' honesty is an asset, but a polished map plume gets over-interpreted. **Biggest concern: CSM scope.**
The tool models soil→GW→lateral transport only; it does **not** address **vapour intrusion**, yet the
AB-only picker includes vapour-dominated drivers — vinyl chloride (H′=1.11), 1,1-DCE (H′=1.07), volatile
PHC aliphatics (H′ up to 4,900). A user screening VC against a *groundwater* standard and seeing "pass"
may miss an unaddressed soil-vapour pathway. Henry's is used only in `fPartition`; there is no vapour
screen. Needs a prominent scope statement. Also: the metals "observed C₀" workflow rests on a monitoring
dataset the tool can't see; and the 500-yr continuous-source plume is the single most misuse-prone output.

### Kevin Long — AB practitioner / acceptance
AEPA reviewers accept Tier 2 numbers reproducible against the **official Alberta Tier 2 calculator**
cell-for-cell; that reconciliation hasn't been done (own item 10) → every number is advisory until then.
Two acceptance blockers: (1) **compliance standards are an EQuIS TRAINING export** with missing metal
values (Be, Co, CN, Mo, Na, V) and shown as one representative Agricultural/Coarse set though they vary
by land/water use & texture — screening against a wrong/absent standard is a finding waiting to happen.
(2) A tool that lets you set physically inconsistent inputs, or silently credits 10 m attenuation for a
potable receptor, will draw scrutiny that taints the submission. Excellent internal transparency — fine
as a clearly-labelled visualisation/discussion aid right now, nothing more.

## 3. Consensus findings (prioritized)

**CRITICAL**
1. ✅ DONE — **Point of compliance x by water use** — fix x=0 for potable/agricultural (10 m surface
   water) per A-3; current fixed 10 m is non-conservative. (engine returns DF=1 at x≤0 already)
2. ✅ DONE — **DW mixing-zone Z_d=2 m** — add a DW branch fixing mixing thickness to 2 m (p103);
   treat the engine constant as config, not frozen.
3. ◐ NOTED in UI — **Transient t=500 yr assumes infinite (non-depleting) source** — relabel as a *regulatory derivation
   scenario, not a travel-time prediction*; document infinite-source-mass assumption; consider a
   source-depletion option for site work.
4. **Compliance standards = TRAINING export, missing metal values** — swap for production EQuIS;
   use/texture-specific selection; **fail-closed** when no standard loads (don't silently pass).

**HIGH**
5. **Table C-2 linked groups not enforced + porosities independently editable** — auto-derive n/nw/na
   from ρb (C.8.2); lock/co-update the linked groups.
6. **No vapour-intrusion / CSM scope statement** — prominent banner: groundwater pathway only; volatiles
   (VC, 1,1-DCE, light PHC) require separate vapour-intrusion screening.
7. **No reconciliation vs the official Alberta Tier 2 calculator** — validate ≥2 worked examples (PHC +
   chlorinated) cell-for-cell before site use.

**MEDIUM**
8. Velocity uses θt (conservative for guidelines, non-conservative for travel time) — annotate the
   displayed velocity.
9. DF4 applied only for AQUATIC/WILDLIFE — verify vs AB DF4 applicability; document.
10. F1/F2 → sub-fraction half-life mapping needs a cited basis — document; Emma confirm.
11. Metals "observed C₀" rests on unseen data — require/recommend a minimum dataset; caveat output.

**LOW**
12. Dispersivity scales with x — note in UI.
13. ne=0.25 origin unconfirmed (greyed for AB; still used by BC + engine `fSaturated`) — confirm source.
14. A-6 transcription needs Emma's independent sign-off — second-reviewer check.

## 4. Top priorities before use on a real Alberta site
1. Fix **x-by-water-use** (x=0 potable/ag) and **DW Z_d=2 m** — the two outright non-conservative errors.
2. Replace TRAINING standards with **production, use/texture-specific** AB values; fill missing metals; fail-closed.
3. **Reconcile DF1–DF4 vs the official Alberta Tier 2 calculator** on worked examples.
4. Add a **CSM scope banner** (GW pathway only; volatiles → vapour intrusion) and **relabel the 500-yr plume** with the infinite-source caveat.
5. **Auto-derive porosities from ρb** and enforce/co-update the **C-2 linked groups**.

## 5. Verdict
Defensible today only as a clearly-labelled **screening & visualisation aid**; not suitable for a
regulatory Tier 2 submission until findings 1–5 are closed.
