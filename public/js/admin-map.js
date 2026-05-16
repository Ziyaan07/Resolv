const AdminMap = (function () {
  let map = null;
  let markersLayer = null;
  let markerById = new Map();
  let defaults = null;
  let onSelectCallback = null;

  async function init(onSelect) {
    onSelectCallback = onSelect;
    defaults = await apiRequest('/geocode/defaults');
    map = MapUtils.initBaseMap('admin-map', defaults);
    markersLayer = L.layerGroup().addTo(map);
    // Multiple invalidation calls to ensure map renders correctly
    setTimeout(() => map.invalidateSize(), 100);
    setTimeout(() => map.invalidateSize(), 500);
    setTimeout(() => map.invalidateSize(), 1000);
  }

  function hasCoordinates(incident) {
    return (
      incident.latitude != null &&
      incident.longitude != null &&
      !Number.isNaN(Number(incident.latitude)) &&
      !Number.isNaN(Number(incident.longitude))
    );
  }

  function updateIncidents(incidents) {
    if (!map || !markersLayer) return;

    markersLayer.clearLayers();
    markerById.clear();

    const withCoords = incidents.filter(hasCoordinates);

    if (withCoords.length === 0) {
      if (defaults) {
        map.setView([defaults.latitude, defaults.longitude], defaults.zoom || 16);
      }
      return;
    }

    const bounds = [];

    withCoords.forEach((incident) => {
      const lat = Number(incident.latitude);
      const lng = Number(incident.longitude);
      bounds.push([lat, lng]);

      const marker = L.marker([lat, lng], {
        icon: MapUtils.createMarkerIcon(incident.severity, false),
      });

      const locationText = incident.locationLabel
        ? escapeHtml(incident.locationLabel)
        : `${lat.toFixed(5)}, ${lng.toFixed(5)}`;

      marker.bindPopup(`
        <strong>${escapeHtml(incident.title)}</strong><br>
        <span>${incident.severity} · ${incident.status}</span><br>
        <small>${locationText}</small>
      `);

      marker.on('click', () => {
        if (onSelectCallback) onSelectCallback(incident.id);
        highlightIncident(incident.id);
      });

      marker.addTo(markersLayer);
      markerById.set(incident.id, { marker, incident });
    });

    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 17 });
  }

  function highlightIncident(id) {
    markerById.forEach(({ marker, incident }, incidentId) => {
      marker.setIcon(
        MapUtils.createMarkerIcon(incident.severity, incidentId === id)
      );
    });

    const entry = markerById.get(id);
    if (entry) {
      map.setView(entry.marker.getLatLng(), Math.max(map.getZoom(), 16));
      entry.marker.openPopup();
    }
  }

  function clearHighlight() {
    markerById.forEach(({ marker, incident }) => {
      marker.setIcon(MapUtils.createMarkerIcon(incident.severity, false));
    });
  }

  return {
    init,
    updateIncidents,
    highlightIncident,
    clearHighlight,
    hasCoordinates,
  };
})();
