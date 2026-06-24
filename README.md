# GTUPEDIA static site

This repository is the GitHub Pages site for GTUPEDIA. In the repository settings, set **Pages → Build and deployment → Deploy from a branch → `/ (root)`**.

The previous PHP site is kept in `old/` for reference.

## Data file

The entire catalogue lives in `data/catalog.json`; it is intentionally browser-readable and contains no secrets. The three collections are:

```json
{
  "branches": [{ "id": "7", "name": "Computer Engineering" }],
  "subjects": [{ "id": "1300701", "name": "Example Subject", "branchId": "7", "semester": 3 }],
  "resources": [{ "subjectId": "1300701", "type": "paper", "title": "Winter 2013", "exam": "Winter 2013", "url": "papers/1300701-winter-2013.pdf" }]
}
```

`type` can be `paper`, `material`, `syllabus`, `video`, `book`, or `link`. `author` is optional.

## Old-table mapping

| Old table | New collection | Fields to provide |
| --- | --- | --- |
| `branch` | `branches` | `br_code`, `br_name` |
| `sublist` | `subjects` | `sub_id`, `name`, `br_code`, `sem` |
| `studymaterial` | `resources` | `sub_id`, `cat`, `title`, `link` |
| `presentations`, `ocwwl`, `vid` | `resources` | `sub_id`, title, author, link |
| paper folders / syllabus PDFs | `resources` | subject code, title/exam, file path or URL |

Share a database export (`.sql`, CSV, or SQLite database) and the paper/material folders. I can transform them into this catalogue and wire the files into the site.
