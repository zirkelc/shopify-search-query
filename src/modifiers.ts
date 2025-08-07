import type { Term } from './types.js';

export type Modifier = (typeof Modifiers)[keyof typeof Modifiers];
export const Modifiers = {
  NOT: 'NOT',
} as const;

/**
 * NOT modifier
 *
 * @example
 * not(eq('Bob')) // NOT Bob
 * not(eq('first_name', 'Bob')) // NOT first_name:Bob
 * not(undefined) // undefined
 */
export function not(term: Term | undefined): Term | undefined {
  if (term === undefined) {
    return undefined;
  }
  return { ...term, modifier: Modifiers.NOT };
}
