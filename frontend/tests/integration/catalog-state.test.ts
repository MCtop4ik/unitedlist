import { describe, expect, it } from 'vitest';
import { catalogQuery, readCatalogState } from '../../src/lib/url-state/catalog';

describe('catalog URL state', () => {
  it('round-trips zone, filters, sort, and page', () => {
    const params = new URLSearchParams('zone=pointercrate&division=extended&q=gri&difficulty=Extreme&length=xl&status=completed&sort=name&page=3');
    const state = readCatalogState(params);
    const query = catalogQuery(state);
    expect(query.get('zone')).toBe('pointercrate');
    expect(query.get('division')).toBe('extended');
    expect(query.get('q')).toBe('gri');
    expect(query.get('difficulty')).toBe('Extreme');
    expect(query.get('length')).toBe('xl');
    expect(query.get('status')).toBe('completed');
    expect(query.get('sort')).toBe('name');
    expect(query.get('page')).toBe('3');
  });
});
