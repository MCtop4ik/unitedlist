import { loadConfig } from './config.js';
import { openDatabase } from './db/database.js';
import { runMigrations } from './db/migrate.js';
import { createApp } from './app.js';
import { LiveCatalog } from './services/live-catalog.js';

const config = loadConfig();
const db = openDatabase(config.DATABASE_PATH);
runMigrations(db);
const catalog = LiveCatalog.fromSnapshot({ ttlMs: config.CATALOG_TTL_MS });
const app = createApp(db, config, catalog);
const server = app.listen(config.PORT, () => {
  console.log(`GD United List backend listening on http://localhost:${config.PORT}`);
});
function shutdown() {
  server.close(() => { db.close(); process.exit(0); });
}
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
