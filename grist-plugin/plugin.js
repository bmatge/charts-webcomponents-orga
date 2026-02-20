/**
 * Plugin Grist pour gouv-orgchart.
 * Lit les données de la table sélectionnée et les affiche dans le composant.
 */

// Import the component source — Vite handles bundling for both dev and production.
import '../src/gouv-orgchart.ts';

const orgchart = document.getElementById('orgchart');
const loading = document.getElementById('loading');

// Column mapping for Grist
const columnsMappingOptions = [
  { name: 'id',        title: 'Identifiant unique',                               optional: false, type: 'Int',         allowMultiple: false },
  { name: 'parentId',  title: 'Identifiant du N+1',                               optional: false, type: 'Any',         allowMultiple: false },
  { name: 'nom',       title: 'Nom de la personne',                               optional: false, type: 'Text',        allowMultiple: false },
  { name: 'prenom',    title: 'Prénom',                                            optional: true,  type: 'Text',        allowMultiple: false },
  { name: 'fonction',  title: 'Fonction / poste',                                  optional: true,  type: 'Text',        allowMultiple: false },
  { name: 'direction', title: 'Direction / service',                               optional: true,  type: 'Text',        allowMultiple: false },
  { name: 'roleType',  title: 'Type de rôle (standard/assistant/transversal)',      optional: true,  type: 'Choice',      allowMultiple: false },
  { name: 'image',     title: 'Photo',                                             optional: true,  type: 'Attachments', allowMultiple: false },
  { name: 'badge',     title: 'Badge / étiquette',                                 optional: true,  type: 'Text',        allowMultiple: false },
  { name: 'badgeType', title: 'Type de badge (couleur DSFR)',                       optional: true,  type: 'Choice',      allowMultiple: false },
  { name: 'vacant',    title: 'Poste vacant',                                      optional: true,  type: 'Bool',        allowMultiple: false },
  { name: 'email',     title: 'Email',                                             optional: true,  type: 'Text',        allowMultiple: false },
  { name: 'telephone', title: 'Téléphone',                                         optional: true,  type: 'Text',        allowMultiple: false },
  { name: 'ordre',     title: "Ordre d'affichage",                                 optional: true,  type: 'Int',         allowMultiple: false },
  { name: 'interim',   title: 'Intérimaire',                                       optional: true,  type: 'Text',        allowMultiple: false },
  { name: 'lien',      title: 'Lien URL',                                          optional: true,  type: 'Text',        allowMultiple: false },
];

// Field mapping from Grist column names to our internal names
const gristFieldToOrgchartField = {
  id: 'id',
  parentId: 'parent_id',
  nom: 'nom',
  prenom: 'prenom',
  fonction: 'fonction',
  direction: 'direction',
  roleType: 'role_type',
  image: 'image',
  badge: 'badge',
  badgeType: 'badge_type',
  vacant: 'vacant',
  email: 'email',
  telephone: 'telephone',
  ordre: 'ordre',
  interim: 'interim',
  lien: 'lien',
};

let currentMappings = {};

// Apply saved options
async function applyOptions() {
  try {
    const titre = await grist.getOption('titre');
    if (titre) orgchart.setAttribute('title', titre);

    const nodeStyle = await grist.getOption('nodeStyle');
    if (nodeStyle) orgchart.setAttribute('node-style', nodeStyle);

    const orientation = await grist.getOption('orientation');
    if (orientation) orgchart.setAttribute('orientation', orientation);

    const expandLevel = await grist.getOption('expandLevel');
    if (expandLevel !== undefined && expandLevel !== null) {
      orgchart.setAttribute('expand-level', String(expandLevel));
    }
  } catch {
    // Options not set yet — use defaults
  }
}

// Transform Grist records to flat array with our field names
function transformRecords(gristRecords, mappings) {
  if (!gristRecords || !Array.isArray(gristRecords)) return [];

  return gristRecords.map((record) => {
    const row = {};

    for (const [gristCol, orgField] of Object.entries(gristFieldToOrgchartField)) {
      const mappedColumn = mappings[gristCol];
      if (mappedColumn && record[mappedColumn] !== undefined) {
        let value = record[mappedColumn];

        // Handle Grist reference columns (they return [type, id])
        if (Array.isArray(value) && value.length === 2 && value[0] === 'R') {
          value = value[1];
        }

        // Handle Grist null-like values
        if (value === '' || value === null || value === undefined) {
          // For parent_id, keep null explicitly
          if (orgField === 'parent_id') {
            value = null;
          } else {
            value = undefined;
          }
        }

        row[orgField] = value;
      }
    }

    // Ensure id exists (use Grist row id as fallback)
    if (row.id === undefined && record.id !== undefined) {
      row.id = record.id;
    }

    return row;
  });
}

// Handle records update
function onRecords(gristRecords, mappings) {
  currentMappings = mappings || currentMappings;

  if (!gristRecords || gristRecords.length === 0) {
    orgchart.data = [];
    loading.style.display = 'none';
    orgchart.style.display = 'block';
    return;
  }

  const data = transformRecords(gristRecords, currentMappings);
  orgchart.data = data;
  loading.style.display = 'none';
  orgchart.style.display = 'block';
}

// Initialize Grist widget
grist.ready({
  columns: columnsMappingOptions,
  requiredAccess: 'read table',
  allowSelectBy: true,
});

grist.onRecords(onRecords);

// Listen for options changes
grist.onOptions((options) => {
  if (!options) return;

  if (options.titre) orgchart.setAttribute('title', options.titre);
  if (options.nodeStyle) orgchart.setAttribute('node-style', options.nodeStyle);
  if (options.orientation) orgchart.setAttribute('orientation', options.orientation);
  if (options.expandLevel !== undefined) {
    orgchart.setAttribute('expand-level', String(options.expandLevel));
  }
});

// Apply saved options on load
applyOptions();
