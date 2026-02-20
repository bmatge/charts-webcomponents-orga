import { LitElement, html, nothing, type PropertyValues, type TemplateResult } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import type {
  OrgNode,
  FieldMapping,
  NodeStyle,
  Orientation,
  ValidationError,
  SearchResult,
} from './types.js';
import { DEFAULT_FIELD_MAPPING } from './types.js';
import { buildTree, flattenTree, getPathToRoot } from './tree-builder.js';
import { validateData } from './tree-validator.js';
import { orgchartStyles } from './styles/orgchart.css.js';
import { responsiveStyles } from './styles/responsive.css.js';
import './orgchart-node.js';
import './orgchart-search.js';

/**
 * Normalise une chaîne pour la recherche :
 * minuscules, suppression des accents.
 */
function normalize(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

@customElement('gouv-orgchart')
export class GouvOrgchart extends LitElement {
  static override styles = [orgchartStyles, responsiveStyles];

  // === Field mapping attributes ===
  @property({ attribute: 'id-field' }) idField = DEFAULT_FIELD_MAPPING.id;
  @property({ attribute: 'parent-field' }) parentField = DEFAULT_FIELD_MAPPING.parent;
  @property({ attribute: 'name-field' }) nameField = DEFAULT_FIELD_MAPPING.name;
  @property({ attribute: 'firstname-field' }) firstnameField = DEFAULT_FIELD_MAPPING.firstname;
  @property({ attribute: 'role-field' }) roleField = DEFAULT_FIELD_MAPPING.role;
  @property({ attribute: 'direction-field' }) directionField = DEFAULT_FIELD_MAPPING.direction;
  @property({ attribute: 'role-type-field' }) roleTypeField = DEFAULT_FIELD_MAPPING.roleType;
  @property({ attribute: 'image-field' }) imageField = DEFAULT_FIELD_MAPPING.image;
  @property({ attribute: 'badge-field' }) badgeField = DEFAULT_FIELD_MAPPING.badge;
  @property({ attribute: 'badge-type-field' }) badgeTypeField = DEFAULT_FIELD_MAPPING.badgeType;
  @property({ attribute: 'link-field' }) linkField = DEFAULT_FIELD_MAPPING.link;
  @property({ attribute: 'order-field' }) orderField = DEFAULT_FIELD_MAPPING.order;
  @property({ attribute: 'vacant-field' }) vacantField = DEFAULT_FIELD_MAPPING.vacant;
  @property({ attribute: 'interim-field' }) interimField = DEFAULT_FIELD_MAPPING.interim;
  @property({ attribute: 'email-field' }) emailField = DEFAULT_FIELD_MAPPING.email;
  @property({ attribute: 'phone-field' }) phoneField = DEFAULT_FIELD_MAPPING.phone;

  // === Display options ===
  @property({ reflect: true }) orientation: Orientation = 'top-to-bottom';
  @property({ attribute: 'node-style' }) nodeStyle: NodeStyle = 'card';
  @property({ type: Boolean, reflect: true }) compact = false;
  @property({ type: Boolean }) searchable = true;
  @property({ type: Boolean }) collapsible = true;
  @property({ attribute: 'expand-level', type: Number }) expandLevel = 2;
  @property({ attribute: 'highlight-path', type: Boolean }) highlightPath = true;
  @property({ type: Boolean }) zoom = true;
  @property({ attribute: 'min-zoom', type: Number }) minZoom = 0.3;
  @property({ attribute: 'max-zoom', type: Number }) maxZoom = 2;
  @property() title = '';
  @property({ attribute: 'empty-message' }) emptyMessage = 'Aucune donnée';
  @property({ attribute: 'responsive-breakpoint', type: Number }) responsiveBreakpoint = 768;

  // === Data ===
  @property({ type: Array }) data: Record<string, unknown>[] = [];

  // === Internal state ===
  @state() private _tree: OrgNode | null = null;
  @state() private _errors: ValidationError[] = [];
  @state() private _highlightedPath: Set<string | number> = new Set();
  @state() private _collapsedNodes: Set<string | number> = new Set();
  @state() private _searchResults: SearchResult[] = [];
  @state() private _searchIndex = -1;
  @state() private _searchMatchIds: Set<string | number> = new Set();
  @state() private _isMobile = false;
  @state() private _zoom = 1;
  @state() private _panX = 0;
  @state() private _panY = 0;

  private _isPanning = false;
  private _panStartX = 0;
  private _panStartY = 0;
  private _panStartPanX = 0;
  private _panStartPanY = 0;
  private _resizeObserver: ResizeObserver | null = null;

  // === Public readonly ===
  get selectedNodes(): OrgNode[] {
    return this._tree ? flattenTree(this._tree).filter((n) => this._highlightedPath.has(n.id)) : [];
  }

  // === Field mapping helper ===
  private _getFieldMapping(): FieldMapping {
    return {
      id: this.idField,
      parent: this.parentField,
      name: this.nameField,
      firstname: this.firstnameField,
      role: this.roleField,
      direction: this.directionField,
      roleType: this.roleTypeField,
      image: this.imageField,
      badge: this.badgeField,
      badgeType: this.badgeTypeField,
      link: this.linkField,
      order: this.orderField,
      vacant: this.vacantField,
      interim: this.interimField,
      email: this.emailField,
      phone: this.phoneField,
    };
  }

  // === Lifecycle ===

  override connectedCallback(): void {
    super.connectedCallback();
    this._resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        this._isMobile = entry.contentRect.width <= this.responsiveBreakpoint;
      }
    });
    this._resizeObserver.observe(this);
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this._resizeObserver?.disconnect();
    this._resizeObserver = null;
  }

  override willUpdate(changed: PropertyValues): void {
    // Rebuild tree when data or field mappings change
    const fieldProps = [
      'data', 'idField', 'parentField', 'nameField', 'firstnameField',
      'roleField', 'directionField', 'roleTypeField', 'imageField',
      'badgeField', 'badgeTypeField', 'linkField', 'orderField',
      'vacantField', 'interimField', 'emailField', 'phoneField',
    ];

    const needsRebuild = fieldProps.some((p) => changed.has(p as keyof this));
    if (needsRebuild) {
      this._buildTreeFromData();
    }
  }

  private _buildTreeFromData(): void {
    this._tree = null;
    this._errors = [];

    if (!this.data || this.data.length === 0) {
      return;
    }

    // Handle data passed as JSON string attribute
    let records = this.data;
    if (typeof records === 'string') {
      try {
        records = JSON.parse(records as unknown as string);
      } catch {
        this._errors = [
          { type: 'empty-data', message: 'Format JSON invalide pour les données.' },
        ];
        this._emitError();
        return;
      }
    }

    const fieldMapping = this._getFieldMapping();
    const errors = validateData(records, fieldMapping);
    if (errors.length > 0) {
      this._errors = errors;
      this._emitError();
      return;
    }

    try {
      this._tree = buildTree(records, fieldMapping);
      this._initCollapsedState();
    } catch (e) {
      this._errors = [
        { type: 'empty-data', message: (e as Error).message },
      ];
      this._emitError();
    }
  }

  private _emitError(): void {
    for (const err of this._errors) {
      this.dispatchEvent(
        new CustomEvent('data-error', {
          detail: { type: err.type, message: err.message },
          bubbles: true,
          composed: true,
        })
      );
    }
  }

  private _initCollapsedState(): void {
    this._collapsedNodes = new Set();
    if (!this._tree || this.expandLevel === 0) return;

    const collapse = (node: OrgNode): void => {
      if (node.depth >= this.expandLevel && !node.isLeaf) {
        this._collapsedNodes.add(node.id);
      }
      for (const child of [...node.children, ...node.assistants, ...node.transversals]) {
        collapse(child);
      }
    };
    collapse(this._tree);
  }

  // === Public methods ===

  expandAll(): void {
    this._collapsedNodes = new Set();
  }

  collapseAll(): void {
    if (!this._tree) return;
    const all = flattenTree(this._tree);
    this._collapsedNodes = new Set(
      all.filter((n) => !n.isLeaf).map((n) => n.id)
    );
  }

  expandToLevel(level: number): void {
    this.expandLevel = level;
    this._initCollapsedState();
  }

  focusNode(id: string | number): void {
    // Ensure all ancestors are expanded
    if (this._tree) {
      const path = getPathToRoot(this._tree, id);
      const newCollapsed = new Set(this._collapsedNodes);
      for (const nodeId of path) {
        newCollapsed.delete(nodeId);
      }
      this._collapsedNodes = newCollapsed;
    }

    // Scroll to node after render
    this.updateComplete.then(() => {
      const nodeEl = this.shadowRoot?.querySelector(`[data-node-id="${id}"]`);
      nodeEl?.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
    });
  }

  highlightNodePath(id: string | number): void {
    if (!this._tree) return;
    this._highlightedPath = getPathToRoot(this._tree, id);
  }

  clearHighlight(): void {
    this._highlightedPath = new Set();
  }

  search(query: string): OrgNode[] {
    if (!this._tree || !query.trim()) {
      this._searchResults = [];
      this._searchIndex = -1;
      this._searchMatchIds = new Set();
      return [];
    }

    const normalizedQuery = normalize(query);
    const fieldMapping = this._getFieldMapping();
    const results: SearchResult[] = [];
    const allNodes = flattenTree(this._tree);

    for (const node of allNodes) {
      const searchableFields: (keyof FieldMapping)[] = ['name', 'firstname', 'role', 'direction'];
      for (const field of searchableFields) {
        const value = node.data[fieldMapping[field]];
        if (value && typeof value === 'string' && normalize(value).includes(normalizedQuery)) {
          results.push({ node, matchField: field, matchValue: value });
          break; // One match per node is enough
        }
      }
    }

    this._searchResults = results;
    this._searchMatchIds = new Set(results.map((r) => r.node.id));
    this._searchIndex = results.length > 0 ? 0 : -1;

    // Expand parents of all matches
    if (results.length > 0) {
      const newCollapsed = new Set(this._collapsedNodes);
      for (const result of results) {
        const path = getPathToRoot(this._tree!, result.node.id);
        for (const nodeId of path) {
          newCollapsed.delete(nodeId);
        }
      }
      this._collapsedNodes = newCollapsed;

      // Focus first result
      this.focusNode(results[0].node.id);
    }

    this.dispatchEvent(
      new CustomEvent('search-result', {
        detail: { query, results: results.map((r) => r.node) },
        bubbles: true,
        composed: true,
      })
    );

    return results.map((r) => r.node);
  }

  exportSVG(): string {
    // Simplified SVG export: serialize the current viewport content
    const viewport = this.shadowRoot?.querySelector('.orgchart__canvas');
    if (!viewport) return '';

    const serializer = new XMLSerializer();
    const svgNs = 'http://www.w3.org/2000/svg';
    const foreignObjectNs = 'http://www.w3.org/1999/xhtml';
    const rect = viewport.getBoundingClientRect();

    const svg = document.createElementNS(svgNs, 'svg');
    svg.setAttribute('width', String(rect.width));
    svg.setAttribute('height', String(rect.height));
    svg.setAttribute('xmlns', svgNs);

    const fo = document.createElementNS(svgNs, 'foreignObject');
    fo.setAttribute('width', '100%');
    fo.setAttribute('height', '100%');

    const body = document.createElementNS(foreignObjectNs, 'body');
    body.setAttribute('xmlns', foreignObjectNs);
    body.innerHTML = viewport.innerHTML;
    fo.appendChild(body);
    svg.appendChild(fo);

    return serializer.serializeToString(svg);
  }

  async exportPNG(): Promise<Blob> {
    const svgString = this.exportSVG();
    const canvas = document.createElement('canvas');
    const viewport = this.shadowRoot?.querySelector('.orgchart__canvas');
    const rect = viewport?.getBoundingClientRect() ?? { width: 800, height: 600 };

    canvas.width = rect.width * 2; // 2x for retina
    canvas.height = rect.height * 2;
    const ctx = canvas.getContext('2d')!;
    ctx.scale(2, 2);

    const img = new Image();
    const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);

    return new Promise((resolve, reject) => {
      img.onload = () => {
        ctx.drawImage(img, 0, 0);
        URL.revokeObjectURL(url);
        canvas.toBlob((blob) => {
          if (blob) resolve(blob);
          else reject(new Error('Failed to create PNG blob'));
        }, 'image/png');
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Failed to load SVG for PNG export'));
      };
      img.src = url;
    });
  }

  // === Event handlers ===

  private _onNodeClick(node: OrgNode): void {
    if (this.highlightPath) {
      this.highlightNodePath(node.id);
    }
    this.dispatchEvent(
      new CustomEvent('node-click', {
        detail: { node },
        bubbles: true,
        composed: true,
      })
    );
  }

  private _onNodeToggle(node: OrgNode): void {
    const newCollapsed = new Set(this._collapsedNodes);
    const wasCollapsed = newCollapsed.has(node.id);
    if (wasCollapsed) {
      newCollapsed.delete(node.id);
    } else {
      newCollapsed.add(node.id);
    }
    this._collapsedNodes = newCollapsed;

    this.dispatchEvent(
      new CustomEvent('node-expand', {
        detail: { node, expanded: wasCollapsed },
        bubbles: true,
        composed: true,
      })
    );
  }

  private _onSearch(e: CustomEvent<{ query: string }>): void {
    this.search(e.detail.query);
  }

  private _onSearchNext(): void {
    if (this._searchResults.length === 0) return;
    this._searchIndex = (this._searchIndex + 1) % this._searchResults.length;
    this.focusNode(this._searchResults[this._searchIndex].node.id);
  }

  private _onSearchPrev(): void {
    if (this._searchResults.length === 0) return;
    this._searchIndex =
      (this._searchIndex - 1 + this._searchResults.length) % this._searchResults.length;
    this.focusNode(this._searchResults[this._searchIndex].node.id);
  }

  // === Zoom & Pan ===

  private _onWheel(e: WheelEvent): void {
    if (!this.zoom || this._isMobile) return;
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    this._zoom = Math.max(this.minZoom, Math.min(this.maxZoom, this._zoom + delta));
  }

  private _onPointerDown(e: PointerEvent): void {
    if (!this.zoom || this._isMobile) return;
    this._isPanning = true;
    this._panStartX = e.clientX;
    this._panStartY = e.clientY;
    this._panStartPanX = this._panX;
    this._panStartPanY = this._panY;
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  }

  private _onPointerMove(e: PointerEvent): void {
    if (!this._isPanning) return;
    this._panX = this._panStartPanX + (e.clientX - this._panStartX);
    this._panY = this._panStartPanY + (e.clientY - this._panStartY);
  }

  private _onPointerUp(): void {
    this._isPanning = false;
  }

  private _zoomIn(): void {
    this._zoom = Math.min(this.maxZoom, this._zoom + 0.2);
  }

  private _zoomOut(): void {
    this._zoom = Math.max(this.minZoom, this._zoom - 0.2);
  }

  private _zoomReset(): void {
    this._zoom = 1;
    this._panX = 0;
    this._panY = 0;
  }

  private _fitToView(): void {
    const viewport = this.shadowRoot?.querySelector('.orgchart__viewport');
    const canvas = this.shadowRoot?.querySelector('.orgchart__canvas');
    if (!viewport || !canvas) return;

    const vRect = viewport.getBoundingClientRect();

    // Reset transform temporarily to get true size
    this._zoom = 1;
    this._panX = 0;
    this._panY = 0;

    this.updateComplete.then(() => {
      const canvasRect = canvas.getBoundingClientRect();
      const scaleX = vRect.width / canvasRect.width;
      const scaleY = vRect.height / canvasRect.height;
      this._zoom = Math.max(this.minZoom, Math.min(this.maxZoom, Math.min(scaleX, scaleY) * 0.9));
    });
  }

  // === Keyboard navigation ===

  private _onKeyDown(e: KeyboardEvent): void {
    if (!this._tree) return;

    const allNodes = flattenTree(this._tree);
    const focusedEl = this.shadowRoot?.activeElement?.closest('orgchart-node');
    if (!focusedEl) return;

    const focusedId = focusedEl.node?.id;
    if (focusedId === undefined) return;

    const focusedNode = allNodes.find((n) => n.id === focusedId);
    if (!focusedNode) return;

    switch (e.key) {
      case 'ArrowLeft':
        e.preventDefault();
        if (this.collapsible && !focusedNode.isLeaf && !this._collapsedNodes.has(focusedId)) {
          this._onNodeToggle(focusedNode);
        } else if (focusedNode.parentId !== null) {
          // Focus parent
          this._focusNodeElement(focusedNode.parentId);
        }
        break;
      case 'ArrowRight':
        e.preventDefault();
        if (this.collapsible && this._collapsedNodes.has(focusedId)) {
          this._onNodeToggle(focusedNode);
        } else if (focusedNode.children.length > 0) {
          this._focusNodeElement(focusedNode.children[0].id);
        }
        break;
      case 'ArrowUp': {
        e.preventDefault();
        // Focus previous sibling
        const parent = allNodes.find((n) => n.id === focusedNode.parentId);
        if (parent) {
          const siblings = parent.children;
          const idx = siblings.findIndex((s) => s.id === focusedId);
          if (idx > 0) {
            this._focusNodeElement(siblings[idx - 1].id);
          }
        }
        break;
      }
      case 'ArrowDown': {
        e.preventDefault();
        // Focus next sibling
        const parentNode = allNodes.find((n) => n.id === focusedNode.parentId);
        if (parentNode) {
          const siblings = parentNode.children;
          const idx = siblings.findIndex((s) => s.id === focusedId);
          if (idx < siblings.length - 1) {
            this._focusNodeElement(siblings[idx + 1].id);
          }
        }
        break;
      }
    }
  }

  private _focusNodeElement(id: string | number): void {
    this.updateComplete.then(() => {
      const nodeEl = this.shadowRoot?.querySelector(`orgchart-node[data-id="${id}"]`);
      const focusable = nodeEl?.shadowRoot?.querySelector('[tabindex]') as HTMLElement | undefined;
      focusable?.focus();
    });
  }

  // === Render ===

  override render() {
    if (this._errors.length > 0) {
      return html`
        ${this.title ? html`<h2 class="orgchart__title">${this.title}</h2>` : nothing}
        <div class="orgchart__error">
          <p class="orgchart__error-title">Erreur dans les données</p>
          <ul class="orgchart__error-list">
            ${this._errors.map((err) => html`<li>${err.message}</li>`)}
          </ul>
        </div>
      `;
    }

    if (!this._tree) {
      return html`
        ${this.title ? html`<h2 class="orgchart__title">${this.title}</h2>` : nothing}
        <p class="orgchart__empty">${this.emptyMessage}</p>
      `;
    }

    const wrapperClasses = {
      orgchart__wrapper: true,
      'orgchart--mobile': this._isMobile,
    };

    const fieldMapping = this._getFieldMapping();

    return html`
      ${this.title ? html`<h2 class="orgchart__title">${this.title}</h2>` : nothing}
      <div class=${classMap(wrapperClasses)} @keydown=${this._onKeyDown}>
        <div class="orgchart__toolbar">
          ${this.searchable
            ? html`<orgchart-search
                .resultCount=${this._searchResults.length}
                .currentIndex=${this._searchIndex}
                @search=${this._onSearch}
                @search-next=${this._onSearchNext}
                @search-prev=${this._onSearchPrev}
              ></orgchart-search>`
            : nothing}
          ${this.zoom && !this._isMobile
            ? html`<div class="orgchart__controls">
                <button @click=${this._zoomIn} aria-label="Zoom avant" title="Zoom avant">+</button>
                <button @click=${this._zoomOut} aria-label="Zoom arrière" title="Zoom arrière">−</button>
                <button @click=${this._zoomReset} aria-label="Réinitialiser la vue" title="Réinitialiser">↺</button>
                <button @click=${this._fitToView} aria-label="Ajuster à la vue" title="Ajuster">⊡</button>
              </div>`
            : nothing}
        </div>
        <div
          class="orgchart__viewport ${this.zoom && !this._isMobile ? 'orgchart__viewport--zoomable' : ''}"
          @wheel=${this._onWheel}
          @pointerdown=${this._onPointerDown}
          @pointermove=${this._onPointerMove}
          @pointerup=${this._onPointerUp}
          @pointercancel=${this._onPointerUp}
          role="tree"
          aria-label=${this.title || 'Organigramme'}
        >
          <div
            class="orgchart__canvas"
            style="transform: translate(${this._panX}px, ${this._panY}px) scale(${this._zoom})"
          >
            <ul class="orgchart__level">
              ${this._renderBranch(this._tree, fieldMapping)}
            </ul>
          </div>
        </div>
      </div>
    `;
  }

  private _renderBranch(node: OrgNode, fieldMapping: FieldMapping): TemplateResult {
    const isCollapsed = this._collapsedNodes.has(node.id);
    const isHighlighted = this._highlightedPath.has(node.id);
    const hasChildren =
      node.children.length > 0 || node.assistants.length > 0 || node.transversals.length > 0;
    const isSearchMatch = this._searchMatchIds.has(node.id);

    const branchClasses = {
      orgchart__branch: true,
      'orgchart__branch--highlighted': isHighlighted,
      'orgchart__branch--collapsed': isCollapsed,
    };

    return html`
      <li
        class=${classMap(branchClasses)}
        role="treeitem"
        aria-expanded=${hasChildren ? String(!isCollapsed) : nothing}
      >
        <div class="orgchart__node-group">
          ${node.assistants.map(
            (a) => html`
              <div class="orgchart__aside orgchart__aside--left">
                <orgchart-node
                  .node=${a}
                  .fieldMapping=${fieldMapping}
                  node-style=${this.nodeStyle}
                  ?highlighted=${this._highlightedPath.has(a.id)}
                  ?search-match=${this._searchMatchIds.has(a.id)}
                  data-id=${a.id}
                  @node-click=${(e: CustomEvent) => this._onNodeClick(e.detail.node)}
                ></orgchart-node>
              </div>
            `
          )}

          <orgchart-node
            .node=${node}
            .fieldMapping=${fieldMapping}
            node-style=${this.nodeStyle}
            ?highlighted=${isHighlighted}
            ?search-match=${isSearchMatch}
            ?collapsible=${this.collapsible && hasChildren}
            ?collapsed=${isCollapsed}
            data-id=${node.id}
            @node-click=${(e: CustomEvent) => this._onNodeClick(e.detail.node)}
            @node-toggle=${() => this._onNodeToggle(node)}
          ></orgchart-node>

          ${node.transversals.map(
            (t) => html`
              <div class="orgchart__aside orgchart__aside--right">
                <orgchart-node
                  .node=${t}
                  .fieldMapping=${fieldMapping}
                  node-style=${this.nodeStyle}
                  ?highlighted=${this._highlightedPath.has(t.id)}
                  ?search-match=${this._searchMatchIds.has(t.id)}
                  data-id=${t.id}
                  @node-click=${(e: CustomEvent) => this._onNodeClick(e.detail.node)}
                ></orgchart-node>
              </div>
            `
          )}
        </div>

        ${hasChildren && !isCollapsed
          ? html`
              <ul class="orgchart__level" role="group">
                ${node.children.map((child) => this._renderBranch(child, fieldMapping))}
              </ul>
            `
          : nothing}
      </li>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'gouv-orgchart': GouvOrgchart;
  }
}
