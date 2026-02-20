import { describe, it, expect } from 'vitest';
import { buildTree, flattenTree, getPathToRoot } from '../src/tree-builder.js';
import { DEFAULT_FIELD_MAPPING } from '../src/types.js';

const fm = DEFAULT_FIELD_MAPPING;

describe('buildTree', () => {
  it('builds a simple tree', () => {
    const data = [
      { id: 1, parent_id: null, nom: 'Root', role_type: 'standard' },
      { id: 2, parent_id: 1, nom: 'Child A', role_type: 'standard' },
      { id: 3, parent_id: 1, nom: 'Child B', role_type: 'standard' },
    ];
    const tree = buildTree(data, fm);
    expect(tree.id).toBe(1);
    expect(tree.children).toHaveLength(2);
    expect(tree.depth).toBe(0);
    expect(tree.children[0].depth).toBe(1);
  });

  it('separates assistants from children', () => {
    const data = [
      { id: 1, parent_id: null, nom: 'Root', role_type: 'standard' },
      { id: 2, parent_id: 1, nom: 'Assistant', role_type: 'assistant' },
      { id: 3, parent_id: 1, nom: 'Child', role_type: 'standard' },
    ];
    const tree = buildTree(data, fm);
    expect(tree.assistants).toHaveLength(1);
    expect(tree.children).toHaveLength(1);
    expect(tree.assistants[0].id).toBe(2);
  });

  it('separates transversals from children', () => {
    const data = [
      { id: 1, parent_id: null, nom: 'Root', role_type: 'standard' },
      { id: 2, parent_id: 1, nom: 'Transversal', role_type: 'transversal' },
      { id: 3, parent_id: 1, nom: 'Child', role_type: 'standard' },
    ];
    const tree = buildTree(data, fm);
    expect(tree.transversals).toHaveLength(1);
    expect(tree.children).toHaveLength(1);
    expect(tree.transversals[0].id).toBe(2);
  });

  it('sorts children by order field', () => {
    const data = [
      { id: 1, parent_id: null, nom: 'Root', role_type: 'standard' },
      { id: 2, parent_id: 1, nom: 'B', role_type: 'standard', ordre: 3 },
      { id: 3, parent_id: 1, nom: 'A', role_type: 'standard', ordre: 1 },
      { id: 4, parent_id: 1, nom: 'C', role_type: 'standard', ordre: 2 },
    ];
    const tree = buildTree(data, fm);
    expect(tree.children[0].id).toBe(3);
    expect(tree.children[1].id).toBe(4);
    expect(tree.children[2].id).toBe(2);
  });

  it('calculates isLeaf correctly', () => {
    const data = [
      { id: 1, parent_id: null, nom: 'Root', role_type: 'standard' },
      { id: 2, parent_id: 1, nom: 'Child', role_type: 'standard' },
      { id: 3, parent_id: 2, nom: 'Grandchild', role_type: 'standard' },
    ];
    const tree = buildTree(data, fm);
    expect(tree.isLeaf).toBe(false);
    expect(tree.children[0].isLeaf).toBe(false);
    expect(tree.children[0].children[0].isLeaf).toBe(true);
  });

  it('handles deep hierarchies', () => {
    const data = [
      { id: 1, parent_id: null, nom: 'Level 0', role_type: 'standard' },
      { id: 2, parent_id: 1, nom: 'Level 1', role_type: 'standard' },
      { id: 3, parent_id: 2, nom: 'Level 2', role_type: 'standard' },
      { id: 4, parent_id: 3, nom: 'Level 3', role_type: 'standard' },
    ];
    const tree = buildTree(data, fm);
    expect(tree.depth).toBe(0);
    expect(tree.children[0].depth).toBe(1);
    expect(tree.children[0].children[0].depth).toBe(2);
    expect(tree.children[0].children[0].children[0].depth).toBe(3);
  });

  it('throws on invalid data', () => {
    const data = [
      { id: 1, parent_id: null, nom: 'Root' },
      { id: 1, parent_id: null, nom: 'Duplicate' },
    ];
    expect(() => buildTree(data, fm)).toThrow();
  });

  it('handles string ids', () => {
    const data = [
      { id: 'root', parent_id: null, nom: 'Root', role_type: 'standard' },
      { id: 'child1', parent_id: 'root', nom: 'Child 1', role_type: 'standard' },
    ];
    const tree = buildTree(data, fm);
    expect(tree.id).toBe('root');
    expect(tree.children[0].id).toBe('child1');
  });
});

describe('flattenTree', () => {
  it('returns all nodes in the tree', () => {
    const data = [
      { id: 1, parent_id: null, nom: 'Root', role_type: 'standard' },
      { id: 2, parent_id: 1, nom: 'Child', role_type: 'standard' },
      { id: 3, parent_id: 1, nom: 'Assistant', role_type: 'assistant' },
      { id: 4, parent_id: 2, nom: 'Grandchild', role_type: 'standard' },
    ];
    const tree = buildTree(data, fm);
    const flat = flattenTree(tree);
    expect(flat).toHaveLength(4);
    expect(flat.map((n) => n.id).sort()).toEqual([1, 2, 3, 4]);
  });
});

describe('getPathToRoot', () => {
  it('returns path from leaf to root', () => {
    const data = [
      { id: 1, parent_id: null, nom: 'Root', role_type: 'standard' },
      { id: 2, parent_id: 1, nom: 'Child', role_type: 'standard' },
      { id: 3, parent_id: 2, nom: 'Grandchild', role_type: 'standard' },
    ];
    const tree = buildTree(data, fm);
    const path = getPathToRoot(tree, 3);
    expect(path.has(1)).toBe(true);
    expect(path.has(2)).toBe(true);
    expect(path.has(3)).toBe(true);
  });

  it('returns just root for root id', () => {
    const data = [
      { id: 1, parent_id: null, nom: 'Root', role_type: 'standard' },
      { id: 2, parent_id: 1, nom: 'Child', role_type: 'standard' },
    ];
    const tree = buildTree(data, fm);
    const path = getPathToRoot(tree, 1);
    expect(path.has(1)).toBe(true);
    expect(path.has(2)).toBe(false);
  });

  it('returns empty set for non-existent id', () => {
    const data = [
      { id: 1, parent_id: null, nom: 'Root', role_type: 'standard' },
    ];
    const tree = buildTree(data, fm);
    const path = getPathToRoot(tree, 999);
    expect(path.size).toBe(0);
  });

  it('includes path through assistants', () => {
    const data = [
      { id: 1, parent_id: null, nom: 'Root', role_type: 'standard' },
      { id: 2, parent_id: 1, nom: 'Assistant', role_type: 'assistant' },
    ];
    const tree = buildTree(data, fm);
    const path = getPathToRoot(tree, 2);
    expect(path.has(1)).toBe(true);
    expect(path.has(2)).toBe(true);
  });
});
