import { describe, it, expect } from 'vitest';
import { validateData } from '../src/tree-validator.js';
import { DEFAULT_FIELD_MAPPING } from '../src/types.js';

const fm = DEFAULT_FIELD_MAPPING;

describe('validateData', () => {
  it('returns empty-data error for empty array', () => {
    const errors = validateData([], fm);
    expect(errors).toHaveLength(1);
    expect(errors[0].type).toBe('empty-data');
  });

  it('returns empty-data error for null/undefined', () => {
    const errors = validateData(null as unknown as Record<string, unknown>[], fm);
    expect(errors).toHaveLength(1);
    expect(errors[0].type).toBe('empty-data');
  });

  it('returns no errors for valid simple data', () => {
    const data = [
      { id: 1, parent_id: null, nom: 'Root' },
      { id: 2, parent_id: 1, nom: 'Child' },
    ];
    const errors = validateData(data, fm);
    expect(errors).toHaveLength(0);
  });

  it('detects multiple roots', () => {
    const data = [
      { id: 1, parent_id: null, nom: 'Root1' },
      { id: 2, parent_id: null, nom: 'Root2' },
    ];
    const errors = validateData(data, fm);
    expect(errors.some((e) => e.type === 'multiple-roots')).toBe(true);
  });

  it('detects no root', () => {
    const data = [
      { id: 1, parent_id: 2, nom: 'A' },
      { id: 2, parent_id: 1, nom: 'B' },
    ];
    const errors = validateData(data, fm);
    expect(errors.some((e) => e.type === 'no-root')).toBe(true);
  });

  it('detects orphan nodes', () => {
    const data = [
      { id: 1, parent_id: null, nom: 'Root' },
      { id: 2, parent_id: 999, nom: 'Orphan' },
    ];
    const errors = validateData(data, fm);
    expect(errors.some((e) => e.type === 'orphan')).toBe(true);
  });

  it('detects duplicate ids', () => {
    const data = [
      { id: 1, parent_id: null, nom: 'Root' },
      { id: 1, parent_id: null, nom: 'Duplicate' },
    ];
    const errors = validateData(data, fm);
    expect(errors.some((e) => e.type === 'duplicate-id')).toBe(true);
  });

  it('treats empty string parent_id as root', () => {
    const data = [
      { id: 1, parent_id: '', nom: 'Root' },
      { id: 2, parent_id: 1, nom: 'Child' },
    ];
    const errors = validateData(data, fm);
    expect(errors).toHaveLength(0);
  });

  it('treats undefined parent_id as root', () => {
    const data = [
      { id: 1, nom: 'Root' },
      { id: 2, parent_id: 1, nom: 'Child' },
    ];
    const errors = validateData(data, fm);
    expect(errors).toHaveLength(0);
  });

  it('works with string ids', () => {
    const data = [
      { id: 'a', parent_id: null, nom: 'Root' },
      { id: 'b', parent_id: 'a', nom: 'Child' },
    ];
    const errors = validateData(data, fm);
    expect(errors).toHaveLength(0);
  });

  it('detects cycles', () => {
    const data = [
      { id: 1, parent_id: null, nom: 'Root' },
      { id: 2, parent_id: 3, nom: 'A' },
      { id: 3, parent_id: 2, nom: 'B' },
    ];
    // This has orphans (2 and 3 reference each other but neither references root)
    const errors = validateData(data, fm);
    expect(errors.length).toBeGreaterThan(0);
  });
});
