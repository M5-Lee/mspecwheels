# Drafts portal (ops)

Unlisted phone review for Buffer drafts. Images load from this site (`/buffer/...`) so they work on HTTPS in Korea, where Imgur is blocked.

Not linked from the public homepage. Do not put the password or this path in `index.html`.

## URL

https://mspecwheels.com/drafts/mspec-lee-k7f3a9c2/

`/drafts/` only says the area is private. It does not list packs.

## Password

`MSpecLeeDrafts2026`

Typed into the page, then kept in `sessionStorage` for that browser session (`mspec-lee-drafts-auth`). Closing the tab locks it again. This is obscurity plus a shared password, not Cloudflare Access. The repo is public, so anyone who can read the source can read the password.

## Add or update a pack

1. Put images in `buffer/<pack>/`. Lead photo first (`01-…`), wheel-well reference second when you have one.
2. Edit `drafts/mspec-lee-k7f3a9c2/drafts.json` only. The page renders that file after unlock.
3. Use site-root paths such as `/buffer/Cj156/01-car.png` (works on https://mspecwheels.com).
4. Push to `main`. GitHub Pages serves the repo root.

Leave unknown fields `null`. Do not invent fitment, size, price, location, grades, captions, or forum links.

### Fields

| Field | Meaning |
|---|---|
| `pack`, `title` | Pack name shown on the card |
| `bufferId` | Buffer draft id |
| `date` | `YYYY-MM-DD` (America/Chicago). Cards group by this. |
| `schedule` | Label on the card, e.g. `Sun Oct 4 · CT` |
| `status` | `scheduled`, `draft`, or `hold` |
| `fit`, `size`, `asking`, `location` | Shown only when set |
| `structural`, `cosmetic` | Short one-liner, or null |
| `caption` | Post caption, or null |
| `forumUrl` | `http(s)` link, or null |
| `images` | Array of root-relative URLs, lead first. Empty array shows a placeholder. |
| `imageNote` | Why images are missing, or null |
| `notes` | Reviewer note, or null |

## Do not list

Forgestar is on ET-hold. Do not add it.
