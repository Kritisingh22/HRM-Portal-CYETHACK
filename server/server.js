/* Boots the server: connect to MongoDB, then listen. */
const app = require('./app');
const cfg = require('./config/env');
const { connectDB } = require('./config/database');

(async () => {
  try {
    await connectDB();
    app.listen(cfg.PORT, () => {
      // eslint-disable-next-line no-console
      console.log('Cyethack HR API + portal running: http://localhost:' + cfg.PORT + '  (' + cfg.NODE_ENV + ')');
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Failed to start:', err.message);
    process.exit(1);
  }
})();
