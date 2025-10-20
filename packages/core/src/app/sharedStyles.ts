import * as stylex from '@stylexjs/stylex';
import { coreTokens as $ } from '@bonterratech/stitch-tokens/coreTokens.stylex';

/**
 * Shared styles used across multiple components
 */
export const listStyles = stylex.create({
  ul: {
    margin: 0,
    paddingInlineStart: $['--s-space-400'],
  },
  li: {
    marginBottom: $['--s-space-200'],
  },
});

export const cardStyles = stylex.create({
  maxWidth: {
    maxWidth: '600px',
    margin: '0 auto',
  },
  codeBlock: {
    backgroundColor: '#f3f4f6',
    padding: '8px 12px',
    borderRadius: '4px',
    border: '1px solid #e5e7eb',
    fontFamily: 'ui-monospace, SFMono-Regular, monospace',
    fontSize: '14px',
  },
});