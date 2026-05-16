const express = require('express');
const cors = require('cors');
const path = require('path');
const authRoutes = require('./routes/auth');
const incidentRoutes = require('./routes/incidents');
const geocodeRoutes = require('./routes/geocode');

function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json());
  app.use(express.static(path.join(__dirname, '../public')));

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', service: 'Resolv' });
  });

  app.use('/api/auth', authRoutes);
  app.use('/api/incidents', incidentRoutes);
  app.use('/api/geocode', geocodeRoutes);

  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    if (req.accepts('html')) {
      return res.sendFile(path.join(__dirname, '../public/index.html'));
    }
    next();
  });

  app.use((_req, res) => {
    res.status(404).json({ error: 'Not found' });
  });

  return app;
}

module.exports = { createApp };
