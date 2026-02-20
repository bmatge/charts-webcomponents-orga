import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';

@customElement('orgchart-search')
export class OrgchartSearchElement extends LitElement {
  static override styles = css`
    :host {
      display: block;
    }

    .orgchart__search {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      flex: 1;
    }

    .orgchart__search-input {
      flex: 1;
      min-width: 0;
      padding: 0.5rem 0.75rem;
      border: 1px solid var(--orgchart-node-border, #ddd);
      border-radius: var(--orgchart-node-radius, 0.25rem);
      font-family: inherit;
      font-size: 0.875rem;
      color: var(--orgchart-name-color, #161616);
      background: var(--orgchart-node-bg, #fff);
      outline: none;
      transition: border-color 0.2s;
    }

    .orgchart__search-input:focus {
      border-color: var(--orgchart-highlight-color, #000091);
    }

    .orgchart__search-input::placeholder {
      color: var(--orgchart-role-color, #666);
    }

    .orgchart__search-nav {
      display: flex;
      align-items: center;
      gap: 0.25rem;
    }

    .orgchart__search-count {
      font-size: 0.75rem;
      color: var(--orgchart-role-color, #666);
      white-space: nowrap;
      min-width: 4em;
      text-align: center;
    }

    .orgchart__search-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 1.75rem;
      height: 1.75rem;
      border: 1px solid var(--orgchart-node-border, #ddd);
      background: var(--orgchart-node-bg, #fff);
      border-radius: var(--orgchart-node-radius, 0.25rem);
      cursor: pointer;
      font-size: 0.75rem;
      color: var(--orgchart-name-color, #161616);
      transition: background-color 0.2s;
      padding: 0;
    }

    .orgchart__search-btn:hover {
      background-color: #f0f0f0;
    }

    .orgchart__search-btn:focus-visible {
      outline: 2px solid var(--orgchart-highlight-color, #000091);
      outline-offset: 2px;
    }

    .orgchart__search-btn:disabled {
      opacity: 0.4;
      cursor: default;
    }
  `;

  @property({ type: Number }) resultCount = 0;
  @property({ type: Number }) currentIndex = -1;

  @state() private _query = '';

  private _onInput(e: Event): void {
    const input = e.target as HTMLInputElement;
    this._query = input.value;
    this.dispatchEvent(
      new CustomEvent('search', {
        detail: { query: this._query },
        bubbles: true,
        composed: true,
      })
    );
  }

  private _onKeyDown(e: KeyboardEvent): void {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (e.shiftKey) {
        this._prev();
      } else {
        this._next();
      }
    }
    if (e.key === 'Escape') {
      this._clear();
    }
  }

  private _next(): void {
    if (this.resultCount === 0) return;
    this.dispatchEvent(
      new CustomEvent('search-next', { bubbles: true, composed: true })
    );
  }

  private _prev(): void {
    if (this.resultCount === 0) return;
    this.dispatchEvent(
      new CustomEvent('search-prev', { bubbles: true, composed: true })
    );
  }

  private _clear(): void {
    this._query = '';
    const input = this.shadowRoot?.querySelector('input');
    if (input) input.value = '';
    this.dispatchEvent(
      new CustomEvent('search', {
        detail: { query: '' },
        bubbles: true,
        composed: true,
      })
    );
  }

  override render() {
    const hasResults = this.resultCount > 0;
    const showNav = this._query.length > 0;

    return html`
      <div class="orgchart__search">
        <input
          class="orgchart__search-input"
          type="search"
          placeholder="Rechercher..."
          aria-label="Rechercher dans l'organigramme"
          .value=${this._query}
          @input=${this._onInput}
          @keydown=${this._onKeyDown}
        />
        ${showNav
          ? html`
              <div class="orgchart__search-nav">
                <span class="orgchart__search-count">
                  ${hasResults ? `${this.currentIndex + 1}/${this.resultCount}` : '0'}
                </span>
                <button
                  class="orgchart__search-btn"
                  @click=${this._prev}
                  ?disabled=${!hasResults}
                  aria-label="Résultat précédent"
                >
                  ▲
                </button>
                <button
                  class="orgchart__search-btn"
                  @click=${this._next}
                  ?disabled=${!hasResults}
                  aria-label="Résultat suivant"
                >
                  ▼
                </button>
                <button
                  class="orgchart__search-btn"
                  @click=${this._clear}
                  aria-label="Effacer la recherche"
                >
                  ✕
                </button>
              </div>
            `
          : ''}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'orgchart-search': OrgchartSearchElement;
  }
}
