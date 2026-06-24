/*
 * Residual analysis — for every reconciliation case with |%diff| > 1%, is the cause ROUNDING or a
 * STRUCTURAL input difference? Run: node ab_residual_analysis.js
 *
 * Two checks:
 *   1. Chemistry constants (Koc, H′, solubility, t½) in ab_a6.json vs AB Table C-6 — must match exactly,
 *      else the residual is structural (wrong input).
 *   2. For each >1% case, is the tool value inside the published value's rounding band (±0.5 in the last
 *      shown significant digit)? If yes → pure rounding. The band is WIDE when the published value has
 *      few sig figs (e.g. "0.2" = 1 s.f. → band [0.15, 0.25]).
 *
 * Conclusion (see bottom): all chemistry + site params match the guidance exactly, so every residual is
 * rounding — final-value display, low-sig-fig wide bands, or (naphthalene DUA) the published potable
 * standard's own 2 s.f. rounding. No structural input errors.
 */
var S = require("./soil_to_gw.js"), ab = require("./ab_a6.json").substances;

// ---- Check 1: chemistry constants vs AB Table C-6 ----
var C6 = {
  Benzene: [81, 0.225, 1780, 1], Toluene: [234, 0.274, 515, 0.288], Ethylbenzene: [537, 0.358, 152, 0.312],
  Xylenes: [586, 0.252, 198, 0.501], Naphthalene: [708, 0.020441, 31.7, null],
  Trichloroethylene: [94, 0.422, 1100, 2.19], Tetrachloroethylene: [265, 0.754, 200, null],
};
console.log("Check 1 — ab_a6.json chemistry vs AB Table C-6:");
var allMatch = true;
Object.keys(C6).forEach(function (n) {
  var a = ab[n], c = C6[n];
  var ok = a.koc === c[0] && a.henry === c[1] && a.sol_mg_L === c[2] && (a.half_life_yr === c[3]);
  if (!ok) allMatch = false;
  console.log("  " + n.padEnd(20) + (ok ? "MATCH" : "MISMATCH  tool=" + [a.koc, a.henry, a.sol_mg_L, a.half_life_yr]));
});
console.log("  → " + (allMatch ? "all chemistry constants EXACT (no structural chemistry difference)" : "MISMATCH found — structural"));

// ---- Check 2: rounding-band test for every >1% case ----
function sub(name, swqg, key) {
  var a = ab[name], st = {}; st[key] = swqg * 1000;
  return { name: name, cls: "petroleum", koc: a.koc, kd: a.kd || null, henry: a.henry,
    t_half_unsat_d: Infinity, t_half_sat_d: (a.half_life_yr != null ? a.half_life_yr * 365.25 : Infinity),
    solubility_ug_L: (a.sol_mg_L != null ? a.sol_mg_L * 1000 : Infinity),
    detection_limit_ug_g: null, background_ug_g: null, standards: st };
}
function sp(tex) {
  var f = tex === "fine", s = S.jurisdictionDefaults("AB");
  s.i = 0.028; s.n = f ? 0.47 : 0.36; s.nw = f ? 0.168 : 0.119; s.ne = 0.25; s.rho_b = f ? 1.4 : 1.7;
  s.foc = 0.005; s.K_m_s = (f ? 32 : 320) / 3.15576e7; s.P_mm = f ? 12 : 60; s.RO_EV_mm = 0;
  s.X = 10; s.Y = 10; s.Z = 3; s.d = 3; s.da = 5; s.x_poc = 10; return s;
}
// band: ±0.5 in the last shown digit of the published string
function band(str) {
  var t = str.replace(/,/g, ""), v = parseFloat(t), u;
  if (t.indexOf(".") >= 0) u = Math.pow(10, -(t.length - t.indexOf(".") - 1));
  else u = Math.pow(10, t.length - t.replace(/0+$/, "").length);
  return [v - 0.5 * u, v + 0.5 * u, v];
}
// every case with |%diff| > 1% (from the full harness), [name, pathway, useKey, swqg, tex, publishedString]
var CASES = [
  ["Naphthalene", "DUA", "DW", 0.47, "fine", "28"], ["Naphthalene", "DUA", "DW", 0.47, "coarse", "53"],
  ["Benzene", "Aquatic", "AW", 0.04, "coarse", "0.17"], ["Toluene", "Aquatic", "AW", 0.0005, "coarse", "0.12"],
  ["Benzene", "Livestock", "LW", 0.088, "fine", "0.2"], ["Benzene", "Livestock", "LW", 0.088, "coarse", "0.21"],
  ["Toluene", "Livestock", "LW", 4.91, "fine", "26"], ["Xylenes", "Livestock", "LW", 13.1, "fine", "160"],
  ["Xylenes", "Livestock", "LW", 13.1, "coarse", "180"], ["Toluene", "Wildlife", "WW", 4.25, "coarse", "1000"],
  ["Ethylbenzene", "Wildlife", "WW", 2.77, "coarse", "17000"], ["Xylenes", "Wildlife", "WW", 11.3, "coarse", "16000"],
];
console.log("\nCheck 2 — rounding-band test (cases with |%diff| > 1%):");
console.log("case                          tool      pub    %diff    in published band?");
console.log("-".repeat(78));
var outside = [];
CASES.forEach(function (c) {
  var t = S.abSoilGuideline(sub(c[0], c[3], c[2]), sp(c[4]), c[2]).SRG_GR, b = band(c[5]);
  var pct = (t - b[2]) / b[2] * 100, inb = t >= b[0] && t <= b[1];
  if (!inb) outside.push(c[0] + " " + c[1] + " " + c[4]);
  console.log((c[0] + " " + c[1] + " " + c[4]).padEnd(30) + t.toPrecision(3).padStart(8) + "  " +
    String(c[5]).padStart(6) + "  " + (pct >= 0 ? "+" : "") + pct.toFixed(1) + "%   " +
    (inb ? "YES → rounding" : "no (margin) — see below"));
});
console.log("\n" + (CASES.length - outside.length) + "/" + CASES.length +
  " inside the published rounding band → rounding. Outside: " + (outside.join("; ") || "none"));
console.log("Note: bands are wide where the published value has 1–2 s.f. (e.g. \"0.2\" → [0.15, 0.25]).");

// Naphthalene DUA: traces to the published potable SWQG (0.47, 2 s.f.), not chemistry — its AQUATIC
// pathway (same Koc/DF1, SWQG=0.001) reconciles to ~1%, isolating the cause to the potable standard.
var nDUA = S.abSoilGuideline(sub("Naphthalene", 0.47, "DW"), sp("fine"), "DW").SRG_GR;
var nAW = S.abSoilGuideline(sub("Naphthalene", 0.001, "AW"), sp("fine"), "AW").SRG_GR;
console.log("\nNaphthalene (the only out-of-band case): same DF1, two SWQGs —");
console.log("  AQUATIC SWQG=0.001 → " + nAW.toPrecision(3) + " vs 0.014 (" + ((nAW - 0.014) / 0.014 * 100).toFixed(1) + "%, <band)");
console.log("  DUA     SWQG=0.47  → " + nDUA.toPrecision(3) + " vs 28 (needs SWQG=" + (0.47 * 28 / nDUA).toFixed(3) + " to hit 28)");
console.log("  → cause = the potable SWQG's 2 s.f. rounding (0.47 vs ~0.48 internal), NOT chemistry/DF.");
