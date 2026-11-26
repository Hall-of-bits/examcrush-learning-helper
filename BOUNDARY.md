# Open-source boundary

This repository is the **bounded MIT module** ExamCrush committed for UNICEF Venture Fund review.

## In scope (this repo — MIT)

- Note chunking with source offsets
- Offline heuristic generation of flashcards, cloze, MCQ drafts, and true/false items
- Export to JSON, Anki-compatible TSV, and QTI-lite XML
- Local PII sanitization helpers
- CLI for schools / NGOs / partners with no API key required

## Out of scope (ExamCrush proprietary product)

- Mobile/web ExamCrush apps (iOS, Android, Web)
- Production LLM generation pipelines, ranking, paywalls, auth, analytics
- User accounts, subscriptions, Paystack billing
- Lecturer classroom sync and institutional admin tools
- Trained/fine-tuned models and prompt packs used in production

Partners may run this helper standalone or call it from their own stack. Integrating it into the commercial ExamCrush product does **not** open-source that product.
