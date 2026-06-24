/*
 * Soil-to-groundwater regulatory module — JS port of engine/soil_to_groundwater.py.
 * BC Groundwater Protection Model (TG13 / Protocol 28) + Alberta Tier 2 dilution
 * factors (DF1-DF4) on one shared four-process core. Self-contained.
 * Constants match Craig's rounded values exactly (LN2 = 0.6931; 365.0 day-year).
 *
 * NOTE: per Craig's module header, this is the STRUCTURAL reference; BC regulatory
 * submissions must still be reconciled to the prescribed BC GPM workbook. This port
 * is validated to reproduce his Python (golden_mod.json), not the workbook itself.
 */
(function (root) {
  "use strict";
  var S_PER_YR = 3.15576e7, LN2 = 0.6931, SQRTPI = Math.sqrt(Math.PI);
  var INF = Infinity;

  // erf / erfc (single-value; same scheme as nat_engine)
  function erfcCF(x) { var tiny = 1e-300, f = tiny, C = f, D = 0, k, a, b = x;
    for (k = 1; k <= 300; k++) { a = (k === 1) ? 1 : (k - 1) / 2;
      D = b + a * D; if (D === 0) D = tiny; D = 1 / D; C = b + a / C; if (C === 0) C = tiny;
      var d = C * D; f *= d; if (Math.abs(d - 1) < 1e-16) break; } return Math.exp(-x * x) / SQRTPI * f; }
  function erf(x) { if (x === 0) return 0; var neg = x < 0; x = Math.abs(x); var r;
    if (x < 3) { var sum = x, term = x, n = 0; do { n++; term *= -x * x / n; sum += term / (2 * n + 1); }
      while (Math.abs(term / (2 * n + 1)) > 1e-18 && n < 300); r = 2 / SQRTPI * sum; } else r = 1 - erfcCF(x);
    return neg ? -r : r; }
  function erfc(x) { return 1 - erf(x); }

  var ContaminantClass = { PETROLEUM: "petroleum", CHLORINATED: "chlorinated", METAL: "metal" };
  var WaterUse = { DRINKING: "DW", AQUATIC: "AW", IRRIGATION: "IW", LIVESTOCK: "LW", WILDLIFE: "WW" };
  var Jurisdiction = { BC: "BC", AB: "AB" };

  // null in a substance means "infinite" (no biodeg / no solubility cap)
  function inf(v) { return (v === null || v === undefined) ? INF : v; }

  // SiteParams defaults = BC GPM Appendix-3 generic
  function bcDefaults() {
    return { X: 10.0, Y: 30.0, Z: 3.0, P_mm: 1000.0, RO_EV_mm: 450.0, Dfr: 0.0,
      n: 0.36, nw: 0.119, ne: 0.25, rho_b: 1.7, foc: 0.005, K_m_s: 3e-5, i: 0.008,
      d: 3.0, da: 5.0, x_poc: 10.0 };
  }
  function jurisdictionDefaults(j) {
    if (j === Jurisdiction.AB) { var sp = bcDefaults(); sp.K_m_s = 3e-7; sp.i = 0.028; sp.x_poc = 10.0; return sp; }
    return bcDefaults();
  }
  function I_m_yr(sp) { return (sp.P_mm - sp.RO_EV_mm) / 1000.0; }
  function na(sp) { return sp.n - sp.nw; }
  function V_m_yr(sp) { return sp.K_m_s * S_PER_YR * sp.i; }
  function bOf(sp) { return sp.d - sp.Z; }

  function kdEff(sub, sp) { return sub.cls === ContaminantClass.METAL ? sub.kd : (sub.koc || 0) * sp.foc; }
  function retardation(sub, sp, porosity) { return 1 + (sp.rho_b / porosity) * kdEff(sub, sp); }
  function lambdaPerYr(tHalfDays) { tHalfDays = inf(tHalfDays); return tHalfDays === INF ? 0 : (LN2 / tHalfDays) * 365.0; }

  function fPartition(sub, sp) { var kd = kdEff(sub, sp); return (kd + (sp.nw + (sub.henry || 0) * na(sp)) / sp.rho_b) / 1000.0; }
  function fUnsaturated(sub, sp) {
    var b = bOf(sp); if (b <= 0) return 1.0;
    var alphaU = 0.1 * b, lam = lambdaPerYr(sub.t_half_unsat_d);
    if (sub.cls !== ContaminantClass.METAL && sp.Dfr) lam *= (1 - sp.Dfr / 365.0);
    var Ru = 1 + (sp.rho_b / sp.nw) * kdEff(sub, sp), vu = I_m_yr(sp) / sp.nw;
    return Math.exp((b / (2 * alphaU)) * (1 - Math.sqrt(1 + 4 * lam * alphaU * Ru / vu)));
  }
  // DF3 = 1 + Zd·V/(I·X). The mixing-zone thickness Zd is computed differently by jurisdiction, so the
  // two flags select which rule applies:
  //   fixedZd = 2  → drinking-water pathway: Zd is FIXED at 2 m (both BC & AB; AB Tier 1 p103).
  //   abMix = true → AB Tier 1 calculated zone:  Zd = 0.01·X + da·(1 − exp(−2.178·X·I/(V·da)))   (p133)
  //   neither      → BC GPM calculated zone:     Zd = 0.10·X + da·(1 − exp(−1·X·I/(V·da)))   [DEFAULT]
  // The default (BC) branch is unchanged from Craig's validated module, so BC results stay bit-for-bit.
  // AB callers pass abMix=true; the AB constants were reconciled to the published AB Tier 1 aquatic
  // soil guidelines (ab_tier1_reconcile.js). When fixedZd=2 is set, abMix is irrelevant (Zd is fixed).
  function dilutionFactor(sp, fixedZd, abMix) {
    if (bOf(sp) < 0) return 1.0;
    var V = V_m_yr(sp), I = I_m_yr(sp), X = sp.X, da = sp.da, dm;
    if (fixedZd != null && fixedZd > 0) { dm = Math.min(fixedZd, da); }   // DW pathway: Zd = 2 m fixed
    else if (abMix) { var sa = da * (1 - Math.exp(-(2.178 * X * I) / (V * da))); dm = Math.min(0.01 * X + sa, da); }
    else { var s = da * (1 - Math.exp(-(X * I) / (V * da))); dm = Math.min(0.1 * X + s, da); }
    return 1 + (dm * V) / (X * I);
  }
  // abMode applies the two AB Tier 1 (p134–135) saturated-transport conventions that differ from BC:
  //   1. velocity uses TOTAL porosity θt (= sp.n), v = V/(θt·Rs); ne is BC-only (Table C-2 lists no ne).
  //   2. the decay constant carries a water-table-depth factor: Ls = 0.6931·e^(−0.07·d)/t½  (d = sp.d).
  //      BC uses the plain λ = 0.6931/t½ (no depth factor). This factor was the cause of the ~2× DF4
  //      over-prediction; with it, the AB Tier 1 aquatic guidelines reconcile to within ~8%.
  // BC path (no abMode) is byte-identical to Craig's validated module.
  function fSaturated(sub, sp, steady, tYr, abMode) {
    if (steady === undefined) steady = true; if (tYr === undefined) tYr = 500.0;
    var x = sp.x_poc; if (x <= 0) return 1.0;
    var alphaX = 0.1 * x, alphaY = 0.01 * x, Rf = retardation(sub, sp, sp.n);
    var v = V_m_yr(sp) / (abMode ? sp.n : sp.ne), vp = v / Rf, lam = lambdaPerYr(sub.t_half_sat_d);
    if (abMode) lam *= Math.exp(-0.07 * sp.d);   // AB Ls = 0.6931·e^(−0.07·d)/t½ (p134–135); d = water-table depth
    var root = Math.sqrt(1 + 4 * lam * alphaX / vp);
    var longitudinal = Math.exp((x / (2 * alphaX)) * (1 - root));
    if (!steady) longitudinal *= 0.5 * erfc((x - vp * tYr * root) / (2 * Math.sqrt(alphaX * vp * tYr)));
    return longitudinal * erf(sp.Y / (4 * Math.sqrt(alphaY * x)));
  }

  function bcForwardSlra(sub, sp, Cs_ug_g, use) {
    var CL = Cs_ug_g / fPartition(sub, sp); CL = Math.min(CL, inf(sub.solubility_ug_L));
    var Cz = CL * fUnsaturated(sub, sp), Cgw = Cz / dilutionFactor(sp), Cx = Cgw * fSaturated(sub, sp, true);
    var std = sub.standards[use];
    return { CL: CL, Cz: Cz, Cgw: Cgw, Cx: Cx, standard: (std === undefined ? null : std),
      pass: (std !== undefined && Cx <= std) };
  }
  function bcBackwardSss(sub, sp, use) {
    var Cx = sub.standards[use];
    var Cgw = Cx / fSaturated(sub, sp, true), Cz = Cgw * dilutionFactor(sp);
    var CL = Cz / fUnsaturated(sub, sp); CL = Math.min(CL, inf(sub.solubility_ug_L));
    var Cs = CL * fPartition(sub, sp);
    if (sub.cls === ContaminantClass.METAL) Cs = Math.min(Cs, 1e6);
    var floor = Math.max(sub.detection_limit_ug_g || 0, sub.background_ug_g || 0);
    return { SSS_ug_g: Math.max(Cs, floor), SSS_unfloored: Cs, floor: floor, CL: CL, Cz: Cz, Cgw: Cgw, Cx: Cx };
  }
  function abSoilGuideline(sub, sp, use) {
    if (sub.cls === ContaminantClass.METAL)
      return { applicable: false, reason: "AB Tier 2 does not model soil->GW for inorganics; use site-specific groundwater sampling." };
    var swqg = sub.standards[use];
    // AB drinking-water (Domestic Use Aquifer) pathway fixes the mixing-zone thickness Zd = 2 m
    // (Alberta Tier 1/2, p103); all other pathways use the calculated mixing zone. Matches the UI
    // (computePathway) and roundtable finding #2. dilutionFactor's fixedZd arg is backward-compatible.
    // AB uses its own calculated mixing-zone constants (abMix=true) for every pathway except DW,
    // where Zd = 2 m is fixed (zd bypasses the calc). This is the AB regulatory layer, distinct from
    // the BC GPM mixing zone in the shared dilutionFactor primitive.
    var zd = (use === WaterUse.DRINKING) ? 2 : null;
    var DF1 = fPartition(sub, sp), DF2 = 1 / fUnsaturated(sub, sp), DF3 = dilutionFactor(sp, zd, true);
    var DF4 = (use === WaterUse.AQUATIC || use === WaterUse.WILDLIFE) ? 1 / fSaturated(sub, sp, false, 500.0, true) : 1.0;
    var DF = DF1 * DF2 * DF3 * DF4;
    return { applicable: true, SRG_GR: swqg * DF, DF1: DF1, DF2: DF2, DF3: DF3, DF4: DF4, DF: DF };
  }

  var api = { ContaminantClass: ContaminantClass, WaterUse: WaterUse, Jurisdiction: Jurisdiction,
    jurisdictionDefaults: jurisdictionDefaults, fPartition: fPartition, fUnsaturated: fUnsaturated,
    dilutionFactor: dilutionFactor, fSaturated: fSaturated, retardation: retardation,
    bcForwardSlra: bcForwardSlra, bcBackwardSss: bcBackwardSss, abSoilGuideline: abSoilGuideline };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.NATSoilToGW = api;
})(typeof self !== "undefined" ? self : this);
