import { loadConfig } from '../config.js';
import { LiveCatalog } from '../services/live-catalog.js';
loadConfig();
try {
  const catalog = LiveCatalog.fromSnapshot();
  const levels = await catalog.refreshNow();
  console.log('Refresh complete:', { levels: levels.length });
} catch (error) {
  console.error('Refresh failed; previous catalog retained:', error instanceof Error ? error.message : error);
  process.exitCode = 1;
}
