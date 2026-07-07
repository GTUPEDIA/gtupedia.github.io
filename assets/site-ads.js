(function initSiteAds() {
  window.__GTUPEDIA_ADSENSE = {
    client: 'ca-pub-0350031762895572',
    // Paste slot IDs from AdSense → Ads → By ad unit (one responsive display unit can be reused).
    slots: {
      banner: '',
      home: '',
      course: '',
      branch: '',
      subject: '',
      footer: '',
    },
  };

  function resolveSlot(name) {
    const cfg = window.__GTUPEDIA_ADSENSE || {};
    return cfg.slots?.[name] || cfg.slots?.banner || '';
  }

  window.renderAdSlot = function renderAdSlot(name, options = {}) {
    const cfg = window.__GTUPEDIA_ADSENSE || {};
    const client = cfg.client || '';
    const slot = resolveSlot(name);
    if (!client || !slot) return '';

    const format = options.format || 'auto';
    const extraClass = options.className ? ` ${options.className}` : '';

    return `<aside class="ad-slot${extraClass}" data-ad-slot-name="${name}" aria-label="Advertisement">
      <p class="ad-slot__label">Advertisement</p>
      <ins class="adsbygoogle"
           style="display:block"
           data-ad-client="${client}"
           data-ad-slot="${slot}"
           data-ad-format="${format}"
           data-full-width-responsive="true"></ins>
    </aside>`;
  };

  window.hydrateAdSlots = function hydrateAdSlots(root = document) {
    if (!window.adsbygoogle) return;
    const units = root.querySelectorAll('.ad-slot ins.adsbygoogle:not([data-ad-loaded])');
    units.forEach((ins) => {
      if (!ins.getAttribute('data-ad-slot')) return;
      ins.dataset.adLoaded = '1';
      try {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      } catch (_) {
        // Ignore ad loader errors while account is pending approval.
      }
    });
  };

  function mountFooterAds() {
    document.querySelectorAll('[data-ad-footer]').forEach((el) => {
      const html = window.renderAdSlot('footer');
      if (!html) return;
      el.innerHTML = html;
      window.hydrateAdSlots(el);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mountFooterAds);
  } else {
    mountFooterAds();
  }
})();
