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

// --- Test cases against the AB Tier 1 "Protection of Domestic Use Aquifer" (DUA = drinking-water)
//     soil pathway. swqg = the POTABLE groundwater guideline (Table B-2 "Potable" column, mg/L,
//     texture-independent) — NOT the Table 2 "Lowest Guideline" (which is the aquatic value for
//     naphthalene/toluene-coarse). pub = published DUA soil guideline (Tables A-2 cols 8/9, mg/kg). ---
var CASES = [
  { name: "Benzene",      swqg: 0.005,  pub: { coarse: 0.078, fine: 0.046 } },
  { name: "Toluene",      swqg: 0.024,  pub: { coarse: 0.95,  fine: 0.52  } },
  { name: "Ethylbenzene", swqg: 0.0016, pub: { coarse: 0.14,  fine: 0.073 } },
  { name: "Xylenes",      swqg: 0.02,   pub: { coarse: 1.9,   fine: 0.99  } },
  { name: "Naphthalene",  swqg: 0.47,   pub: { coarse: 53,    fine: 28    } },
];

console.log("AB Tier 1 reconciliation — tool DF chain vs published 'Protection of Domestic Use Aquifer'");
console.log("(drinking-water) soil guideline. DW pathway → Zd = 2 m fixed, x = 0 (DF4 = 1).\n");
console.log("case                  tex     DF1      DF2    DF3     SWQG    tool SRG   published   %diff");
console.log("-".repeat(86));
var fails = 0, n = 0;
CASES.forEach(function (c) {
  ["fine", "coarse"].forEach(function (tex) {
    var swqg_ugL = c.swqg * 1000;                            // mg/L → µg/L (engine internal unit)
    var r = S.abSoilGuideline(sub(c.name, swqg_ugL), sp(tex), WU.DRINKING);
    var pub = c.pub[tex];
    var pct = (r.SRG_GR - pub) / pub * 100;
    var flag = Math.abs(pct) <= 15 ? "ok" : "CHECK";
    if (Math.abs(pct) > 15) fails++; n++;
    console.log(
      c.name.padEnd(15) + " " + tex.padEnd(7) +
      " " + r.DF1.toExponential(2) + " " + r.DF2.toFixed(2) + "  " + r.DF3.toFixed(2).padStart(6) +
      "  " + String(c.swqg).padStart(7) + "   " + r.SRG_GR.toPrecision(3).padStart(8) +
      "   " + String(pub).padStart(8) + "   " + (pct >= 0 ? "+" : "") + pct.toFixed(0) + "%  " + flag);
  });
});
console.log("\n" + (n - fails) + "/" + n + " cases within ±15% of the published AB Tier 1 DUA soil guideline.");
console.log("\nNotes:");
console.log("- SWQG = POTABLE GW guideline (Table B-2 'Potable' col, mg/L); published = DUA soil guideline");
console.log("  (Tables A-2, 'Protection of Domestic Use Aquifer' cols 8/9). Use Potable, NOT Table 2 'Lowest'.");
console.log("- DW (DUA) pathway: Zd = 2 m fixed (p103), x = 0 → DF4 = 1. SRG = SWQG·DF1·DF2·DF3 (DF1 carries /1000).");
console.log("- Full cell-for-cell sign-off: confirm with Emma + the official AEPA Tier 2 calculator.");
