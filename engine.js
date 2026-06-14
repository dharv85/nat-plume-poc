/*
 * BIOSCREEN / Domenico natural-attenuation engine — JavaScript port.
 * Mirrors bioscreen_engine.py (validated bit-exact vs BIOSCRN4.xls).
 * Unit-agnostic; the app drives it in METRIC (m, m/yr, m/m, mg/L).
 *
 * See ../docs/DECISIONS.md "Validated equation" for the spec. The JS port must
 * reproduce the Python/spreadsheet golden values — see engine.test.js.
 */
(function (root) {
  "use strict";

  // High-accuracy erfc (Numerical Recipes, fractional error < 1.2e-7 everywhere),
  // erf = 1 - erfc. Adequate for plume work; can be upgraded to full-precision later.
  function erfc(x) {
    var z = Math.abs(x);
    var t = 1.0 / (1.0 + 0.5 * z);
    var r = t * Math.exp(
      -z * z - 1.26551223 + t * (1.00002368 + t * (0.37409196 +
      t * (0.09678418 + t * (-0.18628806 + t * (0.27886807 +
      t * (-1.13520398 + t * (1.48851587 + t * (-0.82215223 +
      t * 0.17087277)))))))));
    return x >= 0 ? r : 2.0 - r;
  }
  function erf(x) { return 1.0 - erfc(x); }

  /**
   * Concentration at point (x downgradient, y transverse, z depth) at time t.
   * p: { Vs, R, ax, ay, az, lam, k, Z, zones:[[width,conc],...] }  (consistent units)
   */
  function concentration(x, y, z, t, p) {
    var vc = p.Vs / p.R;

    // Source decay at the RETARDED EMISSION TIME (the term that makes it exact).
    var tEmit = x <= 0 ? t : Math.max(0.0, t - x / vc);
    var S = Math.exp(-p.k * tEmit);

    if (x <= 0) {
      var sum0 = 0;
      for (var i = 0; i < p.zones.length; i++) sum0 += p.zones[i][1];
      return sum0 * S;
    }

    var s = Math.sqrt(1.0 + 4.0 * p.lam * p.ax / vc);
    var longitudinal = Math.exp((x / (2.0 * p.ax)) * (1.0 - s)) *
      erfc((x - vc * t * s) / (2.0 * Math.sqrt(p.ax * vc * t)));

    var vertical;
    if (p.az <= 0) {
      vertical = 2.0; // az -> 0 collapses the vertical bracket to 2 (spreadsheet default)
    } else {
      vertical = erf((z + p.Z) / (2.0 * Math.sqrt(p.az * x))) -
                 erf((z - p.Z) / (2.0 * Math.sqrt(p.az * x)));
    }

    var total = 0;
    for (var j = 0; j < p.zones.length; j++) {
      var Y = p.zones[j][0], C = p.zones[j][1];
      var lateral = erf((y + Y / 2.0) / (2.0 * Math.sqrt(p.ay * x))) -
                    erf((y - Y / 2.0) / (2.0 * Math.sqrt(p.ay * x)));
      total += (C / 8.0) * longitudinal * lateral * vertical;
    }
    return total * S;
  }

  function centerline(x, t, p) { return concentration(x, 0.0, 0.0, t, p); }

  /**
   * Compute a concentration grid for mapping/contouring.
   * Returns { xs, ys, grid:[iy][ix] } in model coordinates (x downgradient, y transverse).
   */
  function grid(t, p, opts) {
    opts = opts || {};
    var L = opts.length, W = opts.width;
    var nx = opts.nx || 120, ny = opts.ny || 81;
    var xs = [], ys = [], g = [];
    // W7: guard nx/ny === 1 (degenerate caller) against divide-by-zero -> NaN coords.
    var fx = nx > 1 ? 1 / (nx - 1) : 0;
    var fy = ny > 1 ? 1 / (ny - 1) : 0;
    for (var ix = 0; ix < nx; ix++) xs.push(L * ix * fx);
    for (var iy = 0; iy < ny; iy++) ys.push(-W / 2 + W * iy * fy);
    for (var b = 0; b < ny; b++) {
      var row = [];
      for (var a = 0; a < nx; a++) row.push(concentration(xs[a], ys[b], 0.0, t, p));
      g.push(row);
    }
    return { xs: xs, ys: ys, grid: g };
  }

  var api = { erf: erf, erfc: erfc, concentration: concentration, centerline: centerline, grid: grid };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.NATEngine = api;
})(typeof self !== "undefined" ? self : this);
