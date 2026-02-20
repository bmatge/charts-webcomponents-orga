import { css } from 'lit';

export const responsiveStyles = css`
  /* Mobile: indented tree view */
  .orgchart--mobile .orgchart__viewport {
    overflow: visible;
    padding: 0;
  }

  .orgchart--mobile .orgchart__canvas {
    transform: none !important;
    width: 100%;
  }

  .orgchart--mobile .orgchart__controls {
    display: none;
  }

  .orgchart--mobile .orgchart__level {
    flex-direction: column;
    align-items: stretch;
    gap: 0;
  }

  .orgchart--mobile .orgchart__branch {
    flex-direction: column;
    align-items: stretch;
    padding: 0;
    padding-left: 1.25rem;
    border-left: var(--orgchart-connector-width, 2px) solid var(--orgchart-connector-color, #ddd);
  }

  .orgchart--mobile .orgchart__branch::before,
  .orgchart--mobile .orgchart__branch::after {
    display: none;
  }

  .orgchart--mobile .orgchart__branch > .orgchart__level::before {
    display: none;
  }

  .orgchart--mobile .orgchart__level:first-child > .orgchart__branch {
    border-left: none;
    padding-left: 0;
  }

  .orgchart--mobile .orgchart__branch:last-child {
    border-left-color: transparent;
  }

  .orgchart--mobile .orgchart__node-group {
    flex-direction: column;
    gap: 0;
    position: relative;
    padding: 0.375rem 0;
  }

  .orgchart--mobile .orgchart__node-group::before {
    content: '';
    position: absolute;
    top: 50%;
    left: -1.25rem;
    width: 1rem;
    height: 0;
    border-top: var(--orgchart-connector-width, 2px) solid var(--orgchart-connector-color, #ddd);
  }

  .orgchart--mobile .orgchart__level:first-child > .orgchart__branch > .orgchart__node-group::before {
    display: none;
  }

  .orgchart--mobile .orgchart__aside {
    order: 0;
    padding-left: 1rem;
  }

  .orgchart--mobile .orgchart__aside::before {
    display: none;
  }

  .orgchart--mobile .orgchart__branch > .orgchart__level {
    padding-top: 0;
  }

  .orgchart--mobile orgchart-node {
    width: 100% !important;
  }
`;
