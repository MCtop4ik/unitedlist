import { writeCatalogSnapshot } from './lib/catalog-snapshot';

const counts = await writeCatalogSnapshot();
console.log(`Refreshed ${counts.pointercrate} PC, ${counts.aredl} AREDL, ${counts.gddl} GDDL (${counts.levels} total).`);
