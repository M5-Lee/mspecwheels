# MSpec Wheels — Phase 1 Deployable

This folder contains everything needed to deploy the Phase 1 fitment tool to Netlify.

**Live at:** https://mspecwheels.com (after deploy)

## What's in this folder

| File | Role |
|---|---|
| `index.html` | The single-page landing — hero, fitment tool UI, listings showcase, intake form, FAQ, footer. Brand-correct (dark mode, BMW M tricolor accents, Anton/Inter/JetBrains Mono typography). |
| `chassis_database.json` | Structured chassis fitment data — feeds the fitment-tool prompt as grounded context. v1.1 (27 chassis entries: 22 detailed + 5 stubs). Round-1 spot-check applied. |
| `system_prompt.txt` | Production fitment-tool system prompt — Claude API optimized. Loaded by the Netlify Function. |
| `netlify/functions/fitment.js` | The serverless function. Receives POST `{specs, chassis, context}`, calls Claude API, returns verdict JSON. |
| `netlify/functions/package.json` | Node engine declaration for the function. |
| `netlify.toml` | Netlify config — function bundling, redirects, headers. |
| `.env.example` | Template for environment variables. |
| `.gitignore` | Excludes `.env` and `node_modules` from git. |
| `assets/logo.png` | The MSpec Wheels logo (BMW M-stripe slashes). |
| `favicon*.png`, `apple-touch-icon.png` | Existing favicon assets from the legacy site. |

## Deploy in 5 minutes

### Step 1 — Drop the system prompt in place

The `fitment.js` function expects a `system_prompt.txt` file in the same folder, bundled with the function. The production system prompt lives in `../fitment_tool_system_prompt.md` (one folder up from this build). Extract just the prompt body (the section between "## SYSTEM PROMPT (copy from here for production)" and "---\n\n## DEPLOYMENT NOTES") and save it as `netlify/functions/system_prompt.txt`.

Quick way: open the file, copy the prompt, paste into a new file named `system_prompt.txt`.

### Step 2 — Set your Anthropic API key

You'll set this in Netlify (NOT in this folder). Two paths:

**(a) Netlify dashboard** (recommended for simplicity):
1. Go to https://app.netlify.com/projects/luxury-zabaione-2c5b04
2. Site settings → Environment variables → Add variable
3. Key: `ANTHROPIC_API_KEY`, Value: your `sk-ant-api03-...` key
4. Save

**(b) Netlify CLI** (if you prefer terminal):
```bash
netlify env:set ANTHROPIC_API_KEY sk-ant-api03-YOUR-KEY
```

Get an API key at https://console.anthropic.com/settings/keys if you don't have one.

### Step 3 — Drag and drop the folder onto Netlify

1. Open https://app.netlify.com/projects/luxury-zabaione-2c5b04
2. Click "Deploys" tab
3. Drag this entire `mspec_wheels_phase1/` folder onto the drop zone (where it says "Drag and drop your project folder here")
4. Wait ~30 seconds for the build + function deploy
5. Visit https://mspecwheels.com — the new tool should be live

### Step 4 — Verify the fitment tool works

1. Land on the page
2. Scroll to "Try It Now"
3. Type `19x10 ET25 5x112` and pick `G80 M3` from the dropdown
4. Click "Run Fitment Check"
5. You should see a verdict (expected: YES_WITH_MODS) appear within ~5 seconds

If you see an error:
- "Server not configured. ANTHROPIC_API_KEY missing." → API key not set in Netlify env vars (revisit Step 2)
- "Claude API error (401)" → API key invalid or expired
- "Claude API error (429)" → Rate limit (rare; wait a minute)
- "Could not parse fitment verdict" → Model returned non-JSON; check Netlify Function logs

### Step 5 — Wire your FB Pixel (optional but recommended)

In `index.html`, find the lines:
```js
// fbq('init', 'YOUR_PIXEL_ID'); // <-- uncomment + paste ID
// fbq('track', 'PageView');
```

Uncomment them and paste your real Pixel ID (from Meta Events Manager). Re-deploy.

## Test inputs (regression set)

After deploying, run these through the live tool to make sure verdicts are sensible:

| Input | Expected verdict |
|---|---|
| `19x10 ET25 5x112` + G80 M3 | YES_WITH_MODS |
| `19x9 ET29 5x120` + F80 M3 | YES_DIRECT_FIT |
| `18x9.5 ET22` + E39 M5 | YES_WITH_MODS (note 74.1mm bore) |
| `20x10 ET15 5x120` + G80 M3 | NO_NOT_RECOMMENDED (wrong PCD) |
| `21x10.5 ET10` + G80 M3 with `lowered, -3° camber, willing to roll` | MAYBE_HEAVY_MODS |

If any of these come back surprising, log the actual output and iterate the system prompt.

## Architecture (for reference)

```
[Browser]
  POST /api/fitment {specs, chassis, context}
       │
       ↓ (Netlify redirect)
[/.netlify/functions/fitment]
  - Loads system_prompt.txt + chassis_database.json (cold start)
  - Calls Claude API with system prompt + grounded context
  - Parses JSON response
  - Returns verdict JSON
       │
       ↓
[Browser renders verdict in UI]
```

## What's NOT in v1 (deferred to Phase 2)

- Vision input for marketplace listing screenshots (Claude API supports it; UI hook exists in spec but not wired)
- Email capture writing to a real database (currently posts to Formspree)
- Live listings feed (the 6 cards are placeholder data)
- Backup IG handle creation
- Conversions API integration
- Privacy Policy + Terms of Service pages (footer links to TBD)

These are in the master brief's Phase 2 roadmap. Don't try to add them tonight — ship Phase 1, gather feedback, then iterate.

## Cost estimate

At Phase 1 traffic levels (~30 queries/day), expected Claude API cost is **$1–5/month** using Sonnet 4.6 at temperature 0.1, ~3K input tokens (prompt + chassis db) + ~300 output tokens per query. Netlify Function invocations and bandwidth are well within the free tier.

## Updating the chassis database

When you spot-check more chassis or fill stubs:
1. Edit `chassis_database.json` directly (or regenerate from `MSpec_Wheels_Fitment_Database.md` via the parser script)
2. Re-deploy the folder to Netlify
3. The new data takes effect immediately on next function cold start (within seconds)

---

*Generated 2026-04-30 as part of the four-push Phase 1 sprint. See `MSpec_Wheels_Project_Brief.md` for full context.*
