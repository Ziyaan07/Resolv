const { createApp } = require('./src/app');

// Vercel expects a single exported function for Express apps
const app = createApp();

module.exports = app;
