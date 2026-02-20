import { css } from 'lit';

export const nodeCardStyles = css`
  :host {
    display: block;
    width: var(--orgchart-node-width, 220px);
  }

  .orgchart__node {
    background: var(--orgchart-node-bg, #fff);
    border: 1px solid var(--orgchart-node-border, #ddd);
    border-radius: var(--orgchart-node-radius, 0.25rem);
    padding: 0.75rem;
    cursor: pointer;
    transition: box-shadow 0.2s, border-color 0.2s;
    position: relative;
    display: flex;
    gap: 0.75rem;
    align-items: flex-start;
    min-width: 0;
  }

  .orgchart__node:hover {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }

  .orgchart__node:focus-visible {
    outline: 2px solid var(--orgchart-highlight-color, #000091);
    outline-offset: 2px;
  }

  /* Highlighted node */
  :host([highlighted]) .orgchart__node {
    border-color: var(--orgchart-highlight-color, #000091);
    box-shadow: 0 0 0 1px var(--orgchart-highlight-color, #000091);
  }

  /* Search match */
  :host([search-match]) .orgchart__node {
    background: #eff6ff;
    border-color: var(--orgchart-highlight-color, #000091);
  }

  /* Vacant node */
  .orgchart__node--vacant {
    opacity: var(--orgchart-vacant-opacity, 0.5);
    border-style: dashed;
  }

  /* Assistant node */
  .orgchart__node--assistant {
    border-left: 3px solid var(--orgchart-highlight-color, #000091);
  }

  /* Transversal node */
  .orgchart__node--transversal {
    background: #f8f9fa;
    border-left: 3px solid #6a6af4;
  }

  /* Image / avatar */
  .orgchart__node-img {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    overflow: hidden;
    flex-shrink: 0;
    background: #eee;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .orgchart__node-img img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .orgchart__node-img-placeholder {
    font-size: 1.25rem;
    color: #999;
  }

  /* Content */
  .orgchart__node-content {
    flex: 1;
    min-width: 0;
  }

  .orgchart__node-name {
    font-size: 0.875rem;
    font-weight: 700;
    color: var(--orgchart-name-color, #161616);
    margin: 0;
    line-height: 1.3;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .orgchart__node-role {
    font-size: 0.75rem;
    color: var(--orgchart-role-color, #666);
    margin: 0.125rem 0 0;
    line-height: 1.3;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .orgchart__node-direction {
    font-size: 0.6875rem;
    color: var(--orgchart-role-color, #666);
    margin: 0.25rem 0 0;
    font-style: italic;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  /* Badge */
  .orgchart__node-badges {
    display: flex;
    gap: 0.25rem;
    flex-wrap: wrap;
    margin-top: 0.375rem;
  }

  .orgchart__badge {
    display: inline-block;
    font-size: 0.625rem;
    font-weight: 700;
    text-transform: uppercase;
    padding: 0.125rem 0.375rem;
    border-radius: 0.25rem;
    line-height: 1.4;
    white-space: nowrap;
  }

  /* Badge colors */
  .orgchart__badge--info {
    background: #e8edff;
    color: #000091;
  }
  .orgchart__badge--success {
    background: #b8fec9;
    color: #18753c;
  }
  .orgchart__badge--error {
    background: #ffe9e6;
    color: #ce0500;
  }
  .orgchart__badge--warning {
    background: #ffe9c5;
    color: #b34000;
  }
  .orgchart__badge--new {
    background: #000091;
    color: #fff;
  }
  .orgchart__badge--green-emeraude {
    background: #c3fad5;
    color: #297254;
  }
  .orgchart__badge--purple-glycine {
    background: #fee7fc;
    color: #6e445a;
  }
  .orgchart__badge--pink-macaron {
    background: #fee9e7;
    color: #8d533e;
  }
  .orgchart__badge--blue-ecume {
    background: #e9edfe;
    color: #2f4077;
  }
  .orgchart__badge--green-bourgeon {
    background: #c9fcac;
    color: #447049;
  }
  .orgchart__badge--yellow-tournesol {
    background: #feecc2;
    color: #716043;
  }
  .orgchart__badge--orange-terre-battue {
    background: #fee9e5;
    color: #755348;
  }
  .orgchart__badge--brown-cafe-creme {
    background: #f7ece4;
    color: #685c48;
  }
  .orgchart__badge--beige-gris-galet {
    background: #f3ede5;
    color: #6a6156;
  }

  /* Vacant label */
  .orgchart__node-vacant {
    font-size: 0.75rem;
    color: #ce0500;
    font-style: italic;
    margin-top: 0.25rem;
  }

  /* Interim label */
  .orgchart__node-interim {
    font-size: 0.6875rem;
    color: var(--orgchart-role-color, #666);
    margin-top: 0.125rem;
  }

  /* Collapse toggle */
  .orgchart__toggle {
    position: absolute;
    bottom: -0.75rem;
    left: 50%;
    transform: translateX(-50%);
    width: 1.25rem;
    height: 1.25rem;
    border-radius: 50%;
    border: var(--orgchart-connector-width, 2px) solid var(--orgchart-connector-color, #ddd);
    background: var(--orgchart-node-bg, #fff);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.625rem;
    color: var(--orgchart-role-color, #666);
    z-index: 1;
    transition: background-color 0.2s;
    padding: 0;
    line-height: 1;
  }

  .orgchart__toggle:hover {
    background-color: #f0f0f0;
  }

  .orgchart__toggle:focus-visible {
    outline: 2px solid var(--orgchart-highlight-color, #000091);
    outline-offset: 2px;
  }

  /* Link wrapper */
  .orgchart__node-link {
    color: inherit;
    text-decoration: none;
  }

  .orgchart__node-link:hover {
    text-decoration: underline;
  }
`;
