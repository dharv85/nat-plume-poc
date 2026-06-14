// Regression test for the JS engine — must reproduce the Python/BIOSCRN4.xls golden values.
var E = require("./engine.js");

var base = {
  Vs: 1103.6220472440946, R: 5.136666666666667,
  ax: 3.28, ay: 0.32799999999999996, az: 0.0,
  k: 0.0021491773074141735, Z: 15.0,
  zones: [[240.0, 0.098], [170.0, 0.792], [100.0, 13.71]]
};
var xs = [0, 80, 160, 240, 320, 400, 480, 560, 640, 720];
var nodeg = [14.52176540607, 14.53339102017, 14.54501149645, 14.55574318049,
  14.55883115729, 14.40034624804, 12.08632645664, 5.066563814493,
  0.598231269494, 0.014771376797];
var order1 = [14.52176540607, 11.51997269925, 9.138671194180, 7.249164100453,
  5.747671119177, 4.523884332368, 3.140807920090, 1.183084012413,
  0.133085596084, 0.003210977196];

var worst = 0;
console.log("  x(ft)    no-deg JS         xls         1st JS          xls");
for (var i = 0; i < xs.length; i++) {
  var m0 = E.centerline(xs[i], 2.5, Object.assign({}, base, { lam: 0.0 }));
  var m1 = E.centerline(xs[i], 2.5, Object.assign({}, base, { lam: 0.63 }));
  if (nodeg[i]) worst = Math.max(worst, Math.abs(m0 - nodeg[i]) / nodeg[i],
                                        Math.abs(m1 - order1[i]) / order1[i]);
  console.log(
    xs[i].toString().padStart(6),
    m0.toFixed(8).padStart(14), nodeg[i].toFixed(8).padStart(14),
    m1.toFixed(8).padStart(14), order1[i].toFixed(8).padStart(14));
}
console.log("\nWorst relative error vs spreadsheet: " + worst.toExponential(2) +
  "  (" + (worst < 1e-5 ? "PASS" : "FAIL") + ")");
process.exit(worst < 1e-5 ? 0 : 1);
