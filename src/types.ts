/**
 * Mapping des noms de colonnes source vers les propriétés internes.
 */
export interface FieldMapping {
  id: string;
  parent: string;
  name: string;
  firstname: string;
  role: string;
  direction: string;
  roleType: string;
  image: string;
  badge: string;
  badgeType: string;
  link: string;
  order: string;
  vacant: string;
  interim: string;
  email: string;
  phone: string;
}

/**
 * Noeud de l'arbre organisationnel.
 */
export interface OrgNode {
  id: string | number;
  parentId: string | number | null;
  data: Record<string, unknown>;
  children: OrgNode[];
  assistants: OrgNode[];
  transversals: OrgNode[];
  depth: number;
  isLeaf: boolean;
}

/**
 * Types de rôle supportés.
 */
export type RoleType = 'standard' | 'assistant' | 'transversal' | 'vacant';

/**
 * Types de badge DSFR.
 */
export type BadgeType =
  | 'success'
  | 'error'
  | 'warning'
  | 'info'
  | 'new'
  | 'green-emeraude'
  | 'purple-glycine'
  | 'pink-macaron'
  | 'blue-ecume'
  | 'green-bourgeon'
  | 'yellow-tournesol'
  | 'orange-terre-battue'
  | 'brown-cafe-creme'
  | 'beige-gris-galet';

/**
 * Styles de noeud supportés.
 */
export type NodeStyle = 'card' | 'compact' | 'detailed';

/**
 * Orientation de l'arbre.
 */
export type Orientation = 'top-to-bottom' | 'left-to-right';

/**
 * Erreur de validation des données.
 */
export interface ValidationError {
  type: 'no-root' | 'multiple-roots' | 'orphan' | 'cycle' | 'duplicate-id' | 'empty-data';
  message: string;
  details?: Record<string, unknown>;
}

/**
 * Résultat de recherche.
 */
export interface SearchResult {
  node: OrgNode;
  matchField: string;
  matchValue: string;
}

/**
 * Valeurs par défaut du FieldMapping.
 */
export const DEFAULT_FIELD_MAPPING: FieldMapping = {
  id: 'id',
  parent: 'parent_id',
  name: 'nom',
  firstname: 'prenom',
  role: 'fonction',
  direction: 'direction',
  roleType: 'role_type',
  image: 'image',
  badge: 'badge',
  badgeType: 'badge_type',
  link: 'lien',
  order: 'ordre',
  vacant: 'vacant',
  interim: 'interim',
  email: 'email',
  phone: 'telephone',
};
