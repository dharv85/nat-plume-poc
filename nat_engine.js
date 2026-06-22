/*
 * NAT engine — JavaScript port of Craig's Python engine (client-side, for the
 * Enterprise custom widget). Faithful translation of engine/{transport,outputs,
 * substances,sequential_decay}.py. Validated against his Python (the oracle):
 * see nat_engine.test.js (Domenico, substances, chain) + exact.test.js (exact solver).
 * Unit-agnostic SI: metres, years, mg/L.  No backend, no SciPy.
 */
(function (root) {
  "use strict";
  var SQRTPI = Math.sqrt(Math.PI), LN2 = Math.log(2), DAYS_PER_YEAR = 365.25;

  // ---------- erf (Taylor |x|<3, continued-fraction erfc |x|>=3) ----------
  function erfcCF(x) {
    var tiny = 1e-300, f = tiny, C = f, D = 0, k, a, b = x;
    for (k = 1; k <= 300; k++) {
      a = (k === 1) ? 1 : (k - 1) / 2;
      D = b + a * D; if (D === 0) D = tiny; D = 1 / D;
      C = b + a / C; if (C === 0) C = tiny;
      var delta = C * D; f *= delta;
      if (Math.abs(delta - 1) < 1e-16) break;
    }
    return Math.exp(-x * x) / SQRTPI * f;
  }
  function erf(x) {
    if (x === 0) return 0;
    var neg = x < 0; x = Math.abs(x); var r;
    if (x < 3.0) {
      var sum = x, term = x, n = 0;
      do { n++; term *= -x * x / n; sum += term / (2 * n + 1); }
      while (Math.abs(term / (2 * n + 1)) > 1e-18 && n < 300);
      r = 2 / SQRTPI * sum;
    } else { r = 1 - erfcCF(x); }
    return neg ? -r : r;
  }
  function erfc(x) { return 1 - erf(x); }

  // ---------- adaptive Simpson ----------
  function simpson(fa, fm, fb, a, b) { return (b - a) / 6 * (fa + 4 * fm + fb); }
  function asr(f, a, b, fa, fm, fb, whole, tol, depth) {
    var m = (a + b) / 2, lm = (a + m) / 2, rm = (m + b) / 2, flm = f(lm), frm = f(rm);
    var left = simpson(fa, flm, fm, a, m), right = simpson(fm, frm, fb, m, b);
    if (depth <= 0 || Math.abs(left + right - whole) <= 15 * tol)
      return left + right + (left + right - whole) / 15;
    return asr(f, a, m, fa, flm, fm, left, tol / 2, depth - 1) +
           asr(f, m, b, fm, frm, fb, right, tol / 2, depth - 1);
  }
  function adaptiveSimpson(f, a, b, tol) {
    var fa = f(a), fb = f(b), m = (a + b) / 2, fm = f(m);
    return asr(f, a, b, fa, fm, fb, simpson(fa, fm, fb, a, b), tol, 50);
  }
  function integrateToInf(f, a, tol) {
    function g(s) { if (s >= 1 - 1e-12) return 0; var j = 1 / ((1 - s) * (1 - s)); return f(a + s / (1 - s)) * j; }
    return adaptiveSimpson(g, 0, 1, tol);
  }

  // ---------- shared geometry ----------
  function der(p) {
    var vc = p.v / (p.R || 1);
    return { C0: p.C0, vc: vc, Y: p.Y, Z: p.Z, ax: p.alpha_x, ay: p.alpha_y, az: p.alpha_z,
      Dx: p.alpha_x * vc, Dy: p.alpha_y * vc, Dz: p.alpha_z * vc,
      lam: p.half_life_yr ? LN2 / p.half_life_yr : 0,
      lamSrc: p.source_half_life_yr ? LN2 / p.source_half_life_yr : 0, wt: !!p.water_table_source };
  }
  function patch(coord, lo, hi, spread) {
    spread = Math.max(spread, 1e-12);
    return 0.5 * (erf((hi - coord) / (2 * spread)) - erf((lo - coord) / (2 * spread)));
  }
  function zb(m) { return m.wt ? [0, m.Z] : [-m.Z / 2, m.Z / 2]; }
  function vertical(m, z, spread) {
    var b = zb(m), term = patch(z, b[0], b[1], spread);
    if (m.wt) term += patch(-z, b[0], b[1], spread);
    return term;
  }

  // ---------- Domenico (BIOSCREEN) ----------
  function domenico(m, x, y, z, t, steady) {
    var gamma = Math.sqrt(1 + 4 * m.lam * m.ax / m.vc);
    var longitudinal = Math.exp((x / (2 * m.ax)) * (1 - gamma));
    var longFactor = steady ? 2 * longitudinal
      : longitudinal * erfc((x - m.vc * t * gamma) / (2 * Math.sqrt(m.ax * m.vc * t)));
    var sxy = Math.sqrt(m.ay * Math.max(x, 1e-12)), sxz = Math.sqrt(m.az * Math.max(x, 1e-12));
    var fy = patch(y, -m.Y / 2, m.Y / 2, sxy) * 2, fz = vertical(m, z, sxz) * 2;
    var src = (!steady && m.lamSrc) ? Math.exp(-m.lamSrc * t) : 1;
    return (m.C0 / 8) * longFactor * fy * fz * src;
  }

  // ---------- BIOSCREEN-AT exact (Wexler/ATRANS travel-time integral) ----------
  function exact(m, x, y, z, t, steady) {
    if (x <= 0) return m.C0 * patch(y, -m.Y / 2, m.Y / 2, 1e-9) * vertical(m, z, 1e-9);
    var tt = steady ? 0 : t;
    function f(tau) {
      if (tau <= 0) return 0;
      var k = (x / (2 * Math.sqrt(Math.PI * m.Dx))) * Math.pow(tau, -1.5) *
        Math.exp(-((x - m.vc * tau) * (x - m.vc * tau)) / (4 * m.Dx * tau)) * Math.exp(-m.lam * tau);
      if (m.lamSrc) k *= Math.exp(-m.lamSrc * Math.max(tt - tau, 0));
      return k * patch(y, -m.Y / 2, m.Y / 2, Math.sqrt(m.Dy * tau)) * vertical(m, z, Math.sqrt(m.Dz * tau));
    }
    var tauPeak = x / m.vc, val, tol = 1e-11;
    if (steady) val = adaptiveSimpson(f, 0, tauPeak, tol) + integrateToInf(f, tauPeak, tol);
    else if (tauPeak > 0 && tauPeak < t) val = adaptiveSimpson(f, 0, tauPeak, tol) + adaptiveSimpson(f, tauPeak, t, tol);
    else val = adaptiveSimpson(f, 0, t, tol);
    return m.C0 * val;
  }

  // ---------- public concentration ----------
  function concentration(p, x, y, z, t, engine) {
    if (y === undefined) y = 0; if (z === undefined) z = 0;
    if (t === undefined) t = null; engine = engine || "bioscreen_at";
    var m = der(p), steady = (t === null);
    if (steady && m.lamSrc) throw new Error("A depleting source has no steady state — pass t (transient).");
    var res = (engine === "bioscreen") ? domenico(m, x, y, z, steady ? 0 : t, steady)
                                       : exact(m, x, y, z, steady ? 0 : t, steady);
    return Math.min(Math.max(res, 0), m.C0);
  }

  // ---------- outputs ----------
  function centerline(p, xs, t, engine) { return xs.map(function (x) { return concentration(p, x, 0, 0, t, engine); }); }
  function breakthrough(p, x, ts, y, z, engine) { return ts.map(function (t) { return concentration(p, x, y || 0, z || 0, t, engine); }); }
  // Plan-view concentration grid for the MAP heatmap. Defaults to the closed-form
  // Domenico solver ("bioscreen") — NOT the exact integral — because the map draws
  // tens of thousands of points and a per-point adaptive quadrature would freeze the
  // browser; the Domenico approximation is visually indistinguishable at contour
  // resolution. Use the exact solver for the centerline/breakthrough (1-D, cheap),
  // where its accuracy matters. Pass engine="bioscreen_at" to force exact (slow).
  function planView(p, xs, ys, z, t, engine) {
    z = z || 0; if (t === undefined) t = null; engine = engine || "bioscreen";
    if (engine !== "bioscreen") {  // explicit exact request: per-point (caller owns the cost)
      return ys.map(function (yj) { return xs.map(function (xi) { return concentration(p, xi, yj, z, t, engine); }); });
    }
    // Fast Domenico grid: precompute the x-only terms once per column (gamma is x-independent;
    // longitudinal factor / transverse spreads depend only on x), then sweep y. Numerically
    // identical to domenico() per point — just without the n_y-fold redundant recomputation.
    var m = der(p), steady = (t === null);
    if (steady && m.lamSrc) throw new Error("A depleting source has no steady state — pass t (transient).");
    var gamma = Math.sqrt(1 + 4 * m.lam * m.ax / m.vc);
    var src = (!steady && m.lamSrc) ? Math.exp(-m.lamSrc * t) : 1;
    var nx = xs.length, longF = new Array(nx), sxy = new Array(nx), sxz = new Array(nx);
    for (var i = 0; i < nx; i++) {
      var x = xs[i], longitudinal = Math.exp((x / (2 * m.ax)) * (1 - gamma));
      longF[i] = steady ? 2 * longitudinal
        : longitudinal * erfc((x - m.vc * t * gamma) / (2 * Math.sqrt(m.ax * m.vc * t)));
      sxy[i] = Math.sqrt(m.ay * Math.max(x, 1e-12));
      sxz[i] = Math.sqrt(m.az * Math.max(x, 1e-12));
    }
    return ys.map(function (yj) {
      var row = new Array(nx);
      for (var j = 0; j < nx; j++) {
        var fy = patch(yj, -m.Y / 2, m.Y / 2, sxy[j]) * 2, fz = vertical(m, z, sxz[j]) * 2;
        var v = (m.C0 / 8) * longF[j] * fy * fz * src;
        row[j] = Math.min(Math.max(v, 0), m.C0);
      }
      return row;
    });
  }
  function plumeLength(xs, C, criterion) {
    if (C[0] < criterion) return null;
    var i = -1; for (var k = 0; k < C.length; k++) { if (C[k] < criterion) { i = k; break; } }
    if (i <= 0) return null;
    return xs[i - 1] + (xs[i] - xs[i - 1]) * (C[i - 1] - criterion) / (C[i - 1] - C[i]);
  }

  // ---------- mass balance (independent QA check) ----------
  function linspace(a, b, n) { var o = [], i; for (i = 0; i < n; i++) o.push(n === 1 ? a : a + (b - a) * i / (n - 1)); return o; }
  function trapz(y, x) { var s = 0, i; for (i = 0; i < x.length - 1; i++) s += (x[i + 1] - x[i]) * (y[i] + y[i + 1]) / 2; return s; }
  function longitudinalSurvival(p, x) {
    var vc = p.v / (p.R || 1), lam = p.half_life_yr ? LN2 / p.half_life_yr : 0;
    var gamma = Math.sqrt(1 + 4 * lam * p.alpha_x / vc);
    return Math.exp((x / (2 * p.alpha_x)) * (1 - gamma));
  }
  function crossPlumeMass(p, x, t, engine, opts) {
    opts = opts || {}; var ny = opts.ny || 81, nz = opts.nz || 41, nSig = opts.n_sigma || 8;
    var xx = Math.max(x, 1e-9), sy = Math.sqrt(2 * p.alpha_y * xx), sz = Math.sqrt(2 * p.alpha_z * xx);
    var Ly = p.Y / 2 + nSig * sy, y = linspace(-Ly, Ly, ny);
    var z = p.water_table_source ? linspace(0, p.Z + nSig * sz, nz)
                                 : linspace(-(p.Z / 2 + nSig * sz), p.Z / 2 + nSig * sz, nz);
    var rowInt = z.map(function (zk) {
      return trapz(y.map(function (yj) { return concentration(p, x, yj, zk, t, engine); }), y);
    });
    return trapz(rowInt, z);
  }
  function massBalance(p, x, t, engine, opts) {
    var numeric = crossPlumeMass(p, x, t, engine, opts);
    var ratio = numeric / (p.C0 * p.Y * p.Z);
    var expected = (t === null || t === undefined) ? longitudinalSurvival(p, x) : null;
    var lam = p.half_life_yr ? LN2 / p.half_life_yr : 0;
    return { x: x, engine: engine || "bioscreen_at", integrated_flux_mgL_m2: numeric,
      flux_ratio: ratio, expected_survival: expected,
      rel_error: expected ? (ratio - expected) / expected : null,
      conserved: ((t === null || t === undefined) && lam === 0 && Math.abs(ratio - 1) < 0.02) };
  }
  function conservationError(p, x, engine, opts) { return Math.abs(massBalance(p, x, null, engine, opts).rel_error); }

  // ---------- substances (Protocol 28 DB) ----------
  var DB = null;
  function setSubstanceDB(json) { DB = json; }
  function getSub(name) {
    if (!DB) throw new Error("substance DB not loaded — call setSubstanceDB(json)");
    if (!DB.substances[name]) throw new Error(name + " not in database");
    return DB.substances[name];
  }
  function interpIsotherm(iso, pH) {
    var keys = Object.keys(iso).sort(function (a, b) { return Number(a) - Number(b); });
    var xs = keys.map(Number), ys = keys.map(function (k) { return iso[k]; });
    if (pH <= xs[0]) return ys[0];
    if (pH >= xs[xs.length - 1]) return ys[ys.length - 1];
    for (var i = 1; i < xs.length; i++) if (pH <= xs[i]) {
      var f = (pH - xs[i - 1]) / (xs[i] - xs[i - 1]); return ys[i - 1] + f * (ys[i] - ys[i - 1]);
    }
    return ys[ys.length - 1];
  }
  function koc(name, pH) { pH = (pH === undefined) ? 6.5 : pH; var s = getSub(name);
    return s.koc_ph_isotherm ? interpIsotherm(s.koc_ph_isotherm, pH) : (s.koc != null ? s.koc : null); }
  function kd(name, pH) { pH = (pH === undefined) ? 6.5 : pH; var s = getSub(name);
    return s.kd_ph_isotherm ? interpIsotherm(s.kd_ph_isotherm, pH) : (s.kd != null ? s.kd : null); }
  function retardation(name, foc, rho_b, porosity, pH) {
    foc = (foc === undefined) ? 0.005 : foc; rho_b = rho_b || 1.7; porosity = porosity || 0.36; pH = (pH === undefined) ? 6.5 : pH;
    var s = getSub(name), kdv = (s.cls === "metal") ? kd(name, pH) : (koc(name, pH) || 0) * foc;
    return 1 + (rho_b / porosity) * (kdv || 0);
  }
  function halfLifeYears(name, zone) { var s = getSub(name);
    var d = (zone === "unsat") ? s.t_half_unsat_d : s.t_half_sat_d; return (d == null) ? null : d / DAYS_PER_YEAR; }
  function solubilityMgL(name) { var s = getSub(name); if (s.solubility_ug_L == null) throw new Error(name + " has no solubility"); return s.solubility_ug_L / 1000; }

  // ---------- chlorinated chain (BIOCHLOR Bateman superposition) ----------
  var MW = { PCE: 165.83, TCE: 131.39, "cis-DCE": 96.94, VC: 62.50, ethene: 28.05 };
  var ETHENE_CHAIN = ["PCE", "TCE", "cis-DCE", "VC", "ethene"];
  function chlorinatedEtheneChain(halfLives, source) {
    var yields = []; for (var i = 0; i < ETHENE_CHAIN.length - 1; i++) yields.push(MW[ETHENE_CHAIN[i + 1]] / MW[ETHENE_CHAIN[i]]);
    var species = ETHENE_CHAIN.map(function (n) { return { name: n, half_life_yr: halfLives[n] != null ? halfLives[n] : null, source_conc: source[n] || 0 }; });
    return { species: species, yields: yields };
  }
  function rates(chain) { return chain.species.map(function (s) { return (s.half_life_yr == null || s.half_life_yr === Infinity) ? 0 : LN2 / s.half_life_yr; }); }
  function distinct(ks, eps) {
    eps = eps || 1e-6; var out = ks.slice();
    for (var i = 0; i < out.length; i++) for (var j = 0; j < i; j++)
      if (Math.abs(out[i] - out[j]) <= eps * Math.max(1, Math.abs(out[i]), Math.abs(out[j])))
        out[i] += eps * (1 + Math.abs(out[i])) * (i + 1);
    return out;
  }
  function chainConcentration(chain, base, x, y, z, t, engine) {
    if (y === undefined) y = 0; if (z === undefined) z = 0; if (t === undefined) t = null;
    var n = chain.species.length, ks = distinct(rates(chain)), ys = chain.yields;
    var C0 = chain.species.map(function (s) { return s.source_conc; });
    var G = ks.map(function (k) {
      var bp = Object.assign({}, base, { C0: 1.0, half_life_yr: (k <= 0 ? null : LN2 / k) });
      return concentration(bp, x, y, z, t, engine);
    });
    var out = {};
    for (var i = 0; i < n; i++) {
      var Ci = 0;
      for (var s = 0; s <= i; s++) {
        if (C0[s] === 0) continue;
        var pref = C0[s];
        for (var j = s; j < i; j++) pref *= ys[j] * ks[j];
        var bsum = 0;
        for (var mm = s; mm <= i; mm++) {
          var denom = 1;
          for (var nn = s; nn <= i; nn++) if (nn !== mm) denom *= (ks[nn] - ks[mm]);
          bsum += G[mm] / denom;
        }
        Ci += pref * bsum;
      }
      out[chain.species[i].name] = Ci;
    }
    return out;
  }

  var api = { erf: erf, erfc: erfc, concentration: concentration,
    centerline: centerline, breakthrough: breakthrough, planView: planView, plumeLength: plumeLength,
    longitudinalSurvival: longitudinalSurvival, crossPlumeMass: crossPlumeMass,
    massBalance: massBalance, conservationError: conservationError,
    setSubstanceDB: setSubstanceDB, koc: koc, kd: kd, retardation: retardation,
    halfLifeYears: halfLifeYears, solubilityMgL: solubilityMgL,
    chlorinatedEtheneChain: chlorinatedEtheneChain, chainConcentration: chainConcentration };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.NATEngine = api;
})(typeof self !== "undefined" ? self : this);
