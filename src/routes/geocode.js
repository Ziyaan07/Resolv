const express = require('express');
const {
  campusDefaultLat,
  campusDefaultLng,
  campusDefaultZoom,
  nominatimUserAgent,
} = require('../config');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

const NOMINATIM_BASE = 'https://nominatim.openstreetmap.org';
let lastNominatimRequest = 0;
const MIN_INTERVAL_MS = 1100;

async function throttleNominatim() {
  const now = Date.now();
  const wait = Math.max(0, MIN_INTERVAL_MS - (now - lastNominatimRequest));
  if (wait > 0) {
    await new Promise((resolve) => setTimeout(resolve, wait));
  }
  lastNominatimRequest = Date.now();
}

async function nominatimFetch(path, params) {
  await throttleNominatim();
  const url = new URL(path, NOMINATIM_BASE);
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.set(key, value);
  });

  const response = await fetch(url.toString(), {
    headers: {
      'User-Agent': `PEIO/1.0 (${nominatimUserAgent})`,
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Geocoding service unavailable');
  }

  return response.json();
}

router.get('/defaults', (_req, res) => {
  res.json({
    latitude: campusDefaultLat,
    longitude: campusDefaultLng,
    zoom: campusDefaultZoom,
  });
});

router.use(authenticate);

router.get('/search', async (req, res) => {
  const q = req.query.q?.trim();
  if (!q || q.length < 3) {
    return res.status(400).json({ error: 'Search query must be at least 3 characters' });
  }

  try {
    const results = await nominatimFetch('/search', {
      q,
      format: 'json',
      limit: '5',
      addressdetails: '1',
    });

    res.json(
      results.map((item) => ({
        latitude: parseFloat(item.lat),
        longitude: parseFloat(item.lon),
        label: item.display_name,
      }))
    );
  } catch {
    res.status(502).json({ error: 'Could not search locations. Try again shortly.' });
  }
});

router.get('/reverse', async (req, res) => {
  const lat = parseFloat(req.query.lat);
  const lon = parseFloat(req.query.lon);

  if (Number.isNaN(lat) || Number.isNaN(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180) {
    return res.status(400).json({ error: 'Invalid coordinates' });
  }

  try {
    const results = await nominatimFetch('/reverse', {
      lat: String(lat),
      lon: String(lon),
      format: 'json',
    });

    res.json({
      latitude: lat,
      longitude: lon,
      label: results.display_name || `${lat.toFixed(5)}, ${lon.toFixed(5)}`,
    });
  } catch {
    res.status(502).json({ error: 'Could not resolve address for this point.' });
  }
});

module.exports = router;
