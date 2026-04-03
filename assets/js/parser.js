// parser.js — parse once, shared helpers
window.REPORT = null;

window.parseReport = function (html, filename) {
  const doc = (new DOMParser()).parseFromString(html, 'text/html');

  const metaParts = Array.from(doc.querySelectorAll('.nav-right .badge-primary')).map(b => b.textContent.trim());
  const meta = metaParts.join('  ·  ') || filename;

  const tests = [];
  // Strictly scope to the test-list-wrapper to avoid sidebar dropdown items
  const testListWrapper = doc.querySelector('.test-list-wrapper');
  if (!testListWrapper) return window.REPORT = { meta, tests };
  testListWrapper.querySelectorAll('ul.test-list-item > li.test-item').forEach(li => {
    const name     = li.querySelector('.test-detail .name')?.textContent.trim() || '—';
    const rawStatus = (li.getAttribute('status') || '').toLowerCase().trim();
    const status   = ['pass','fail','skip'].includes(rawStatus) ? rawStatus : 'skip';
    const author   = (li.getAttribute('author') || '').trim();
    const tag      = (li.getAttribute('tag') || '').trim();
    const spans    = li.querySelectorAll('.text-sm span');
    const time     = spans[0]?.textContent.trim() || '';
    const duration = spans[1]?.textContent.trim() || '';

    const steps = [];
    li.querySelectorAll('.event-row').forEach(row => {
      const cells = row.querySelectorAll('td');
      if (cells.length < 3) return;
      const stepStatus = cells[0].querySelector('.badge')?.textContent.trim().toLowerCase() || '';
      const ts         = cells[1]?.textContent.trim() || '';
      const textarea   = cells[2].querySelector('textarea');
      const detail     = textarea ? textarea.value.trim() : cells[2]?.textContent.trim() || '';
      // Extract screenshot filename if present
      const imgEl      = cells[2].querySelector('img[src]');
      const screenshot = imgEl ? imgEl.getAttribute('src').split('/').pop() : null;
      steps.push({ stepStatus, ts, detail, hasCode: !!textarea, screenshot });
    });

    tests.push({ name, status, author, tag, time, duration, steps });
  });

  window.REPORT = { meta, tests };
  return window.REPORT;
};

// ── Shared helpers ──────────────────────────────────────────────────────────

window.escHtml = s => String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');

