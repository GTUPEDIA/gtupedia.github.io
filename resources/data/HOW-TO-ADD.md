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

## Old CEV library

The previous Cutting Edge Visionaries site is archived in `../old/`.
