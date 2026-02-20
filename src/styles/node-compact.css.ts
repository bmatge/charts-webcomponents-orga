import { css } from 'lit';

export const nodeCompactStyles = css`
  :host([node-style='compact']) {
    width: var(--orgchart-node-width, 180px);
  }

  :host([node-style='compact']) .orgchart__node {
    padding: 0.5rem 0.625rem;
    gap: 0;
  }

  :host([node-style='compact']) .orgchart__node-img {
    display: none;
  }

  :host([node-style='compact']) .orgchart__node-badges {
    display: none;
  }

  :host([node-style='compact']) .orgchart__node-direction {
    display: none;
  }

  :host([node-style='compact']) .orgchart__node-name {
    font-size: 0.8125rem;
  }

  :host([node-style='compact']) .orgchart__node-role {
    font-size: 0.6875rem;
  }
`;
