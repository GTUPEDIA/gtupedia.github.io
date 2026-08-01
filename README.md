# GTUPEDIA static site

GTUPEDIA is hosted on **Hostinger** at [https://gtupedia.com](https://gtupedia.com). Upload the built site to `public_html` (domain document root).

The previous PHP site is kept in `old/` for reference. The repo name (`gtupedia.github.io`) is legacy from GitHub Pages.

## Deploy to Hostinger

1. **Build locally** (required — generates sitemap, SEO pages, and catalog cache version):

   ```bash
   node scripts/build-catalog.js
   ```

2. **Upload SEO pages (required for Google — ~6,700 URLs in sitemap)**

   The sitemap lists thousands of subject URLs like `/BE/09/.../disaster-management`. These are **static HTML files** generated at build time into course folders (`BE/`, `DI/`, etc.). They are **not in git** — if you only uploaded the repo root, Google will see **404** on those URLs.

   **Easy way — run the packaging script:**

   ```bash
   node scripts/package-hostinger-deploy.js
   ```

   This builds the catalog, then creates **`hostinger-seo-pages.zip`** (~45 MB). In Hostinger **File Manager → public_html**:

   1. Upload `hostinger-seo-pages.zip`
   2. **Extract** (merge with existing files)
   3. Verify a subject URL loads, e.g.  
      `https://gtupedia.com/BE/09/electrical-engineering/3150913/disaster-management/`

   **Alternative — SSH on Hostinger** (if available):

   ```bash
   git pull
   node scripts/build-catalog.js
   ```

   That generates all SEO folders directly on the server.

3. **Upload** the rest of the site to Hostinger `public_html` if not already there:
   - Include `index.html`, `assets/`, `data/`, `.htaccess`, course folders (`BE/`, `DI/`, …), `sitemap.xml`, `robots.txt`, and all subpages.
   - Or use **File Manager**, **FTP**, or **Git** if enabled on your Hostinger plan.

3. **DNS** (at your domain registrar or Hostinger):
   - Point `gtupedia.com` A record to Hostinger’s server IP.
   - Optional: redirect `www` → apex (`.htaccess` already handles this).

4. **After deploy**, verify:
   - [https://gtupedia.com/](https://gtupedia.com/)
   - [https://gtupedia.com/sitemap.xml](https://gtupedia.com/sitemap.xml)
   - Search Console: set preferred domain to `gtupedia.com`, submit sitemap.

5. **Optional — redirect old GitHub Pages URLs**  
   If `gtupedia.github.io` still resolves, add a meta refresh or DNS redirect to `gtupedia.com`.

## Site URL configuration

Primary URL is set in `data/seo.json`:

```json
{ "siteUrl": "https://gtupedia.com" }
```

Override for a staging build: `GTU_SITE_URL=https://staging.example.com node scripts/build-catalog.js`

Runtime base path is handled by `assets/site-base.js` (root `/` on Hostinger; legacy `/gtupedia.github.io/` subpath still supported).

## Data file

The catalogue lives in `data/catalog.json` (browser-readable, no secrets). Subject lists are split per course (`data/be-subjects.json`, etc.) and loaded lazily in the app.

Exam paper links are built from `details-raw/*-papers*` lists in `scripts/build-catalog.js`.

## Old-table mapping

| Old table | New collection | Fields to provide |
| --- | --- | --- |
| `branch` | `branches` | `br_code`, `br_name` |
| `sublist` | `subjects` | `sub_id`, `name`, `br_code`, `sem` |
| `studymaterial` | `resources` | `sub_id`, `cat`, `title`, `link` |
| paper folders / syllabus PDFs | exam paper sets in build | subject code, season, GTU PDF URL pattern |

Share a database export (`.sql`, CSV, or SQLite) and paper code lists to extend the catalogue.
