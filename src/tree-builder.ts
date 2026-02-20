import type { FieldMapping, OrgNode } from './types.js';
import { validateData } from './tree-validator.js';

/**
 * Construit un arbre hiérarchique (OrgNode) à partir de données tabulaires plates.
 * Lance une erreur si les données sont invalides.
 */
export function buildTree(
  records: Record<string, unknown>[],
  fieldMapping: FieldMapping
): OrgNode {
  // Valider les données
  const errors = validateData(records, fieldMapping);
  if (errors.length > 0) {
    const errorMessages = errors.map((e) => e.message).join(' | ');
    throw new Error(errorMessages);
  }

  const idField = fieldMapping.id;
  const parentField = fieldMapping.parent;
  const roleTypeField = fieldMapping.roleType;
  const orderField = fieldMapping.order;

  // 1. Créer une Map id → noeud
  const nodeMap = new Map<string | number, OrgNode>();
  for (const record of records) {
    const id = record[idField] as string | number;
    nodeMap.set(id, {
      id,
      parentId: (record[parentField] as string | number | null) ?? null,
      data: record,
      children: [],
      assistants: [],
      transversals: [],
      depth: 0,
      isLeaf: true,
    });
  }

  // 2. Construire les relations parent-enfant
  let root: OrgNode | null = null;
  for (const node of nodeMap.values()) {
    if (node.parentId === null || node.parentId === undefined || node.parentId === '') {
      root = node;
    } else {
      const parent = nodeMap.get(node.parentId);
      if (!parent) {
        throw new Error(`Parent ${node.parentId} introuvable pour le noeud ${node.id}`);
      }

      const roleType = (node.data[roleTypeField] as string) || 'standard';
      if (roleType === 'assistant') {
        parent.assistants.push(node);
      } else if (roleType === 'transversal') {
        parent.transversals.push(node);
      } else {
        parent.children.push(node);
      }
      parent.isLeaf = false;
    }
  }

  if (!root) {
    throw new Error('Aucun noeud racine trouvé.');
  }

  // 3. Calculer les profondeurs
  function setDepth(node: OrgNode, depth: number): void {
    node.depth = depth;
    for (const child of [...node.assistants, ...node.transversals, ...node.children]) {
      setDepth(child, depth + 1);
    }
  }
  setDepth(root, 0);

  // 4. Trier les enfants par ordre
  function sortChildren(node: OrgNode): void {
    if (orderField) {
      const sortFn = (a: OrgNode, b: OrgNode) =>
        (Number(a.data[orderField]) || 0) - (Number(b.data[orderField]) || 0);
      node.children.sort(sortFn);
      node.assistants.sort(sortFn);
      node.transversals.sort(sortFn);
    }
    for (const child of [...node.children, ...node.assistants, ...node.transversals]) {
      sortChildren(child);
    }
  }
  sortChildren(root);

  // 5. Mettre à jour isLeaf correctement
  function updateLeafStatus(node: OrgNode): void {
    node.isLeaf =
      node.children.length === 0 &&
      node.assistants.length === 0 &&
      node.transversals.length === 0;
    for (const child of [...node.children, ...node.assistants, ...node.transversals]) {
      updateLeafStatus(child);
    }
  }
  updateLeafStatus(root);

  return root;
}

/**
 * Collecte tous les noeuds de l'arbre dans un tableau plat.
 */
export function flattenTree(root: OrgNode): OrgNode[] {
  const result: OrgNode[] = [];
  function walk(node: OrgNode): void {
    result.push(node);
    for (const a of node.assistants) walk(a);
    for (const t of node.transversals) walk(t);
    for (const c of node.children) walk(c);
  }
  walk(root);
  return result;
}

/**
 * Trouve le chemin de la racine jusqu'au noeud donné.
 * Retourne un Set d'ids constituant le chemin.
 */
export function getPathToRoot(
  root: OrgNode,
  targetId: string | number
): Set<string | number> {
  const path = new Set<string | number>();

  function find(node: OrgNode): boolean {
    if (node.id === targetId) {
      path.add(node.id);
      return true;
    }
    const allChildren = [...node.assistants, ...node.transversals, ...node.children];
    for (const child of allChildren) {
      if (find(child)) {
        path.add(node.id);
        return true;
      }
    }
    return false;
  }

  find(root);
  return path;
}
