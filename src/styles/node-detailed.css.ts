import { css } from 'lit';

export const nodeDetailedStyles = css`
  :host([node-style='detailed']) {
    width: var(--orgchart-node-width, 260px);
  }

  :host([node-style='detailed']) .orgchart__node {
    flex-direction: column;
    align-items: center;
    text-align: center;
    padding: 1rem;
  }

  :host([node-style='detailed']) .orgchart__node-img {
    width: 64px;
    height: 64px;
    margin-bottom: 0.5rem;
  }

  :host([node-style='detailed']) .orgchart__node-content {
    width: 100%;
  }

  :host([node-style='detailed']) .orgchart__node-name {
    white-space: normal;
    text-align: center;
  }

  :host([node-style='detailed']) .orgchart__node-role {
    white-space: normal;
    text-align: center;
  }

  :host([node-style='detailed']) .orgchart__node-badges {
    justify-content: center;
  }

  .orgchart__node-contact {
    margin-top: 0.5rem;
    padding-top: 0.5rem;
    border-top: 1px solid var(--orgchart-node-border, #ddd);
    font-size: 0.6875rem;
    color: var(--orgchart-role-color, #666);
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .orgchart__node-contact a {
    color: var(--orgchart-highlight-color, #000091);
    text-decoration: none;
    display: flex;
    align-items: center;
    gap: 0.375rem;
  }

  .orgchart__node-contact a:hover {
    text-decoration: underline;
  }

  .orgchart__node-contact-icon {
    flex-shrink: 0;
    font-size: 0.75rem;
  }
`;
