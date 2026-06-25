# Running the Alberta tool — access guide for Emma

**For Emma Kirsh · `alberta-model` branch · 2026-06-24.** Everything you need to open and run the Alberta
Tier 1/2 interface yourself, plus run the reconciliation. Any trouble → ping Dan.

## Your access (already set up)
- You're a **collaborator** on the public repo **`dharv85/nat-plume-poc`** (GitHub account
  `ekirsh999-crypto`). You don't need to request anything.
- The **Alberta version of the tool lives on the `alberta-model` branch** (not `main`). The public Pages
  demo (`dharv85.github.io/nat-plume-poc`) currently shows the **non-AB** `main` version, so to see the AB
  interface you run the `alberta-model` branch **locally** — steps below.

## One-time setup
You need two free tools (most Macs/PCs have them, or install once):
- **git** — to get the code.
- **Python 3** *or* **Node.js** — to serve the page locally. (Node also runs the reconciliation harness.)

Check what you have (in Terminal / PowerShell):
```bash
git --version
python3 --version      # OR:  node --version
```

## Run the interface (≈1 minute)
```bash
# 1. get the code (first time only)
git clone https://github.com/dharv85/nat-plume-poc.git
cd nat-plume-poc

# 2. switch to the Alberta branch
git checkout alberta-model

# 3. start a local web server (pick ONE)
python3 -m http.server 8001
#   — or, if you use Node:  npx http-server -p 8001

# 4. open this in your browser:
#    http://localhost:8001
```
To get the latest later: `git pull` (while on the `alberta-model` branch).

In the app: set **Source pathway → Jurisdiction = AB Tier 2**, then try the Fine/Coarse toggle, the
water-use selector (DUA / aquatic / livestock / wildlife), and the `[AB A-6]` chemistry tag.

## What works, and the login
- **The modelling + Alberta reconciliation are fully client-side** — they work immediately, **no login
  needed**. This is everything you're reviewing.
- The **Esri / ArcGIS "Sign in"** button is only for saving plumes to AGOL / EQuIS data. It's **optional**
  for your review, and it only works from a browser origin that's registered in our OAuth app. If you want
  it enabled from your machine, tell Dan and he'll add your `localhost:8001` origin.

## Run the reconciliation yourself (optional, needs Node)
```bash
node ab_tier1_reconcile.js      # the full DF1–DF4 vs published AB Tier 1 reconciliation
node ab_residual_analysis.js    # the "why the residual is rounding, not error" audit
```
Expected: **DUA 14/14, Aquatic 12/12, Livestock 10/10, Wildlife 5/5**, all within ±1–5%.

## Your review checklist
Start at **`AB_EMMA_REVIEW.md`** (in the same folder) — the consolidated sign-off list (chemistry,
defaults, reconciliation acceptance, metals, standards). Detail docs are alongside it:
`AB_TIER1_RECONCILIATION.md`, `AB_DF4_NOTES.md`, `AB_DEFAULTS_VALIDATION.md`, `AB_METALS_SCREENING.md`.

## A note on data & security
The repo is **public**, so it contains **only public/demo data** — the AB chemistry (`ab_a6.json`, from
public CCME/AEPA guidance) and the *published* AB Tier 1 guideline values. The confidential pieces (EQuIS
wells, monitoring results, the SLR standards library, any tokens) are **deliberately kept out** of the repo
and aren't needed for your review. **Please don't commit any confidential client data to this branch** — it
would become world-visible. If you edit and want to save work, push to a **new branch** (e.g.
`emma/<topic>`) and let Dan promote it, rather than committing confidential files.
