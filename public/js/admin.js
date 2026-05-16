(function () {
  const user = requireAuth(['admin']);
  if (!user) return;

  document.getElementById('user-name').textContent = user.name;
  document.getElementById('logout-btn').addEventListener('click', logout);

  const listEl = document.getElementById('incident-queue');
  const usersListEl = document.getElementById('users-directory');
  const errorEl = document.getElementById('admin-error');
  const severityFilter = document.getElementById('filter-severity');

  function statusClass(status) {
    if (status === 'Pending') return 'badge-pending';
    if (status === 'Investigating') return 'badge-investigating';
    if (status === 'Resolved') return 'badge-resolved';
    return '';
  }

  function severityClass(severity) {
    if (severity === 'Low') return 'badge-low';
    if (severity === 'Medium') return 'badge-medium';
    if (severity === 'High') return 'badge-high';
    if (severity === 'Critical') return 'badge-critical';
    return '';
  }

  function locationLine(incident) {
    const hasCoords = incident.latitude != null && incident.longitude != null
      && !Number.isNaN(Number(incident.latitude)) && !Number.isNaN(Number(incident.longitude));

    if (incident.locationLabel) {
      return `<p class="text-sm text-slate-400 mb-3 flex items-center"><svg class="w-4 h-4 mr-1 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.243-4.243a8 8 0 1111.314 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg> ${escapeHtml(incident.locationLabel)}</p>`;
    }
    if (hasCoords) {
      return `<p class="text-sm text-slate-400 mb-3 flex items-center"><svg class="w-4 h-4 mr-1 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.243-4.243a8 8 0 1111.314 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg> ${Number(incident.latitude).toFixed(5)}, ${Number(incident.longitude).toFixed(5)}</p>`;
    }
    return '<p class="text-sm text-slate-500 italic mb-3">No location pinned</p>';
  }

  function renderLogs(logs) {
    if (!logs || logs.length === 0) return '<p class="text-xs text-slate-500">No status changes yet.</p>';
    const sorted = [...logs].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    return sorted.map(log => `
      <div class="relative pl-4 border-l border-white/10 mt-3 first:mt-0 text-sm">
        <div class="absolute w-2 h-2 rounded-full bg-electric -left-[4.5px] top-1.5 border border-obsidian"></div>
        <p class="text-slate-300"><strong class="text-white">${escapeHtml(log.changedBy)}</strong> updated to <strong>${log.toStatus}</strong></p>
        <p class="text-xs text-slate-500 mt-0.5">${formatDate(log.createdAt)}</p>
        ${log.note ? `<div class="mt-1.5 p-2 bg-slate-900/50 rounded border border-white/5 text-slate-400 italic text-xs">"${escapeHtml(log.note)}"</div>` : ''}
      </div>
    `).join('');
  }

  function renderIncident(incident) {
    const statusOptions = ['Pending', 'Investigating', 'Resolved']
      .map((s) => `<option value="${s}" ${incident.status === s ? 'selected' : ''}>${s}</option>`)
      .join('');

    const hasCoords = incident.latitude != null && incident.longitude != null;
    const mapBtn = hasCoords
      ? `<a href="https://www.openstreetmap.org/?mlat=${incident.latitude}&mlon=${incident.longitude}#map=16/${incident.latitude}/${incident.longitude}" target="_blank" rel="noopener" class="btn-ghost text-xs py-1">View on Map ↗</a>`
      : '';

    return `
      <article class="bg-slate-800/40 border border-white/5 rounded-xl p-5 hover:border-white/10 transition-colors" data-id="${incident.id}">
        <div class="flex justify-between items-start mb-2">
          <h3 class="text-base font-semibold text-white">${escapeHtml(incident.title)}</h3>
          <span class="badge ${statusClass(incident.status)}">${incident.status}</span>
        </div>
        <div class="flex gap-2 mb-3">
          <span class="badge badge-category">${escapeHtml(incident.category)}</span>
          <span class="badge ${severityClass(incident.severity)}">${incident.severity}</span>
        </div>
        ${locationLine(incident)}
        <p class="text-slate-300 text-sm mb-4 leading-relaxed whitespace-pre-wrap">${escapeHtml(incident.description).replace(/\[View File\]\((.*?)\)/g, '<a href="$1" target="_blank" class="text-electric hover:underline ml-2 inline-flex items-center"><svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"></path></svg>View Evidence Attachment</a>')}</p>
        
        <details class="bg-slate-900/30 border border-white/5 rounded-lg overflow-hidden mb-4">
          <summary class="cursor-pointer text-sm font-medium text-slate-300 p-3 hover:bg-slate-800/50 transition-colors flex justify-between items-center">
            <span>Activity Timeline</span>
            <span class="text-xs bg-slate-800 px-2 py-0.5 rounded-full">${incident.incident_logs ? incident.incident_logs.length : 0} updates</span>
          </summary>
          <div class="p-4 border-t border-white/5">
            ${renderLogs(incident.incident_logs)}
          </div>
        </details>

        <div class="flex justify-between items-center pt-4 border-t border-white/5 mt-auto">
          <div class="flex items-center gap-2">
            <div class="w-6 h-6 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-300 border border-white/10">${escapeHtml(incident.reporterName).charAt(0)}</div>
            <div class="text-xs">
              <p class="text-slate-300">${escapeHtml(incident.reporterName)}</p>
              <p class="text-slate-500">${formatDate(incident.createdAt)}</p>
            </div>
          </div>
          <div class="flex items-center gap-3">
            ${mapBtn}
            <select id="status-${incident.id}" class="status-select bg-slate-900 border border-white/10 rounded-md px-2 py-1 text-sm text-slate-300 focus:border-electric" data-id="${incident.id}">
              ${statusOptions}
            </select>
          </div>
        </div>
      </article>
    `;
  }

  function bindListEvents(incidents) {
    listEl.querySelectorAll('.status-select').forEach((select) => {
      select.addEventListener('change', async () => {
        const id = select.dataset.id;
        const status = select.value;
        select.disabled = true;
        try {
          await apiRequest(`/incidents/${id}/status`, {
            method: 'PATCH',
            body: JSON.stringify({ status }),
          });
          await loadIncidents();
        } catch (err) {
          errorEl.textContent = err.message;
          errorEl.classList.remove('hidden');
          await loadIncidents();
        }
      });
    });
  }

  async function loadIncidents() {
    errorEl.classList.add('hidden');
    listEl.innerHTML = '<div class="empty-state">Loading…</div>';

    try {
      const severity = severityFilter.value;
      const path = severity ? `/incidents?severity=${encodeURIComponent(severity)}` : '/incidents';
      const incidents = await apiRequest(path, { expectArray: true });

      // Update KPI cards
      const totalIncidents = incidents.length;
      const criticalHazards = incidents.filter(i => i.severity === 'Critical').length;
      const activeInvestigations = incidents.filter(i => i.status === 'Investigating').length;
      
      let totalResolutionTime = 0;
      let resolvedCount = 0;
      incidents.forEach(i => {
        if (i.status === 'Resolved' && i.createdAt && i.updatedAt) {
          const created = new Date(i.createdAt).getTime();
          const updated = new Date(i.updatedAt).getTime();
          if (updated > created) {
            totalResolutionTime += (updated - created);
            resolvedCount++;
          }
        }
      });
      const avgResolutionTime = resolvedCount > 0 
        ? (totalResolutionTime / resolvedCount / (1000 * 60 * 60)).toFixed(1) + 'h' 
        : '--';

      document.getElementById('kpi-total').textContent = totalIncidents;
      document.getElementById('kpi-critical').textContent = criticalHazards;
      document.getElementById('kpi-active').textContent = activeInvestigations;
      document.getElementById('kpi-avg-time').textContent = avgResolutionTime;

      // Update the Threat Vectors chart
      if (typeof initTrendChart === 'function') {
        initTrendChart(incidents);
      }

      if (incidents.length === 0) {
        listEl.innerHTML = `
          <div class="text-center py-12 px-4">
            <svg class="w-12 h-12 text-slate-700 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
            <p class="text-slate-400 font-medium">No reports match your filters</p>
            <p class="text-slate-500 text-sm mt-1">Incoming employee reports will appear here.</p>
          </div>
        `;

        return;
      }

      listEl.innerHTML = incidents.map(renderIncident).join('');
      bindListEvents(incidents);
      updatePinnedLocations(incidents);
    } catch (err) {
      listEl.innerHTML = '';
      errorEl.textContent = err.message;
      errorEl.classList.remove('hidden');
      if (mapReady) AdminMap.updateIncidents([]);
    }
  }

  severityFilter.addEventListener('change', loadIncidents);
  document.getElementById('refresh-btn').addEventListener('click', loadIncidents);

  async function loadUsers() {
    if (!usersListEl) return;
    try {
      const users = await apiRequest('/auth/users', { expectArray: true });
      if (users.length === 0) {
        usersListEl.innerHTML = '<div class="text-slate-500 text-sm">No personnel found.</div>';
        return;
      }
      
      usersListEl.innerHTML = users.map(u => `
        <div class="p-4 bg-slate-900/50 border border-white/5 rounded-xl flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-300 font-semibold border border-white/10">${escapeHtml(u.name).charAt(0)}</div>
            <div>
              <strong class="block text-sm font-medium text-slate-200">${escapeHtml(u.name)}</strong>
              <span class="text-xs text-slate-500">${escapeHtml(u.email)}</span>
            </div>
          </div>
          <span class="badge ${u.role === 'admin' ? 'badge-critical' : 'badge-category'}">${u.role}</span>
        </div>
      `).join('');
    } catch (err) {
      usersListEl.innerHTML = `<div class="text-red-400 text-sm">Error loading directory: ${escapeHtml(err.message)}</div>`;
    }
  }

  function updatePinnedLocations(incidents) {
    const panel = document.getElementById('pinned-locations-list');
    const countEl = document.getElementById('pinned-count');
    if (!panel) return;

    const pinned = incidents.filter(i => i.latitude != null && i.longitude != null);
    if (countEl) countEl.textContent = `${pinned.length} site${pinned.length !== 1 ? 's' : ''}`;

    if (pinned.length === 0) {
      panel.innerHTML = '<p class="text-slate-500 text-xs italic pt-4 text-center">No location-tagged incidents yet.</p>';
      return;
    }

    const severityDot = (s) => {
      const colors = { Low: '#22c55e', Medium: '#eab308', High: '#f97316', Critical: '#ef4444' };
      return `<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${colors[s]||'#94a3b8'};flex-shrink:0;"></span>`;
    };

    panel.innerHTML = pinned.map(i => `
      <a href="https://www.openstreetmap.org/?mlat=${i.latitude}&mlon=${i.longitude}#map=17/${i.latitude}/${i.longitude}"
         target="_blank" rel="noopener"
         class="flex items-center gap-2 p-2 rounded-lg bg-slate-900/50 border border-white/5 hover:border-electric/40 transition-colors group cursor-pointer">
        ${severityDot(i.severity)}
        <div class="flex-1 min-w-0">
          <p class="text-xs font-medium text-slate-200 truncate">${escapeHtml(i.title)}</p>
          <p class="text-xs text-slate-500 truncate">${i.locationLabel ? escapeHtml(i.locationLabel) : `${Number(i.latitude).toFixed(4)}, ${Number(i.longitude).toFixed(4)}`}</p>
        </div>
        <svg class="w-3 h-3 text-slate-600 group-hover:text-electric shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg>
      </a>
    `).join('');
  }

  function initTrendChart(incidents) {
    const ctx = document.getElementById('trendChart');
    if (!ctx) return;

    // Always destroy any existing chart on this canvas before creating a new one
    const existingChart = Chart.getChart(ctx);
    if (existingChart) {
      existingChart.destroy();
    }
    
    const categories = ['Physical Security', 'IT Security', 'Facilities', 'Other'];
    const categoryCounts = {};
    categories.forEach(c => categoryCounts[c] = 0);
    
    if (incidents) {
      incidents.forEach(i => {
        const cat = categories.includes(i.category) ? i.category : 'Other';
        categoryCounts[cat]++;
      });
    }

    const dataValues = categories.map(c => categoryCounts[c]);
    const allZero = dataValues.every(v => v === 0);

    new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: categories,
        datasets: [{
          data: allZero ? [1, 0, 0, 0] : dataValues,
          backgroundColor: ['#ef4444', '#3b82f6', '#eab308', '#94a3b8'],
          borderWidth: 0,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'right',
            labels: { color: '#94a3b8', font: { family: 'Inter', size: 11 }, boxWidth: 12 }
          },
          tooltip: {
            callbacks: {
              label: (ctx) => allZero ? ' No data yet' : ` ${ctx.label}: ${ctx.parsed}`
            }
          }
        },
        cutout: '70%'
      }
    });
  }

  // Startup
  loadIncidents();
  loadUsers();
})();
