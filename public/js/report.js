(function () {
  const user = requireAuth(['employee']);
  if (!user) return;

  document.getElementById('user-name').textContent = user.name;
  document.getElementById('logout-btn').addEventListener('click', logout);

  const form = document.getElementById('incident-form');
  const successEl = document.getElementById('form-success');
  const errorEl = document.getElementById('form-error');
  const listEl = document.getElementById('my-incidents');

  function locationLine(incident) {
    if (incident.locationLabel) {
      return `<p class="text-sm text-slate-400 mb-2 flex items-center"><svg class="w-4 h-4 mr-1 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.243-4.243a8 8 0 1111.314 0z"></path></svg> ${escapeHtml(incident.locationLabel)}</p>`;
    }
    if (incident.latitude != null && incident.longitude != null) {
      return `<p class="text-sm text-slate-400 mb-2 flex items-center"><svg class="w-4 h-4 mr-1 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.243-4.243a8 8 0 1111.314 0z"></path></svg> ${Number(incident.latitude).toFixed(5)}, ${Number(incident.longitude).toFixed(5)}</p>`;
    }
    return '';
  }

  function renderIncident(incident) {
    return `
      <article class="glass-card p-5">
        <div class="flex justify-between items-start mb-2">
          <h4 class="text-lg font-semibold text-white">${escapeHtml(incident.title)}</h4>
          <span class="badge ${statusClass(incident.status)}">${incident.status}</span>
        </div>
        <div class="flex gap-2 mb-3">
          <span class="badge badge-category">${escapeHtml(incident.category)}</span>
          <span class="badge ${severityClass(incident.severity)}">${incident.severity}</span>
        </div>
        ${locationLine(incident)}
        <p class="text-slate-300 text-sm mt-3 leading-relaxed whitespace-pre-wrap">${escapeHtml(incident.description).replace(/\[View File\]\((.*?)\)/g, '<a href="$1" target="_blank" class="text-electric hover:underline ml-2 inline-flex items-center"><svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"></path></svg>View Evidence Attachment</a>')}</p>
        <div class="mt-4 pt-3 border-t border-white/5 text-xs text-slate-500">
          Transmitted on ${formatDate(incident.createdAt)}
        </div>
      </article>
    `;
  }

  async function loadIncidents() {
    try {
      const incidents = await apiRequest('/incidents', { expectArray: true });
      if (incidents.length === 0) {
        listEl.innerHTML = `
          <div class="text-center py-10 glass-card">
            <svg class="w-12 h-12 text-slate-700 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
            <p class="text-slate-400 font-medium">No records found</p>
            <p class="text-slate-500 text-sm mt-1">Submit your first hazard report using the system above.</p>
          </div>
        `;
        return;
      }
      listEl.innerHTML = incidents.map(renderIncident).join('');
    } catch (err) {
      listEl.innerHTML = `<div class="empty-state"><p>${escapeHtml(err.message)}</p></div>`;
    }
  }

  // Setup drag and drop for file upload
  const dropzone = document.getElementById('dropzone');
  const fileInput = document.getElementById('evidence-upload');
  const dropzoneText = document.getElementById('dropzone-text');

  if (dropzone && fileInput) {
    dropzone.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', () => {
      if (fileInput.files.length > 0) {
        dropzoneText.textContent = `Selected: ${fileInput.files[0].name}`;
        dropzone.classList.add('border-electric');
      } else {
        dropzoneText.textContent = 'Drag and drop files here, or click to browse';
        dropzone.classList.remove('border-electric');
      }
    });
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    successEl.classList.add('hidden');
    errorEl.classList.add('hidden');

    const category = document.getElementById('category').value;
    const locationError = MapPicker.validateForCategory(category);
    if (locationError) {
      errorEl.textContent = locationError;
      errorEl.classList.remove('hidden');
      return;
    }

    const picked = MapPicker.getLocation();
    
    // Convert to FormData to support file upload
    const formData = new FormData();
    formData.append('title', document.getElementById('title').value);
    formData.append('category', category);
    formData.append('severity', document.getElementById('severity').value);
    formData.append('description', document.getElementById('description').value);
    
    if (fileInput && fileInput.files.length > 0) {
      formData.append('evidence', fileInput.files[0]);
    }

    if (picked) {
      formData.append('latitude', picked.latitude);
      formData.append('longitude', picked.longitude);
      formData.append('locationLabel', picked.locationLabel);
    }

    const submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Transmitting...';

    try {
      const token = localStorage.getItem('peio_token');
      const res = await fetch('/api/incidents', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData,
      });

      const data = await res.text();
      let parsed;
      try { parsed = JSON.parse(data); } catch { parsed = null; }

      if (!res.ok) {
        throw new Error(parsed?.error || 'Request failed');
      }

      form.reset();
      if (dropzoneText) dropzoneText.textContent = 'Drag and drop files here, or click to browse';
      if (dropzone) dropzone.classList.remove('border-electric');
      MapPicker.reset();
      document.getElementById('category').dispatchEvent(new Event('change'));
      successEl.textContent = 'Intel report securely transmitted with evidence.';
      successEl.classList.remove('hidden');
      await loadIncidents();
    } catch (err) {
      errorEl.textContent = err.message;
      errorEl.classList.remove('hidden');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = originalText;
    }
  });

  MapPicker.init().catch((err) => {
    errorEl.textContent = err.message || 'Could not load map.';
    errorEl.classList.remove('hidden');
  });

  loadIncidents();
})();
