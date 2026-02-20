import { LitElement, html, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import type { OrgNode, FieldMapping, NodeStyle } from './types.js';
import { nodeCardStyles } from './styles/node-card.css.js';
import { nodeCompactStyles } from './styles/node-compact.css.js';
import { nodeDetailedStyles } from './styles/node-detailed.css.js';

@customElement('orgchart-node')
export class OrgchartNodeElement extends LitElement {
  static override styles = [nodeCardStyles, nodeCompactStyles, nodeDetailedStyles];

  @property({ type: Object }) node!: OrgNode;
  @property({ type: Object }) fieldMapping!: FieldMapping;
  @property({ attribute: 'node-style', reflect: true }) nodeStyle: NodeStyle = 'card';
  @property({ type: Boolean, reflect: true }) highlighted = false;
  @property({ type: Boolean, reflect: true, attribute: 'search-match' }) searchMatch = false;
  @property({ type: Boolean }) collapsible = false;
  @property({ type: Boolean }) collapsed = false;

  private _getField(field: keyof FieldMapping): unknown {
    if (!this.node?.data) return undefined;
    return this.node.data[this.fieldMapping[field]];
  }

  private _onClick(e: Event): void {
    e.stopPropagation();
    // If collapsible, clicking the card toggles expand/collapse
    if (this.collapsible) {
      this.dispatchEvent(
        new CustomEvent('node-toggle', {
          detail: { node: this.node },
          bubbles: true,
          composed: true,
        })
      );
    }
    this.dispatchEvent(
      new CustomEvent('node-click', {
        detail: { node: this.node },
        bubbles: true,
        composed: true,
      })
    );
  }

  private _onToggle(e: Event): void {
    e.stopPropagation();
    this.dispatchEvent(
      new CustomEvent('node-toggle', {
        detail: { node: this.node },
        bubbles: true,
        composed: true,
      })
    );
  }

  private _onKeyDown(e: KeyboardEvent): void {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      this._onClick(e);
    }
  }

  override render() {
    if (!this.node || !this.fieldMapping) return nothing;

    const name = this._getField('name') as string | undefined;
    const firstname = this._getField('firstname') as string | undefined;
    const role = this._getField('role') as string | undefined;
    const direction = this._getField('direction') as string | undefined;
    const roleType = (this._getField('roleType') as string) || 'standard';
    const image = this._getField('image') as string | undefined;
    const badge = this._getField('badge') as string | undefined;
    const badgeType = (this._getField('badgeType') as string) || 'info';
    const link = this._getField('link') as string | undefined;
    const vacant = this._getField('vacant') as boolean | undefined;
    const interim = this._getField('interim') as string | undefined;
    const email = this._getField('email') as string | undefined;
    const phone = this._getField('phone') as string | undefined;

    const isVacant = vacant || roleType === 'vacant';
    const displayName = [firstname, name ? name.toUpperCase() : ''].filter(Boolean).join(' ') || (isVacant ? '(Vacant)' : '');

    const nodeClasses = {
      orgchart__node: true,
      'orgchart__node--vacant': !!isVacant,
      'orgchart__node--assistant': roleType === 'assistant',
      'orgchart__node--transversal': roleType === 'transversal',
    };

    return html`
      <div
        class=${classMap(nodeClasses)}
        data-node-id=${this.node.id}
        tabindex="0"
        role="button"
        aria-label="${displayName}${role ? `, ${role}` : ''}"
        @click=${this._onClick}
        @keydown=${this._onKeyDown}
      >
        ${this.nodeStyle !== 'compact' ? this._renderImage(image, displayName, isVacant) : nothing}
        <div class="orgchart__node-content">
          ${link
            ? html`<a href=${link} class="orgchart__node-link" target="_blank" rel="noopener"
                ><p class="orgchart__node-name">${displayName}</p></a
              >`
            : html`<p class="orgchart__node-name">${displayName}</p>`}
          ${role ? html`<p class="orgchart__node-role">${role}</p>` : nothing}
          ${isVacant ? html`<p class="orgchart__node-vacant">Poste vacant</p>` : nothing}
          ${interim ? html`<p class="orgchart__node-interim">Intérim : ${interim}</p>` : nothing}
          ${badge && this.nodeStyle !== 'compact'
            ? html`<div class="orgchart__node-badges">
                <span class="orgchart__badge orgchart__badge--${badgeType}">${badge}</span>
              </div>`
            : nothing}
          ${direction && this.nodeStyle !== 'compact'
            ? html`<p class="orgchart__node-direction">${direction}</p>`
            : nothing}
          ${this.nodeStyle === 'detailed' ? this._renderContact(email, phone) : nothing}
        </div>
      </div>
      ${this.collapsible
        ? html`<button
            class="orgchart__toggle"
            @click=${this._onToggle}
            aria-label=${this.collapsed ? 'Déplier' : 'Replier'}
          >
            ${this.collapsed ? '+' : '−'}
          </button>`
        : nothing}
    `;
  }

  private _renderImage(image: string | undefined, alt: string, isVacant: boolean) {
    return html`
      <div class="orgchart__node-img">
        ${image
          ? html`<img src=${image} alt=${alt} loading="lazy" />`
          : html`<span class="orgchart__node-img-placeholder">${isVacant ? '○' : '●'}</span>`}
      </div>
    `;
  }

  private _renderContact(email: string | undefined, phone: string | undefined) {
    if (!email && !phone) return nothing;
    return html`
      <div class="orgchart__node-contact">
        ${email
          ? html`<a href="mailto:${email}">
              <span class="orgchart__node-contact-icon">✉</span>
              ${email}
            </a>`
          : nothing}
        ${phone
          ? html`<a href="tel:${phone}">
              <span class="orgchart__node-contact-icon">☎</span>
              ${phone}
            </a>`
          : nothing}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'orgchart-node': OrgchartNodeElement;
  }
}
