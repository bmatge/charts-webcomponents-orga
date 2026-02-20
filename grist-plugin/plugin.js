/**
 * Plugin Grist pour gouv-orgchart.
 * Lit les données de la table sélectionnée et les affiche dans le composant.
 */

// Import the component source — Vite handles bundling for both dev and production.
import '../src/gouv-orgchart.ts';

const orgchart = document.getElementById('orgchart');
const loading = document.getElementById('loading');

// === Settings panel ===

const settingsToggle = document.getElementById('settings-toggle');
const settingsPanel = document.getElementById('settings-panel');

const optTitre = document.getElementById('opt-titre');
const optNodeStyle = document.getElementById('opt-node-style');
const optOrientation = document.getElementById('opt-orientation');
const optExpandLevel = document.getElementById('opt-expand-level');
const optSearchable = document.getElementById('opt-searchable');
const optCompact = document.getElementById('opt-compact');

// Toggle panel open/close
settingsToggle.addEventListener('click', () => {
  settingsPanel.classList.toggle('open');
});

// Close panel when clicking outside
document.addEventListener('click', (e) => {
  if (
    settingsPanel.classList.contains('open') &&
    !settingsPanel.contains(e.target) &&
    e.target !== settingsToggle
  ) {
    settingsPanel.classList.remove('open');
  }
});

// Apply an option to the orgchart and persist it via Grist
function setOption(key, value) {
  // Apply to component
  switch (key) {
    case 'titre':
      if (value) orgchart.setAttribute('title', value);
      else orgchart.removeAttribute('title');
      break;
    case 'nodeStyle':
      orgchart.setAttribute('node-style', value || 'card');
      break;
    case 'orientation':
      orgchart.setAttribute('orientation', value || 'top-to-bottom');
      break;
    case 'expandLevel':
      orgchart.setAttribute('expand-level', String(value ?? 2));
      if (orgchart.expandToLevel) orgchart.expandToLevel(Number(value ?? 2));
      break;
    case 'searchable':
      if (value === 'false' || value === false) orgchart.removeAttribute('searchable');
      else orgchart.setAttribute('searchable', '');
      break;
    case 'compact':
      if (value === 'true' || value === true) orgchart.setAttribute('compact', '');
      else orgchart.removeAttribute('compact');
      break;
  }

  // Persist via Grist
  try {
    grist.setOption(key, value);
  } catch {
    // grist.setOption may not be available in all contexts
  }
}

// Bind settings controls
optTitre.addEventListener('change', () => setOption('titre', optTitre.value));
optNodeStyle.addEventListener('change', () => setOption('nodeStyle', optNodeStyle.value));
optOrientation.addEventListener('change', () => setOption('orientation', optOrientation.value));
optExpandLevel.addEventListener('change', () => setOption('expandLevel', Number(optExpandLevel.value)));
optSearchable.addEventListener('change', () => setOption('searchable', optSearchable.value));
optCompact.addEventListener('change', () => setOption('compact', optCompact.value));

// Populate settings panel from saved options
function applyOptionsToUI(options) {
  if (!options) return;

  if (options.titre != null) {
    optTitre.value = options.titre;
    setOption('titre', options.titre);
  }
  if (options.nodeStyle) {
    optNodeStyle.value = options.nodeStyle;
    setOption('nodeStyle', options.nodeStyle);
  }
  if (options.orientation) {
    optOrientation.value = options.orientation;
    setOption('orientation', options.orientation);
  }
  if (options.expandLevel != null) {
    optExpandLevel.value = options.expandLevel;
    setOption('expandLevel', options.expandLevel);
  }
  if (options.searchable != null) {
    optSearchable.value = String(options.searchable);
    setOption('searchable', options.searchable);
  }
  if (options.compact != null) {
    optCompact.value = String(options.compact);
    setOption('compact', options.compact);
  }
}

// === Column mapping ===

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

// === Initialize Grist widget ===

grist.ready({
  columns: columnsMappingOptions,
  requiredAccess: 'read table',
  allowSelectBy: true,
});

grist.onRecords(onRecords);

// Listen for options changes (e.g. from another tab or session)
grist.onOptions((options) => {
  applyOptionsToUI(options);
});
