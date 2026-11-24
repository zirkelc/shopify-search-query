import type { Query, Term } from './types.js';

/**
 * Regex for matching dates in these format:
 * - YYYY-MM-DD
 * - YYYY-MM-DDThh:mm:ssZ
 * - YYYY-MM-DDThh:mm:ss.sssZ
 */
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?Z)?$/;

/**
 * Regex for matching special characters that need to be escaped:
 * - :
 * - \
 * - (
 * - )
 */
const ESCAPE_REGEX = /([:\\()])/g;

/**
 * Escapes special characters in field names.
 * Names can include the characters -, ', and " but can't start with them.
 */
function escapeName(value: string): string {
  return value.replace(ESCAPE_REGEX, '\\$1');
}

/**
 * The words that Shopify reads as connectives or modifiers. As a value, they are quoted, so they stay a word.
 */
const KEYWORDS = new Set(['AND', 'OR', 'NOT']);

/**
 * Escapes special characters in values.
 * Values need all special characters escaped with backslash.
 * Dates in YYYY-MM-DD or YYYY-MM-DDThh:mm:ssZ format are quoted, and so are values with whitespace (a phrase) and
 * the keywords AND, OR and NOT. A quote or a backslash inside a quoted value is escaped.
 * In the default search, a leading `-` is escaped too, because Shopify reads it as NOT.
 */
function escapeValue(value: string, { field }: { field: string }): string {
  // Check for date formats: YYYY-MM-DD or YYYY-MM-DDThh:mm:ssZ
  const isDate = DATE_REGEX.test(value);
  const hasWhitespace = value.includes(' ');
  const isKeyword = KEYWORDS.has(value);

  if (isDate || hasWhitespace || isKeyword) {
    return `"${value.replace(/(["\\])/g, '\\$1')}"`;
  }

  const escaped = value.replace(ESCAPE_REGEX, '\\$1');
  return field === '' && escaped.startsWith('-') ? `\\${escaped}` : escaped;
}

/**
 * Build a search query following the Shopify API search syntax.
 *
 * @see https://shopify.dev/docs/api/usage/search-syntax
 */
function formatTerm(term: Term): string {
  const termString = term.field
    ? `${escapeName(term.field)}${term.comparator}${escapeValue(term.value, term)}`
    : escapeValue(term.value, term);

  return term.modifier ? `${term.modifier} ${termString}` : termString;
}

/**
 * Build a search query following the Shopify API search syntax.
 *
 * @see https://shopify.dev/docs/api/usage/search-syntax
 *
 * @example
 * buildSearchQuery(eq('first_name', 'Bob')) // first_name:Bob
 * buildSearchQuery(and(eq('first_name', 'Bob'), eq('orders_count', '16'))) // first_name:Bob AND orders_count:16
 * buildSearchQuery(or(eq('first_name', 'Bob'), eq('orders_count', '16'))) // first_name:Bob OR orders_count:16
 * buildSearchQuery(undefined) // ""
 */
export function buildSearchQuery(query: Query | Term | undefined): string {
  if (query === undefined) {
    return '';
  }

  if ('field' in query) {
    return formatTerm(query);
  }

  const buildTerms = (
    terms: Array<Array<Term | Query | undefined> | Term | Query | undefined>,
    connective: string,
  ): string => {
    const filteredTerms = terms
      .map((term) => {
        if (term === undefined) {
          return '';
        }
        if (Array.isArray(term)) {
          const filteredArray = term.filter(
            (t): t is Term | Query => t !== undefined,
          );
          if (filteredArray.length === 0) {
            return '';
          }
          return `(${buildTerms(filteredArray, connective)})`;
        }
        if ('field' in term) {
          return formatTerm(term);
        }
        return buildSearchQuery(term);
      })
      .filter((termString) => termString !== '');

    return filteredTerms.join(` ${connective} `);
  };

  const { terms, connective } = query;
  return buildTerms(terms, connective);
}
