# POC — run locally & embed in Experience Builder (for Craig, Tue 2026-06-16)

This is a **throwaway proof-of-concept**: metric Domenico/BIOSCREEN plume on an OpenStreetMap
basemap, validated engine, no login, no saving. Goal is to show the concept inside Experience
Builder and get Craig's feedback. We rebuild it "properly" (Esri basemaps + auth + save) after.

## 1. Test it locally first
The page loads `engine.js` and the ArcGIS CDN, so serve it over http (not file://):

    cd poc
    python3 -m http.server 8000

Open <http://localhost:8000>. You should see the map, a diamond source marker at Calgary,
and a plume. Change inputs → **Run model**. Click **📍 set source** then click the map to move it.

## 2. Put it on GitHub Pages
1. Create a repo (personal GH for now), commit `poc/index.html` + `poc/engine.js`.
2. Settings → Pages → deploy from branch (root or `/poc`).
3. Note the URL, e.g. `https://<you>.github.io/<repo>/`.

## 3. Embed in Experience Builder
1. ArcGIS Online → **Apps → Experience Builder → Create New** (blank or a simple template).
2. Add an **Embed** widget; set it to **embed by URL** and paste the GitHub Pages URL.
   (Use full-page / large size so the map has room.)
3. Save → **Preview** to demo. Share/publish later as needed.

## ⚠️ Security notes for the POC (it is PUBLIC and unauthenticated)
- **Do NOT load any confidential / real site data into the POC.** It's on public GitHub Pages
  with no login. Use generic/dummy inputs only. (Real data waits for the authenticated build.)
- The POC writes nothing to AGOL — no feature service, no saving. Safe to throw away.
- This deliberately skips the production security model (auth, group sharing, ownership-based
  editing) — that's Phases 3–4 in `../docs/ROADMAP.md`, not the POC.

## What to show Craig
- The plume is the **validated** engine (matches BIOSCRN4.xls to ~1e-9) — see `engine.test.js`.
- Metric inputs throughout.
- Move the source, change flow azimuth, watch the georeferenced plume update.
- Ask him: source representation (single vs nested multi-zone), which decay model to default,
  which 2nd regulatory framework, and what he'd want on-screen (contour lines, centerline plot,
  receptor breakthrough, field-data overlay).

## Known POC limitations (by design — not bugs)
- Single source zone (engine supports nested multi-zone; UI exposes one for now).
- Heatmap only; no labelled contour lines / compliance-boundary line yet.
- OSM basemap (no Esri imagery); no auth; no save.
- Source is click-to-place (drag can come later).
