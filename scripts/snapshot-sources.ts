import { writeCatalogSnapshot } from './lib/catalog-snapshot';

const counts = await writeCatalogSnapshot();
console.log(`Snapshot: ${counts.pointercrate} PC, ${counts.aredl} AREDL, ${counts.gddl} GDDL, ${counts.levels} total.`);
