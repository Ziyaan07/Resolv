require('dotenv').config();

module.exports = {
  port: process.env.PORT || 3001,
  jwtSecret: process.env.JWT_SECRET || 'peio-dev-secret-change-in-production',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '8h',
  campusDefaultLat: parseFloat(process.env.CAMPUS_DEFAULT_LAT, 10) || 40.758,
  campusDefaultLng: parseFloat(process.env.CAMPUS_DEFAULT_LNG, 10) || -73.9855,
  campusDefaultZoom: parseInt(process.env.CAMPUS_DEFAULT_ZOOM, 10) || 16,
  nominatimUserAgent:
    process.env.NOMINATIM_CONTACT_EMAIL || 'peio-incident-app@localhost',
};
