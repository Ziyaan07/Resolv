const MapPicker = (function () {
  const LOCATION_REQUIRED = ['Physical Security', 'Facilities'];

  let map = null;
  let marker = null;
  let defaults = null;
  let location = null;
  let searchTimeout = null;

  async function loadDefaults() {
    return apiRequest('/geocode/defaults');
  }

  function setLocation(lat, lng, label) {
    location = {
      latitude: lat,
      longitude: lng,
      locationLabel: label || `${lat.toFixed(5)}, ${lng.toFixed(5)}`,
    };

    document.getElementById('latitude').value = lat;
    document.getElementById('longitude').value = lng;
    document.getElementById('location-label').value = location.locationLabel;

    const labelEl = document.getElementById('location-display');
    if (labelEl) {
      labelEl.textContent = location.locationLabel;
      labelEl.classList.remove('hidden');
    }

    if (!marker) {
      marker = L.marker([lat, lng], { icon: MapUtils.createPickerIcon() }).addTo(map);
    } else {
      marker.setLatLng([lat, lng]);
    }
    map.setView([lat, lng], Math.max(map.getZoom(), 16));
  }

  async function reverseGeocode(lat, lng) {
    try {
      const result = await apiRequest(
        `/geocode/reverse?lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lng)}`
      );
      return result.label;
    } catch {
      return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
    }
  }

  async function onMapClick(e) {
    const { lat, lng } = e.latlng;
    const label = await reverseGeocode(lat, lng);
    setLocation(lat, lng, label);
  }

  function updateRequiredUI(category) {
    const required = LOCATION_REQUIRED.includes(category);
    const section = document.getElementById('location-section');
    const hint = document.getElementById('location-hint');
    const optionalTag = document.getElementById('location-optional-tag');

    if (section) {
      section.classList.toggle('location-required', required);
    }
    if (hint) {
      hint.textContent = required
        ? 'Required for this category — click the map or search for a place.'
        : 'Optional — mark where the issue occurred if it helps the response team.';
    }
    if (optionalTag) {
      optionalTag.classList.toggle('hidden', required);
    }
  }

  async function runSearch(query) {
    const resultsEl = document.getElementById('geocode-results');
    if (!resultsEl) return;

    resultsEl.innerHTML = '<p class="geocode-loading">Searching…</p>';
    resultsEl.classList.remove('hidden');

    try {
      const results = await apiRequest(
        `/geocode/search?q=${encodeURIComponent(query)}`,
        { expectArray: true }
      );

      if (!results.length) {
        resultsEl.innerHTML = '<p class="geocode-empty">No places found. Try a different search.</p>';
        return;
      }

      resultsEl.innerHTML = results
        .map(
          (r, i) => `
          <button type="button" class="geocode-result" data-index="${i}">
            ${escapeHtml(r.label)}
          </button>
        `
        )
        .join('');

      results.forEach((r, i) => {
        resultsEl.querySelector(`[data-index="${i}"]`).addEventListener('click', () => {
          setLocation(r.latitude, r.longitude, r.label);
          resultsEl.classList.add('hidden');
          document.getElementById('location-search').value = r.label;
        });
      });
    } catch (err) {
      resultsEl.innerHTML = `<p class="geocode-empty">${escapeHtml(err.message)}</p>`;
    }
  }

  function useMyLocation() {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        const label = await reverseGeocode(lat, lng);
        setLocation(lat, lng, label);
      },
      () => alert('Could not get your location. Please click the map instead.')
    );
  }

  async function init() {
    defaults = await loadDefaults();
    map = MapUtils.initBaseMap('report-map', defaults);
    map.on('click', onMapClick);

    const categoryEl = document.getElementById('category');
    if (categoryEl) {
      categoryEl.addEventListener('change', () => updateRequiredUI(categoryEl.value));
      updateRequiredUI(categoryEl.value);
    }

    const searchInput = document.getElementById('location-search');
    if (searchInput) {
      searchInput.addEventListener('input', () => {
        clearTimeout(searchTimeout);
        const q = searchInput.value.trim();
        if (q.length < 3) {
          document.getElementById('geocode-results')?.classList.add('hidden');
          return;
        }
        searchTimeout = setTimeout(() => runSearch(q), 400);
      });
    }

    document.getElementById('use-my-location')?.addEventListener('click', useMyLocation);

    setTimeout(() => map.invalidateSize(), 100);
  }

  function getLocation() {
    return location;
  }

  function isLocationRequired(category) {
    return LOCATION_REQUIRED.includes(category);
  }

  function validateForCategory(category) {
    if (!isLocationRequired(category)) return null;
    if (!location) {
      return 'Please mark the hazard location on the map.';
    }
    return null;
  }

  function reset() {
    location = null;
    if (marker) {
      map.removeLayer(marker);
      marker = null;
    }
    document.getElementById('latitude').value = '';
    document.getElementById('longitude').value = '';
    document.getElementById('location-label').value = '';
    document.getElementById('location-display')?.classList.add('hidden');
    document.getElementById('location-search').value = '';
    document.getElementById('geocode-results')?.classList.add('hidden');
    if (defaults) {
      map.setView([defaults.latitude, defaults.longitude], defaults.zoom || 16);
    }
  }

  return {
    init,
    getLocation,
    validateForCategory,
    isLocationRequired,
    reset,
  };
})();
