(function initGhLevel0Course() {
  var MODULES = [
    {
      id: 'before-you-start',
      stage: 'Start',
      title: 'Before you start',
      summary: 'Git vs GitHub, what you need, how to follow this course.',
      minutes: 20,
      path: 'github-initiative/level-0/before-you-start/',
    },
    {
      id: 'github-account',
      stage: 'Module 1',
      title: 'GitHub account & profile',
      summary: 'Sign up, secure with 2FA, and build a professional profile.',
      minutes: 25,
      path: 'github-initiative/level-0/github-account/',
    },
    {
      id: 'first-repository',
      stage: 'Module 2',
      title: 'Your first repository',
      summary: 'Create a repo, explore tabs, and make your first commit.',
      minutes: 30,
      path: 'github-initiative/level-0/first-repository/',
    },
    {
      id: 'github-pages',
      stage: 'Module 3',
      title: 'GitHub Pages',
      summary: 'Publish your username.github.io site for free.',
      minutes: 40,
      path: 'github-initiative/level-0/github-pages/',
    },
    {
      id: 'add-edit-code',
      stage: 'Module 4',
      title: 'Add & edit code',
      summary: 'Upload via the web or clone, edit locally, and push.',
      minutes: 35,
      path: 'github-initiative/level-0/add-edit-code/',
    },
    {
      id: 'git-commands',
      stage: 'Module 5',
      title: 'Essential Git commands',
      summary: 'init, clone, status, add, commit, push, pull, and log.',
      minutes: 50,
      path: 'github-initiative/level-0/git-commands/',
    },
    {
      id: 'branches-merging',
      stage: 'Module 6',
      title: 'Branches & merging',
      summary: 'Feature branches, pull requests, and merge conflicts.',
      minutes: 40,
      path: 'github-initiative/level-0/branches-merging/',
    },
    {
      id: 'collaboration',
      stage: 'Module 7',
      title: 'Collaboration',
      summary: 'Team workflows, forks, issues, and pull request etiquette.',
      minutes: 35,
      path: 'github-initiative/level-0/collaboration/',
    },
    {
      id: 'whats-next',
      stage: 'Finish',
      title: "What's next",
      summary: 'Portfolio tips and registering for live sessions.',
      minutes: 15,
      path: 'github-initiative/level-0/whats-next/',
    },
  ];

  var TOTAL_MINUTES = MODULES.reduce(function (sum, module) {
    return sum + module.minutes;
  }, 0);

  function formatMinutes(minutes) {
    if (minutes < 60) return minutes + ' min';
    var hours = Math.floor(minutes / 60);
    var rest = minutes % 60;
    if (!rest) return hours + ' hr';
    return hours + ' hr ' + rest + ' min';
  }

  function moduleById(id) {
    for (var i = 0; i < MODULES.length; i += 1) {
      if (MODULES[i].id === id) return { module: MODULES[i], index: i };
    }
    return null;
  }

  function renderSidebar(activeId) {
    var nav = document.querySelector('[data-gh-level0-nav]');
    if (!nav) return;

    var html = [
      '<div class="gh-level0-course__sidebar-head">',
      '<a class="gh-level0-course__home-link" href="github-initiative/level-0/">Level 0 course</a>',
      '<p class="gh-level0-course__sidebar-meta"><span class="gh-level0__time-badge gh-level0__time-badge--course">3–6 hours</span> · ' + MODULES.length + ' modules</p>',
      '</div>',
      '<ol class="gh-level0-course__module-list">',
    ];

    MODULES.forEach(function (module, index) {
      var isActive = module.id === activeId;
      html.push(
        '<li class="gh-level0-course__module-item' + (isActive ? ' is-active' : '') + '">',
        '<a href="' + module.path + '">',
        '<span class="gh-level0-course__module-stage">' + module.stage + '</span>',
        '<span class="gh-level0-course__module-title">' + module.title + '</span>',
        '<span class="gh-level0__time-badge">' + formatMinutes(module.minutes) + '</span>',
        '</a>',
        '</li>'
      );
    });

    html.push('</ol>');
    nav.innerHTML = html.join('');
  }

  function renderPager(activeId) {
    var pager = document.querySelector('[data-gh-level0-pager]');
    if (!pager) return;

    var found = moduleById(activeId);
    if (!found) return;

    var prev = found.index > 0 ? MODULES[found.index - 1] : null;
    var next = found.index < MODULES.length - 1 ? MODULES[found.index + 1] : null;
    var parts = ['<div class="gh-level0-course__pager-inner">'];

    if (prev) {
      parts.push(
        '<a class="gh-level0-course__pager-link gh-level0-course__pager-link--prev" href="' + prev.path + '">',
        '<span class="gh-level0-course__pager-label">Previous</span>',
        '<span class="gh-level0-course__pager-title">' + prev.title + '</span>',
        '</a>'
      );
    } else {
      parts.push('<span class="gh-level0-course__pager-spacer"></span>');
    }

    parts.push(
      '<a class="gh-level0-course__pager-link gh-level0-course__pager-link--hub" href="github-initiative/level-0/">All modules</a>'
    );

    if (next) {
      parts.push(
        '<a class="gh-level0-course__pager-link gh-level0-course__pager-link--next" href="' + next.path + '">',
        '<span class="gh-level0-course__pager-label">Next</span>',
        '<span class="gh-level0-course__pager-title">' + next.title + '</span>',
        '</a>'
      );
    } else {
      parts.push('<span class="gh-level0-course__pager-spacer"></span>');
    }

    parts.push('</div>');
    pager.innerHTML = parts.join('');
  }

  function initVideoLinks() {
    document.querySelectorAll('.gh-level0__video-link').forEach(function (link) {
      var href = (link.getAttribute('href') || '').trim();
      if (!href || href === '#') {
        link.classList.add('gh-level0__video-link--pending');
        link.setAttribute('aria-disabled', 'true');
        link.addEventListener('click', function (e) { e.preventDefault(); });
        return;
      }
      link.classList.remove('gh-level0__video-link--pending');
      link.setAttribute('target', '_blank');
      link.setAttribute('rel', 'noopener');
      if (link.textContent.trim() === 'Add YouTube link') {
        link.textContent = 'Watch on YouTube ↗';
      }
    });
  }

  var lessonId = document.body.getAttribute('data-gh-level0-lesson');
  if (lessonId) {
    renderSidebar(lessonId);
    renderPager(lessonId);
  }
  initVideoLinks();

  window.GH_LEVEL0_COURSE = {
    modules: MODULES,
    totalMinutes: TOTAL_MINUTES,
    formatMinutes: formatMinutes,
  };
})();
