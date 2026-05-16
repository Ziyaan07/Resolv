const { createApp } = require('./app');
const { port } = require('./config');
const store = require('./data/store');

async function start() {
  store.load();
  await store.seedDefaults();

  const app = createApp();

  app.listen(port, () => {
    console.log(`PEIO server running at http://localhost:${port}`);
    console.log('Demo accounts (password: password123):');
    console.log('  Employee: employee@company.com');
    console.log('  Security team: security@company.com');
  });
}

start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
