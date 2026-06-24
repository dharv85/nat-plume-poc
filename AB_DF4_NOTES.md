# DF4 (lateral transport / biodegradation) — AB vs BC, and the resolution

Branch `alberta-model` · 2026-06-24 · **Craig-authorized.** The aquatic-life DF4 over-prediction is
**resolved**: the cause was the BC decay constant carried into the AB model. All AB Tier 1 aquatic
guidelines now reconcile to within +0% to +14% (mostly ≤6%). No official AB Tier 2 calculator exists; this
was resolved directly from the guidance equations (p134–135).

## The exact AB DF4 equation (p134–135) — equation form is correct
> **DF4 = 4 / [ exp(A) · erfc(B) · (erf(C) − erf(D)) ]**
> A = (x/2Dx)·[1 − √(1 + 4·Ls·Dx/v)]
> B = [x − v·t·√(1 + 4·Ls·Dx/v)] / [2·√(Dx·v·t)]
> C = (y + Y/2)/(2·√(Dy·x)),  D = (y − Y/2)/(2·√(Dy·x))   (y = 0 → erf(C)−erf(D) = 2·erf(Y/(4√(Dy·x))))
> v = V/(θt·Rs),  Rs = 1 + ρb·Koc·foc/θt,  Dx = 0.1x,  Dy = 0.01x,  t = 500 yr, x = 10 m

This is the transient Domenico solution that `fSaturated` already implements (the "4" and
`erf(C)−erf(D)=2·erf(…)` reconcile with the tool's `0.5·erfc`). **No equation/math error.** The
non-degraders (PCE, naphthalene) always matched, which confirmed the dispersion + transverse terms.

## Three AB-specific differences from the BC formulation (the actual fixes)
1. **Velocity porosity.** AB uses **total porosity θt** (`v = V/(θt·Rs)`); **ne is a BC-only parameter**
   (Table C-2 lists only θt). The tool used ne. → `fSaturated(abMode)` uses θt.
2. **Decay constant — the key one.** AB (p134–135):
   > **Ls = 0.6931 · e^(−0.07·d) / t½,s**   (d = water-table depth; Ls in 1/yr)
   The BC formulation uses the plain **λ = 0.6931 / t½** — **missing the `e^(−0.07·d)` factor**. At the
   Tier 1 default d = 3 m, e^(−0.07·3) = 0.811, i.e. BC over-credited biodegradation by ~23% in the decay
   rate, which compounded through the exponential longitudinal term into the **~2× DF4 over-prediction**.
   → `fSaturated(abMode)` multiplies the decay constant by `e^(−0.07·d)` (d = `sp.d`).
3. **TCE half-life.** Was `null` in `ab_a6.json`; AB Tier 1 Table C-6 gives **2.19 yr** (CCME). Fixed.

## Validation (AB-exact DF4 vs published, d = 3 m)
| Contaminant | tex | published DF4 | full-chain %diff |
|---|---|---|---|
| Benzene | fine / coarse | 90 / 1.85 | +4% / +3% |
| Toluene | coarse | 42 | +6% |
| Ethylbenzene | coarse | 456 | +6% |
| Xylenes | coarse | 96.7 | +5% |
| TCE | fine / coarse | 12.9 / 1.38 | +3% / −0% |
| PCE | both | ~1 | ±0% |

(Toluene-fine is +14% — the degenerate capped case, published soil 63,000 > the 30,000 cap.)

## Why this is the right answer (the user's hypothesis was correct)
It was **not a math error** — it was a **BC-vs-AB confusion** in the decay term: the tool inherited BC's
`λ = 0.6931/t½`, but AB applies a water-table-depth-attenuated decay `Ls = 0.6931·e^(−0.07·d)/t½`. With
the AB-specific velocity (θt), decay (Ls), and TCE half-life, the whole aquatic pathway reconciles. BC is
untouched (`engine.test.js` 1e-9); DUA 14/14; Part A 12/12.

## To confirm with Emma
- **d = water-table depth = 3 m** is the Tier 1 default used here (gives the match). Confirm the AB generic
  default; the `e^(−0.07·d)` factor makes DF4 sensitive to it.
- TCE half-life 2.19 yr (Table C-6) now in `ab_a6.json`.
