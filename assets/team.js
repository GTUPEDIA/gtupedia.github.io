const teamEls = {
  intro: document.querySelector('#team-intro'),
  join: document.querySelector('#team-join'),
  grid: document.querySelector('#team-grid'),
  updated: document.querySelector('#team-updated'),
};

function escapeHtml(value = '') {
  return String(value).replace(/[&<>'"]/g, ch => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;',
  })[ch]);
}

function linkLabel(key) {
  return ({
    github: 'GitHub',
    linkedin: 'LinkedIn',
    email: 'Email',
    website: 'Website',
  })[key] || key;
}

function programmeLine(member) {
  const parts = [member.course, member.branch].filter(Boolean);
  if (member.semester) parts.push(`Sem ${member.semester}`);
  return parts.join(' · ');
}

function renderMember(member) {
  const programme = programmeLine(member);
  const links = Object.entries(member.links || {})
    .filter(([, url]) => url && String(url).trim())
    .map(([key, url]) => {
      const href = key === 'email' && !String(url).startsWith('mailto:')
        ? `mailto:${url}`
        : url;
      return `<a href="${escapeHtml(href)}"${key !== 'email' ? ' target="_blank" rel="noopener"' : ''}>${escapeHtml(linkLabel(key))}</a>`;
    });

  return `
    <article class="team-card">
      <h2 class="team-name">${escapeHtml(member.name)}</h2>
      ${programme ? `<p class="team-programme">${escapeHtml(programme)}</p>` : ''}
      ${member.college ? `<p class="team-college">${escapeHtml(member.college)}</p>` : ''}
      ${member.role && member.role !== 'Team member' ? `<p class="team-role">${escapeHtml(member.role)}</p>` : ''}
      ${links.length ? `<div class="team-links">${links.join('')}</div>` : ''}
    </article>`;
}

function renderTeam(data) {
  if (teamEls.intro) teamEls.intro.textContent = data.intro || '';
  if (teamEls.join) teamEls.join.textContent = data.joinNote || '';
  if (teamEls.updated && data.updatedAt) {
    teamEls.updated.textContent = `${data.members?.length || 0} member${data.members?.length === 1 ? '' : 's'} · Last updated ${data.updatedAt}`;
  }

  if (!teamEls.grid) return;

  const members = data.members || [];
  if (!members.length) {
    teamEls.grid.innerHTML = `
      <div class="team-empty">
        <p><strong>Team list coming soon.</strong></p>
        <p>Add GTU students in <code>data/team.json</code> — see <code>data/HOW-TO-ADD-TEAM.md</code>.</p>
      </div>`;
    return;
  }

  teamEls.grid.innerHTML = members.map(renderMember).join('');
}

const base = window.__GTUPEDIA_BASE || '/';
const root = base.endsWith('/') ? base : `${base}/`;

fetch(`${root}data/team.json`, { cache: 'no-store' })
  .then(response => response.ok ? response.json() : Promise.reject(new Error('Could not load team')))
  .then(renderTeam)
  .catch(() => {
    if (teamEls.grid) {
      teamEls.grid.innerHTML = '<div class="team-empty"><p>Could not load the team list. Try again shortly.</p></div>';
    }
  });
