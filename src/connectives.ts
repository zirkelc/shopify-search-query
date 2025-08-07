import type { Query, Term } from './types.js';

export type Connective = (typeof Connectives)[keyof typeof Connectives];

/**
 * Connectives
 */
export const Connectives = {
  AND: 'AND',
  OR: 'OR',
} as const;

/**
 * AND connective
 *
 * @example
 * and(eq('first_name', 'Bob'), eq('orders_count', '16')) // first_name:Bob AND orders_count:16
 * and(eq('first_name', 'Bob'), undefined) // first_name:Bob
 */
export function and(
  ...termsOrArray: Array<
    Array<Term | Query | undefined> | Term | Query | undefined
  >
): Query | undefined {
  const filteredTerms = termsOrArray
    .filter((term): term is Array<Term | Query> | Term | Query => {
      if (Array.isArray(term)) {
        return term.some((t) => t !== undefined);
      }
      return term !== undefined;
    })
    .map((term) => {
      if (Array.isArray(term)) {
        return term.filter((t): t is Term | Query => t !== undefined);
      }
      return term;
    });

  if (filteredTerms.length === 0) {
    return undefined;
  }

  return {
    terms: filteredTerms,
    connective: Connectives.AND,
  };
}

/**
 * OR connective
 *
 * @example
 * or(eq('first_name', 'Bob'), eq('orders_count', '16')) // first_name:Bob OR orders_count:16
 * or(eq('first_name', 'Bob'), undefined) // first_name:Bob
 */
export function or(
  ...termsOrArray: Array<
    Array<Term | Query | undefined> | Term | Query | undefined
  >
): Query | undefined {
  const filteredTerms = termsOrArray
    .filter((term): term is Array<Term | Query> | Term | Query => {
      if (Array.isArray(term)) {
        return term.some((t) => t !== undefined);
      }
      return term !== undefined;
    })
    .map((term) => {
      if (Array.isArray(term)) {
        return term.filter((t): t is Term | Query => t !== undefined);
      }
      return term;
    });

  if (filteredTerms.length === 0) {
    return undefined;
  }

  return {
    terms: filteredTerms,
    connective: Connectives.OR,
  };
}
