import type { FieldMapping, ValidationError } from './types.js';

/**
 * Valide les données tabulaires plates avant construction de l'arbre.
 * Retourne un tableau d'erreurs (vide si tout est valide).
 */
export function validateData(
  records: Record<string, unknown>[],
  fieldMapping: FieldMapping
): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!records || records.length === 0) {
    errors.push({
      type: 'empty-data',
      message: 'Aucune donnée fournie.',
    });
    return errors;
  }

  const idField = fieldMapping.id;
  const parentField = fieldMapping.parent;

  // Vérifier l'unicité des ids
  const ids = new Set<string | number>();
  const duplicates: (string | number)[] = [];
  for (const record of records) {
    const id = record[idField] as string | number;
    if (ids.has(id)) {
      duplicates.push(id);
    }
    ids.add(id);
  }
  if (duplicates.length > 0) {
    errors.push({
      type: 'duplicate-id',
      message: `Identifiants en double : ${duplicates.join(', ')}`,
      details: { duplicates },
    });
  }

  // Trouver les racines (parent_id null/vide/undefined)
  const roots: (string | number)[] = [];
  const orphans: { id: string | number; parentId: string | number }[] = [];

  for (const record of records) {
    const id = record[idField] as string | number;
    const parentId = record[parentField];

    if (parentId === null || parentId === undefined || parentId === '') {
      roots.push(id);
    } else if (!ids.has(parentId as string | number)) {
      orphans.push({ id, parentId: parentId as string | number });
    }
  }

  if (roots.length === 0) {
    errors.push({
      type: 'no-root',
      message: 'Aucun noeud racine trouvé (aucun enregistrement avec parent_id vide ou null).',
    });
  } else if (roots.length > 1) {
    errors.push({
      type: 'multiple-roots',
      message: `Plusieurs racines détectées : ${roots.join(', ')}. Un seul noeud racine est attendu.`,
      details: { roots },
    });
  }

  if (orphans.length > 0) {
    errors.push({
      type: 'orphan',
      message: `Noeuds orphelins (parent_id référence un id inexistant) : ${orphans.map((o) => `${o.id} → parent ${o.parentId}`).join(', ')}`,
      details: { orphans },
    });
  }

  // Détection de cycles
  if (errors.length === 0) {
    const cycleNodes = detectCycles(records, idField, parentField);
    if (cycleNodes.length > 0) {
      errors.push({
        type: 'cycle',
        message: `Cycle détecté impliquant les noeuds : ${cycleNodes.join(', ')}`,
        details: { cycleNodes },
      });
    }
  }

  return errors;
}

/**
 * Détecte les cycles dans le graphe parent-enfant.
 * Retourne les ids des noeuds impliqués dans un cycle.
 */
function detectCycles(
  records: Record<string, unknown>[],
  idField: string,
  parentField: string
): (string | number)[] {
  const parentMap = new Map<string | number, string | number | null>();
  for (const record of records) {
    const id = record[idField] as string | number;
    const parentId = record[parentField] as string | number | null;
    parentMap.set(id, parentId === undefined || parentId === '' ? null : parentId);
  }

  const visited = new Set<string | number>();
  const cycleNodes: (string | number)[] = [];

  for (const id of parentMap.keys()) {
    if (visited.has(id)) continue;

    const path = new Set<string | number>();
    let current: string | number | null = id;

    while (current !== null && !visited.has(current)) {
      if (path.has(current)) {
        // Cycle trouvé — collecter les noeuds du cycle
        for (const nodeId of path) {
          cycleNodes.push(nodeId);
        }
        break;
      }
      path.add(current);
      current = parentMap.get(current) ?? null;
    }

    for (const nodeId of path) {
      visited.add(nodeId);
    }
  }

  return cycleNodes;
}