window.hlText = (text, q) => {
  if (!q) return text;
  const re = new RegExp(`(${q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  return text.replace(re, '<mark>$1</mark>');
};

// Export visible tests to CSV
window.exportCSV = function (tests, filename) {
  const rows = [['Test Name','Status','Author','Tag','Start Time','Duration']];
  tests.forEach(t => rows.push([
    `"${t.name.replace(/"/g,'""')}"`,
    t.status, t.author, t.tag, t.time, t.duration
  ]));
  const blob = new Blob([rows.map(r => r.join(',')).join('\n')], { type: 'text/csv' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename || 'report-export.csv';
  a.click();
};

// Build pie chart (larger, centered)
window.buildPie = function (pass, fail, skip, containerEl) {
  const total = pass + fail + skip || 1;
  const pct   = Math.round((pass / total) * 100);
  const r = 70, cx = 90, cy = 90, circ = 2 * Math.PI * r;

  const slices = [
    { val: pass, color: '#22c55e' },
    { val: fail, color: '#ef4444' },
    { val: skip, color: '#f59e0b' },
  ];
  let offset = 0;
  const paths = slices.map(s => {
    const len = (s.val / total) * circ;
    const el  = `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${s.color}" stroke-width="20" stroke-dasharray="${len} ${circ - len}" stroke-dashoffset="${-offset}" />`;
    offset += len;
    return el;
  }).join('');

  containerEl.innerHTML = `
    <div class="pie-wrap">
      <svg viewBox="0 0 180 180">
        <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="var(--border)" stroke-width="20"/>
        ${paths}
      </svg>
      <div class="pie-center">
        <span class="pct-big">${pct}%</span>
        <span class="pct-sub">passed</span>
      </div>
    </div>
    <div class="legend">
      <div class="legend-item"><span class="legend-dot" style="background:#22c55e"></span><span>Pass</span><strong style="margin-left:6px">${pass}</strong></div>
      <div class="legend-item"><span class="legend-dot" style="background:#ef4444"></span><span>Fail</span><strong style="margin-left:6px">${fail}</strong></div>
      <div class="legend-item"><span class="legend-dot" style="background:#f59e0b"></span><span>Skip</span><strong style="margin-left:6px">${skip}</strong></div>
      <div class="legend-item"><span class="legend-dot" style="background:var(--accent)"></span><span>Total</span><strong style="margin-left:6px">${pass+fail+skip}</strong></div>
    </div>`;
};

// Build a group card (grid view)
window.buildGroupCard = function (icon, label, d, onClick) {
  const tot = d.tests.length;
  const pct = Math.round(((d.pass || 0) / tot) * 100);
  const card = document.createElement('div');
  card.className = 'group-card';
  card.innerHTML = `
    <h3>${icon} ${escHtml(label)}</h3>
    <div class="group-stats">
      <span class="stat-pill total">${tot} total</span>
      <span class="stat-pill pass">${d.pass||0} pass</span>
      <span class="stat-pill fail">${d.fail||0} fail</span>
      <span class="stat-pill skip">${d.skip||0} skip</span>
    </div>
    <div class="progress-bar"><div class="progress-fill" style="width:${pct}%"></div></div>
    <div class="pct-label">${pct}% pass rate</div>`;
  card.addEventListener('click', onClick);
  return card;
};

// Shared renderDetail — frozen header + scrollable steps body
window.renderDetail = function (container, t, q) {
  const stepsHtml = t.steps.length ? `
    <table class="steps-table">
      <thead><tr>
        <th style="width:76px">Status</th>
        <th style="width:86px">Time</th>
        <th>Details</th>
      </tr></thead>
      <tbody>${t.steps.map(s => {
        const d = s.hasCode
          ? `<div class="step-detail">${hlText(escHtml(s.detail.split('\n')[0]), q)}<pre>${escHtml(s.detail)}</pre></div>`
          : `<div class="step-detail">${hlText(escHtml(s.detail), q)}</div>`;
        const screenshotHtml = s.screenshot && window.SCREENSHOTS && window.SCREENSHOTS[s.screenshot]
          ? `<div class="step-screenshot"><img src="${window.SCREENSHOTS[s.screenshot]}" loading="lazy" alt="screenshot" onclick="window.openScreenshot(this.src)"></div>`
          : '';
        return `<tr>
          <td><span class="step-badge ${s.stepStatus}">${s.stepStatus||'—'}</span></td>
          <td style="color:var(--muted);font-size:.72rem;white-space:nowrap">${s.ts}</td>
          <td>${d}${screenshotHtml}</td>
        </tr>`;
      }).join('')}</tbody>
    </table>` : `<p style="padding:16px;color:var(--muted);font-size:.82rem">No step details available.</p>`;

  // Frozen header + scrollable body
  container.innerHTML = `
    <div class="split-right-header">
      <h2>${hlText(escHtml(t.name), q)}</h2>
      <div class="detail-chips">
        <span class="badge-status ${t.status}">${t.status}</span>
        ${t.author   ? `<span class="chip author">👤 ${escHtml(t.author)}</span>` : ''}
        ${t.tag      ? `<span class="chip tag">🏷 ${escHtml(t.tag)}</span>`       : ''}
        ${t.time     ? `<span class="chip">⏱ ${t.time}</span>`                    : ''}
        ${t.duration ? `<span class="chip">${t.duration}</span>`                  : ''}
      </div>
    </div>
    <div class="split-right-body">${stepsHtml}</div>`;
};
// Build a group list row (list view)
window.buildGroupRow = function (icon, label, d, onClick) {
  const tot = d.tests.length;
  const pct = Math.round(((d.pass || 0) / tot) * 100);
  const row = document.createElement('div');
  row.className = 'group-list-row';
  row.innerHTML = `
    <span class="glr-name">${icon} ${escHtml(label)}</span>
    <div class="glr-stats">
      <span class="stat-pill total">${tot}</span>
      <span class="stat-pill pass">${d.pass||0} ✓</span>
      <span class="stat-pill fail">${d.fail||0} ✗</span>
      <span class="stat-pill skip">${d.skip||0} ⊘</span>
      <span class="stat-pill" style="background:rgba(167,139,250,.1);color:#a78bfa">${pct}%</span>
    </div>`;
  row.addEventListener('click', onClick);
  return row;
};
