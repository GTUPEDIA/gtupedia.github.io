(function initSiteSeo() {
  const HOST_PRIMARY = {
    'gtupedia.com': 'https://gtupedia.com',
    'www.gtupedia.com': 'https://www.gtupedia.com',
  };

  function resolveSiteUrl() {
    const host = location.hostname.toLowerCase();
    if (HOST_PRIMARY[host]) return HOST_PRIMARY[host];
    if (host.endsWith('.github.io')) {
      const base = window.__GTUPEDIA_BASE || '/';
      const root = base.endsWith('/') ? base.slice(0, -1) : base;
      return `${location.origin}${root === '/' ? '' : root}`;
    }
    return location.origin;
  }

  const seo = {
    siteName: 'GTUPEDIA',
    siteUrl: resolveSiteUrl().replace(/\/$/, ''),
    locale: 'en_IN',
    language: 'en-IN',
    defaultTitle: 'GTU Question Papers PDF — BE, Diploma, BBA, BCA, MBA, MCA | GTUPEDIA',
    defaultDescription: 'Free GTU question papers and previous year exam PDFs for BE, Diploma Engineering, BBA, BCA, MBA, MCA and more. Browse by branch, semester, and subject code. Student-run, open access.',
    organizationDescription: 'Independent student-run platform for Gujarat Technological University (GTU) exam papers, study resources, and practical learning.',
  };

  window.__GTUPEDIA_SEO = seo;

  function upsertMeta(name, content, attr = 'name') {
    if (!content) return;
    let el = document.querySelector(`meta[${attr}="${name}"]`);
    if (!el) {
      el = document.createElement('meta');
      el.setAttribute(attr, name);
      document.head.appendChild(el);
    }
    el.setAttribute('content', content);
  }

  function upsertCanonical(href) {
    if (!href) return;
    let el = document.querySelector('link[rel="canonical"]');
    if (!el) {
      el = document.createElement('link');
      el.rel = 'canonical';
      document.head.appendChild(el);
    }
    el.href = href;
  }

  function upsertJsonLd(id, data) {
    if (!data) return;
    let el = document.getElementById(id);
    if (!el) {
      el = document.createElement('script');
      el.id = id;
      el.type = 'application/ld+json';
      document.head.appendChild(el);
    }
    el.textContent = JSON.stringify(data);
  }

  function absoluteUrl(path = '') {
    const clean = String(path || '').replace(/^\//, '');
    return clean ? `${seo.siteUrl}/${clean}` : `${seo.siteUrl}/`;
  }

  function applyStaticPageSeo() {
    const body = document.body;
    if (!body) return;
    const title = body.dataset.seoTitle;
    const description = body.dataset.seoDescription;
    const path = body.dataset.seoPath;
    const robots = body.dataset.seoRobots;
    if (!title && !description && !path) return;

    if (title) document.title = title;
    if (description) {
      upsertMeta('description', description);
      upsertMeta('og:description', description, 'property');
      upsertMeta('twitter:description', description);
    }
    if (title) {
      upsertMeta('og:title', title, 'property');
      upsertMeta('twitter:title', title);
    }
    if (path !== undefined) {
      const url = absoluteUrl(path);
      upsertCanonical(url);
      upsertMeta('og:url', url, 'property');
    }
    if (robots) upsertMeta('robots', robots);
    upsertMeta('og:site_name', seo.siteName, 'property');
    upsertMeta('og:locale', seo.locale, 'property');
    upsertMeta('og:type', 'website', 'property');
    upsertMeta('twitter:card', 'summary');

    if (title && description && path !== undefined) {
      upsertJsonLd('site-webpage-jsonld', {
        '@context': 'https://schema.org',
        '@type': 'WebPage',
        name: title,
        description,
        url: absoluteUrl(path),
        isPartOf: { '@type': 'WebSite', name: seo.siteName, url: seo.siteUrl },
        inLanguage: seo.language,
      });
    }
  }

  upsertMeta('og:locale', seo.locale, 'property');
  upsertJsonLd('site-organization-jsonld', {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: seo.siteName,
    url: seo.siteUrl,
    description: seo.organizationDescription,
    areaServed: { '@type': 'AdministrativeArea', name: 'Gujarat, India' },
  });

  if (document.body?.classList.contains('home-page')) {
    upsertJsonLd('site-website-jsonld', {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: seo.siteName,
      url: seo.siteUrl,
      description: seo.defaultDescription,
      inLanguage: seo.language,
      publisher: { '@type': 'Organization', name: seo.siteName, url: seo.siteUrl },
      potentialAction: {
        '@type': 'SearchAction',
        target: {
          '@type': 'EntryPoint',
          urlTemplate: `${seo.siteUrl}/?q={search_term_string}`,
        },
        'query-input': 'required name=search_term_string',
      },
    });
  }

  applyStaticPageSeo();
})();
