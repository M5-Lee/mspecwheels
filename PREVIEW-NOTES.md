# PREVIEW-NOTES.md — MSpec Fitment Guide static cut

**Owner:** MSpec · Product  
**Staged:** Sun Sep 27, 2026 ~6:05 AM CT  
**Source (read-only ingest):** `C:\Projects\NewVenture\ingest\01\MSpec Wheels\mspec_wheels_phase1\`  
**Dest:** `C:\Projects\NewVenture\companies\MSpecWheels\Product\site-preview\`

## What this is

Local static preview of Lee's locked phase1 Fitment Guide UI, cut for GitHub Pages (or Cloudflare Pages). **No Claude. No Netlify serverless.** Ingest source was not modified.

## Copied

| Item | Status |
|------|--------|
| `index.html` | Copied; banner + fitment fetch stubbed |
| `chassis_database.json` | Copied (~94 KB) |
| `chassis_geometry.json` | Copied (~12 KB); still fetched client-side for viz |
| `wheel_well_render.js` | Copied (client-side viz only) |
| `assets/` (logo + wheelwell PNGs) | Copied |
| Favicons (ico/png/apple-touch) | Copied |
| `_preview/` | Copied (preview PNGs + label script; not required for Pages) |
| `README.md` / `.gitignore` | Copied (README still describes legacy Netlify — see Disabled) |
| `.env.example` | Rewritten: no Anthropic key instructions for this cut |

**Secrets:** No `.env` with real keys existed in ingest. None written. Only placeholder-free `.env.example` stating no secrets needed.

## Disabled / neutralized

| Path / behavior | Action |
|-----------------|--------|
| `netlify/functions/fitment.js` (Claude API proxy) | Moved to `_disabled-serverless/netlify/functions/` |
| `system_prompt.js` / `system_prompt.txt` | Moved with functions (reference only) |
| Original `netlify.toml` (functions + `/api/fitment` redirect) | Moved to `_disabled-serverless/netlify.toml` |
| New root `netlify.toml` | Static stub only — no functions, no API redirect |
| `index.html` `fetch('/.netlify/functions/fitment')` | Early-return stub; original call left inside `DISABLED_SERVERLESS_FETCH` block comment |
| Top-of-page banner | `STATIC PREVIEW — Claude / Netlify serverless DISABLED` |
| `.env.example` | Cleared of ANTHROPIC_API_KEY paste instructions |

**Still works client-side:** page chrome, Tailwind CDN, fonts, logo/assets, `chassis_geometry.json` load + `wheel_well_render.js` viz (when a verdict path runs — currently blocked by stub until mechanical engine is wired).

**Does not work in this cut:** live fitment verdicts (Claude/Netlify removed). Mechanical engine lives under `Product\engine\` (Python) — not yet wired into this HTML.

## Asset sanity (local)

Verified relative refs resolve on disk under `site-preview\`:

- `favicon.ico`, `favicon-16x16.png`, `favicon-32x32.png`, `apple-touch-icon.png`
- `assets/logo.png`, `assets/wheelwell_v1_technical.png`, `assets/wheelwell_v2_3d.png`
- `wheel_well_render.js`, `chassis_geometry.json`, `chassis_database.json`

Local open path (not a live URL):  
`file:///C:/Projects/NewVenture/companies/MSpecWheels/Product/site-preview/index.html`

Note: some browsers block `fetch('chassis_geometry.json')` on `file://`. For viz smoke, serve the folder with any static server (e.g. `npx serve`) or wait for GitHub Pages.

## Live GitHub Pages deploy — BLOCKED

**Blocked on:** no existing writable MSpec Pages repo found, and no safe way to create/push one from this seat.

Evidence this turn:

- `gh` CLI not installed on DESKTOP-TDMJ022
- No `.git` remotes under `C:\Projects\NewVenture\companies\MSpecWheels\`
- Cursor GitHub MCP server status: **needsAuth** (cannot list/search repos)

Per Product charter: do **not** create a public GitHub repo or push unless an existing MSpec Pages repo is already clearly present and writable.

**No live URL invented.**

## Exact next steps (Lee / Automation)

1. **Lee:** Authenticate GitHub for agents (`gh auth login` and/or Cursor GitHub MCP), OR create an empty public repo e.g. `mspec-wheels-fitment` (or `<user>.github.io`) and grant write access.
2. **Lee or Automation:** Confirm whether to publish from `Product\site-preview\` as repo root, or copy into a dedicated Pages branch/folder (`docs/` or `gh-pages`).
3. **Automation (after repo exists + writable):**
   - `git init` (or clone), add remote
   - Commit static cut **excluding** `_disabled-serverless/` from public tree if desired (or leave as clearly marked dead code)
   - Ensure no `.env` / API keys
   - Push `main`; enable **Settings → Pages → Deploy from branch → main / (root)**
   - Report the `*.github.io/...` URL back into `EXECUTE-STATUS.md`
4. **Product (follow-on):** Wire mechanical client-side fitment (from `Product\engine\` / `RULE-TABLES.json`) into `index.html` so Submit works without Claude.
5. **Do not** revive Netlify Claude function for production; do not paste Anthropic keys into this folder.

## Host choice pointer

See `Product\SITE-HOST-OPTIONS.md` — GitHub Pages primary, Cloudflare Pages strong alt. Domain repurchase deferred.
