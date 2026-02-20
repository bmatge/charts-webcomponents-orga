import { css } from 'lit';

export const orgchartStyles = css`
  :host {
    display: block;
    font-family: var(--orgchart-font-family, 'Marianne', arial, sans-serif);
    --_node-bg: var(--orgchart-node-bg, #fff);
    --_node-border: var(--orgchart-node-border, #ddd);
    --_node-radius: var(--orgchart-node-radius, 0.25rem);
    --_connector-color: var(--orgchart-connector-color, #ddd);
    --_connector-width: var(--orgchart-connector-width, 2px);
    --_node-width: var(--orgchart-node-width, 220px);
    --_node-gap: var(--orgchart-node-gap, 1.5em);
    --_level-gap: var(--orgchart-level-gap, 2em);
    --_name-color: var(--orgchart-name-color, #161616);
    --_role-color: var(--orgchart-role-color, #666);
    --_highlight-color: var(--orgchart-highlight-color, #000091);
    --_vacant-opacity: var(--orgchart-vacant-opacity, 0.5);
  }

  *,
  *::before,
  *::after {
    box-sizing: border-box;
  }

  .orgchart__wrapper {
    position: relative;
    overflow: hidden;
    width: 100%;
  }

  .orgchart__title {
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--_name-color);
    margin: 0 0 1rem 0;
    padding: 0;
  }

  .orgchart__toolbar {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 1rem;
    flex-wrap: wrap;
  }

  .orgchart__controls {
    display: flex;
    gap: 0.25rem;
    margin-left: auto;
  }

  .orgchart__controls button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 2rem;
    height: 2rem;
    border: 1px solid var(--_node-border);
    background: var(--_node-bg);
    border-radius: var(--_node-radius);
    cursor: pointer;
    font-size: 1rem;
    color: var(--_name-color);
    transition: background-color 0.2s;
  }

  .orgchart__controls button:hover {
    background-color: #f0f0f0;
  }

  .orgchart__controls button:focus-visible {
    outline: 2px solid var(--_highlight-color);
    outline-offset: 2px;
  }

  .orgchart__viewport {
    overflow: auto;
    padding: 2em;
    transform-origin: 0 0;
  }

  .orgchart__viewport--zoomable {
    overflow: hidden;
    cursor: grab;
  }

  .orgchart__viewport--zoomable:active {
    cursor: grabbing;
  }

  .orgchart__canvas {
    display: inline-block;
    transition: transform 0.1s ease-out;
  }

  .orgchart__empty {
    text-align: center;
    color: var(--_role-color);
    padding: 2em;
    font-style: italic;
  }

  .orgchart__error {
    background: #fef2f2;
    border: 1px solid #fca5a5;
    border-radius: var(--_node-radius);
    padding: 1em;
    color: #991b1b;
    margin: 1em 0;
  }

  .orgchart__error-title {
    font-weight: 700;
    margin-bottom: 0.5em;
  }

  .orgchart__error-list {
    margin: 0;
    padding-left: 1.5em;
  }

  /* === TREE LAYOUT (top-to-bottom) === */

  .orgchart__level {
    display: flex;
    justify-content: center;
    gap: 0;
    list-style: none;
    margin: 0;
    padding: 0;
    position: relative;
  }

  .orgchart__branch {
    display: flex;
    flex-direction: column;
    align-items: center;
    position: relative;
    padding: var(--_node-gap) calc(var(--_node-gap) / 2) 0;
  }

  /* Vertical connector from parent to children level */
  .orgchart__branch::before {
    content: '';
    position: absolute;
    top: 0;
    left: 50%;
    width: 0;
    height: var(--_node-gap);
    border-left: var(--_connector-width) solid var(--_connector-color);
  }

  /* Root node: no top connector */
  .orgchart__level:first-child > .orgchart__branch::before {
    display: none;
  }

  /* Horizontal connector between siblings */
  .orgchart__level > .orgchart__branch::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 0;
    border-top: var(--_connector-width) solid var(--_connector-color);
  }

  /* First sibling: half width from center to right */
  .orgchart__level > .orgchart__branch:first-child::after {
    left: 50%;
    width: 50%;
  }

  /* Last sibling: half width from left to center */
  .orgchart__level > .orgchart__branch:last-child::after {
    width: 50%;
  }

  /* Only child: no horizontal connector */
  .orgchart__level > .orgchart__branch:only-child::after {
    display: none;
  }

  /* Space between parent node and children level */
  .orgchart__branch > .orgchart__level {
    margin-top: 0;
    position: relative;
  }

  .orgchart__branch > .orgchart__level::before {
    content: '';
    position: absolute;
    top: calc(-1 * var(--_node-gap));
    left: 50%;
    width: 0;
    height: var(--_node-gap);
    border-left: var(--_connector-width) solid var(--_connector-color);
    display: none;
  }

  /* Node wrapper for positioning assistants/transversals */
  .orgchart__node-group {
    display: flex;
    align-items: flex-start;
    gap: 1em;
    position: relative;
  }

  /* Connector from node-group to children */
  .orgchart__branch > .orgchart__level {
    padding-top: var(--_level-gap);
    position: relative;
  }

  .orgchart__branch > .orgchart__level::before {
    content: '';
    position: absolute;
    top: 0;
    left: 50%;
    width: 0;
    height: var(--_level-gap);
    border-left: var(--_connector-width) solid var(--_connector-color);
    display: block;
  }

  /* Assistant connector (dashed) */
  .orgchart__aside {
    position: relative;
  }

  .orgchart__aside--left {
    order: -1;
  }

  .orgchart__aside--right {
    order: 1;
  }

  .orgchart__aside::before {
    content: '';
    position: absolute;
    top: 50%;
    width: 1em;
    height: 0;
    border-top: var(--_connector-width) dashed var(--_connector-color);
  }

  .orgchart__aside--left::before {
    right: -1em;
  }

  .orgchart__aside--right::before {
    left: -1em;
  }

  /* Highlighted branch */
  .orgchart__branch--highlighted > .orgchart__node-group > orgchart-node {
    --_node-border: var(--_highlight-color);
  }

  .orgchart__branch--highlighted::before {
    border-left-color: var(--_highlight-color);
  }

  /* Collapsed state */
  .orgchart__branch--collapsed > .orgchart__level {
    display: none;
  }

  /* === COMPACT MODE === */

  :host([compact]) .orgchart__branch {
    padding: calc(var(--_node-gap) / 2) calc(var(--_node-gap) / 4) 0;
  }

  :host([compact]) .orgchart__branch > .orgchart__level {
    padding-top: calc(var(--_level-gap) / 2);
  }

  /* === LEFT-TO-RIGHT ORIENTATION === */

  :host([orientation='left-to-right']) .orgchart__level {
    flex-direction: column;
    align-items: flex-start;
  }

  :host([orientation='left-to-right']) .orgchart__branch {
    flex-direction: row;
    align-items: center;
    padding: calc(var(--_node-gap) / 2) 0 calc(var(--_node-gap) / 2) var(--_node-gap);
  }

  :host([orientation='left-to-right']) .orgchart__branch::before {
    top: 50%;
    left: 0;
    width: var(--_node-gap);
    height: 0;
    border-left: none;
    border-top: var(--_connector-width) solid var(--_connector-color);
  }

  :host([orientation='left-to-right']) .orgchart__level > .orgchart__branch::after {
    top: 0;
    left: 0;
    width: 0;
    height: 100%;
    border-top: none;
    border-left: var(--_connector-width) solid var(--_connector-color);
  }

  :host([orientation='left-to-right']) .orgchart__level > .orgchart__branch:first-child::after {
    top: 50%;
    height: 50%;
    left: 0;
    width: 0;
  }

  :host([orientation='left-to-right']) .orgchart__level > .orgchart__branch:last-child::after {
    height: 50%;
    width: 0;
  }

  :host([orientation='left-to-right']) .orgchart__level > .orgchart__branch:only-child::after {
    display: none;
  }

  :host([orientation='left-to-right']) .orgchart__branch > .orgchart__level {
    padding-top: 0;
    padding-left: var(--_level-gap);
    margin-top: 0;
  }

  :host([orientation='left-to-right']) .orgchart__branch > .orgchart__level::before {
    top: 50%;
    left: 0;
    width: var(--_level-gap);
    height: 0;
    border-left: none;
    border-top: var(--_connector-width) solid var(--_connector-color);
  }

  :host([orientation='left-to-right']) .orgchart__node-group {
    flex-direction: column;
  }

  /* === PRINT === */

  @media print {
    .orgchart__toolbar,
    .orgchart__controls {
      display: none !important;
    }

    .orgchart__viewport {
      overflow: visible !important;
      transform: none !important;
    }

    .orgchart__canvas {
      transform: none !important;
    }

    :host {
      break-inside: avoid;
    }
  }
`;
