const MapUtils = (function () {
  const SEVERITY_COLORS = {
    Low: '#22c55e',
    Medium: '#eab308',
    High: '#f97316',
    Critical: '#ef4444',
  };

  function severityColor(severity) {
    return SEVERITY_COLORS[severity] || '#3b82f6';
  }

  function createMarkerIcon(severity, highlighted) {
    const color = severityColor(severity);
    const size = highlighted ? 36 : 28;
    const border = highlighted ? 3 : 2;
    const html = `<div style="
      background:${color};
      width:${size}px;height:${size}px;
      border-radius:50%;
      border:${border}px solid #fff;
      box-shadow:0 2px 8px rgba(0,0,0,0.45);
    "></div>`;

    return L.divIcon({
      className: 'peio-marker',
      html,
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2],
    });
  }

  function createPickerIcon() {
    return L.divIcon({
      className: 'peio-marker',
      html: `<div style="
        background:#3b82f6;
        width:32px;height:32px;
        border-radius:50%;
        border:3px solid #fff;
        box-shadow:0 2px 8px rgba(0,0,0,0.45);
      "></div>`,
      iconSize: [32, 32],
      iconAnchor: [16, 16],
    });
  }

  function initBaseMap(containerId, defaults) {
    const map = L.map(containerId, {
      center: [defaults.latitude, defaults.longitude],
      zoom: defaults.zoom || 16,
      scrollWheelZoom: true,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);

    return map;
  }

  return {
    severityColor,
    createMarkerIcon,
    createPickerIcon,
    initBaseMap,
  };
})();
