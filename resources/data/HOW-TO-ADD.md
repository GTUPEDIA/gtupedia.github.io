# Adding resources

Edit `library.json` and add entries to the `items` array.

## Item shape

```json
{
  "id": "unique-id",
  "title": "Resource title",
  "url": "https://example.com",
  "type": "course",
  "category": "courses",
  "topics": ["web-dev", "programming"],
  "description": "Short note for students (optional).",
  "source": "YouTube",
  "recommended": false,
  "tags": ["beginner", "free"]
}
```

## Fields

| Field | Required | Notes |
|-------|----------|--------|
| `id` | yes | Unique string, e.g. `cs50-harvard` |
| `title` | yes | Display name |
| `url` | yes | Link (use `https://`) |
| `category` | yes | Must match a `categories[].id` |
| `topics` | no | Array of `topics[].id` values |
| `type` | no | `course`, `video`, `article`, `doc`, `code`, `tool` |
| `description` | no | One or two sentences |
| `source` | no | e.g. MIT OCW, freeCodeCamp |
| `recommended` | no | `true` shows a star badge |
| `tags` | no | Extra filter labels |

After saving, refresh the resources page. No build step required.

## Blockchain deep-dive track

A curated blockchain learning path lives in `blockchain-curriculum.txt` (one entry per line: `Title | URL | recommended`).

Re-import after edits:

```bash
node scripts/import-blockchain-resources.js
```

Filter on the live page: **Resources → Blockchain** topic chip, or `?topic=blockchain`.

## Dead link checker

Check all resource URLs (report only):

```bash
node scripts/check-resource-urls.js
```

Remove confirmed dead links from `library.json` (also updates `blockchain-curriculum.txt` and a blocklist so re-imports skip them):

```bash
node scripts/check-resource-urls.js --remove
```

Optional flags: `--limit 50` (test run), `--verbose`, `--concurrency 6`.

Reports are written to `url-check-report.json`. Removed URLs are logged in `url-check-removed.json`.

**Note:** Some sites return 403 to automated checks but work in a browser — those are kept. Only clear failures (404, DNS errors, timeouts) are removed.

## Old CEV library

The previous Cutting Edge Visionaries site is archived in `../old/`.
