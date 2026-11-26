/**
 * Local-first privacy helpers for youth / child learning contexts.
 * This module never phones home. Callers should avoid sending PII into
 * notes before generation when deploying in schools.
 */

const EMAIL_RE = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi;
const PHONE_RE = /\b(?:\+?\d{1,3}[\s-]?)?(?:\(?\d{2,4}\)?[\s-]?)?\d{3,4}[\s-]?\d{3,4}\b/g;
const LONG_NUMBER_RE = /\b\d{10,}\b/g;

export interface SanitizeResult {
  text: string;
  redactions: number;
}

/** Redact common PII patterns before generation or logging. */
export function sanitizeNotes(input: string): SanitizeResult {
  let redactions = 0;
  const redact = (_m: string) => {
    redactions += 1;
    return '[REDACTED]';
  };
  let text = input.replace(EMAIL_RE, redact);
  text = text.replace(PHONE_RE, (m) => {
    // Avoid redacting short curriculum numbers like "2024" or "WAEC 2019"
    if (m.replace(/\D/g, '').length < 8) return m;
    return redact(m);
  });
  text = text.replace(LONG_NUMBER_RE, redact);
  return { text, redactions };
}

/** Aggregate-only metrics safe for public dashboards. */
export function publicMetrics(itemCount: number, chunkCount: number) {
  return {
    items_generated: itemCount,
    note_chunks: chunkCount,
    // Never include note text, user ids, or emails here
  };
}
