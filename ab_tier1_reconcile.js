/*
 * AB Tier 1 reconciliation harness — validates the tool's DF1–DF4 chain against the PUBLISHED
 * Alberta Tier 1 guideline values. Run: node ab_tier1_reconcile.js
 *
 * Method: the published Tier 1 SOIL guideline for the groundwater-protection pathway equals
 *   SRG = SWQG(GW guideline) × DF1 × DF2 × DF3 × DF4  evaluated at the Tier 1 default inputs.
 * So the tool's abSoilGuideline() (in soil_to_gw.js) should reproduce the published soil guideline.
 * SWQG must be supplied in µg/L (the engine's internal unit; f_partition carries the /1000).
 *
 * The TOOL side is computed exactly. The PUBLISHED side is from the AB Tier 1 (2024) tables —
 * the groundwater-protection soil-guideline COLUMN ATTRIBUTION must be confirmed by Emma (the soil
 * tables have many pathway columns). Values flagged `verify:true` need that confirmation.
 */
var S = require("./soil_to_gw.js");
var AB = require("./ab_a6.json").substances;
var WU = S.WaterUse;

// --- AB Tier 1 default site params by texture (Appendix A-2/A-3) ---
function sp(tex) {
  var s = S.jurisdictionDefaults("AB");
  var fine = tex === "fine";
  s.n = fine ? 0.47 : 0.36; s.nw = fine ? 0.168 : 0.119; s.ne = 0.25;
  s.rho_b = fine ? 1.4 : 1.7; s.foc = 0.005; s.i = 0.028;
  s.K_m_s = fine ? 1.0e-6 : 1.0e-5; s.P_mm = fine ? 12 : 60; s.RO_EV_mm = 0;  // I = 0.012 / 0.06 m/y
  s.X = 10; s.Y = 10; s.Z = 3; s.d = 3; s.da = 5; s.Dfr = 0;
  return s;
}
function sub(name, swqg_ugL) {
  var a = AB[name];
  return { name: name, cls: (a.cls || "petroleum"),
    koc: (a.koc != null ? a.koc : null), kd: (a.kd != null ? a.kd : null), henry: a.henry,
    t_half_unsat_d: (a.half_life_yr != null ? a.half_life_yr * 365.25 : Infinity),
    t_half_sat_d: (a.half_life_yr != null ? a.half_life_yr * 365.25 : Infinity),
    solubility_ug_L: (a.sol_mg_L != null ? a.sol_mg_L * 1000 : Infinity),
    detection_limit_ug_g: null, background_ug_g: null, standards: { DW: swqg_ugL, AW: swqg_ugL } };
}

// --- Test cases: SWQG (Tier 1 GW guideline, µg/L) + published GW-protection soil guideline (mg/kg) ---
// published_soil values are from the AB Tier 1 (2024) soil tables — VERIFY the exact pathway column.
var CASES = [
  { name: "Benzene",             swqg: 5,    use: "DW", pub: { coarse: 0.046, fine: 0.078 }, verify: true },
  { name: "Trichloroethylene",   swqg: 5,    use: "DW", pub: { coarse: null,  fine: null  }, verify: true },
  { name: "Ethylbenzene",        swqg: 1.6,  use: "DW", pub: { coarse: null,  fine: null  }, verify: true },
  { name: "Naphthalene",         swqg: 0.7,  use: "DW", pub: { coarse: null,  fine: null  }, verify: true },
];

console.log("AB Tier 1 reconciliation — tool DF chain vs published soil guideline (GW-protection, potable)\n");
console.log("case                     tex     DF1      DF2    DF3     DF4   tool SRG(mg/kg)  published   %diff");
console.log("-".repeat(96));
CASES.forEach(function (c) {
  ["coarse", "fine"].forEach(function (tex) {
    var r = S.abSoilGuideline(sub(c.name, c.swqg), sp(tex), WU.DRINKING);
    var pub = c.pub[tex];
    var diff = (pub != null) ? ((r.SRG_GR - pub) / pub * 100).toFixed(0) + "%" : "—";
    console.log(
      c.name.padEnd(24) + " " + tex.padEnd(7) +
      " " + r.DF1.toExponential(2) + " " + r.DF2.toFixed(2) + "  " + r.DF3.toFixed(2).padStart(6) +
      "  " + String(r.DF4).padStart(4) + "   " + r.SRG_GR.toFixed(4).padStart(10) +
      "    " + (pub != null ? String(pub) : "VERIFY").padStart(8) + "   " + diff.padStart(6));
  });
});
console.log("\nNotes:");
console.log("- DW (potable) pathway → DF4 = 1 (x = 0). SWQG in µg/L. SRG = SWQG·DF1·DF2·DF3·DF4 / 1000 → mg/kg.");
console.log("- 'published' = AB Tier 1 (2024) GW-protection soil guideline — Emma must confirm the exact");
console.log("  pathway column; values marked VERIFY are not yet populated.");
console.log("- For a full cell-for-cell sign-off, run the same cases through the official AEPA Tier 2 calculator.");
