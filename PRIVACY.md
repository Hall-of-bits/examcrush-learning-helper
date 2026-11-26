# Privacy & child / youth safeguarding

Designed for UNICEF programme-country classrooms and youth learning programmes.

## Defaults

1. **Local-first** — generation runs on the machine that invokes the library/CLI. No telemetry endpoint is called by this package.
2. **Grounding** — items cite character offsets in the supplied notes so tutors can audit what was generated.
3. **Sanitize before share** — use `--sanitize` / `sanitizeNotes()` to redact emails, long phone-like numbers, and long digit strings before export or logging.
4. **Aggregate metrics only** — `publicMetrics()` returns counts, never note text or identifiers.

## Guidance for deployers

- Do not paste student names, guardian phones, or school IDs into note files when avoidable.
- Prefer curriculum text and anonymized worksheets.
- If you add an optional LLM provider later, keep it behind an explicit opt-in and strip PII first.

## Contact

ExamCrush Ltd — founders@examcrush.app
