# ExamCrush Learning Helper

**MIT-licensed, local-first active-recall helper** that turns study notes into flashcards, cloze deletions, MCQ drafts, and true/false items — with source grounding, privacy sanitization, and classroom-friendly exports.

Built by [ExamCrush Ltd](https://www.examcrush.app) (Nigeria) as the **bounded open-source module** for UNICEF Venture Fund engagement. The commercial ExamCrush apps remain proprietary — see [BOUNDARY.md](./BOUNDARY.md).

[![CI](https://github.com/Hall-of-bits/examcrush-learning-helper/actions/workflows/ci.yml/badge.svg)](https://github.com/Hall-of-bits/examcrush-learning-helper/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](./LICENSE)

## Why this exists

Millions of adolescents prepare for high-stakes exams with scarce personalized practice. This package gives schools, youth NGOs, and UNICEF partners a **reusable generator** that:

- Works **offline** (no API key required)
- Stays **grounded** in the learner’s own notes (character offsets)
- Exports to formats tutors already use (**JSON**, **Anki CSV**, **QTI-lite**)
- Defaults to **youth-safe** local processing ([PRIVACY.md](./PRIVACY.md))

## Quick start

```bash
npm install
npm test
npm run build

# Generate from sample WAEC-style biology notes
npx examcrush-learning-helper generate examples/waec-biology-notes.md --format json
npx examcrush-learning-helper generate examples/waec-biology-notes.md --format anki-csv --out /tmp/deck.csv
```

### Library

```ts
import { generateFromNotes, exportItems, sanitizeNotes } from '@examcrush/learning-helper';

const notes = `# Osmosis\nOsmosis is the movement of water across a semi-permeable membrane.`;
const { text } = sanitizeNotes(notes);
const result = generateFromNotes(text, { maxItems: 10, tags: ['biology'] });
console.log(exportItems(result, 'json'));
```

## Item kinds

| Kind | Description |
|------|-------------|
| `flashcard` | Prompt / answer pairs from definitions and key terms |
| `cloze` | Sentence cloze with `{{c1::answer}}` markers |
| `mcq` | Definition stems with shuffled distractors |
| `true_false` | Fact statements (sometimes negated) with explanations |

Every item includes `source: { start, end, section }` pointing back into the note text.

## Architecture (v0.1)

```
notes.md ──► chunkNotes() ──► heuristic generateFromNotes() ──► exportItems()
                 │                      │
                 │                      ├── flashcard / cloze / mcq / true_false
                 │                      └── deterministic seed for shuffle
                 └── source offsets preserved
```

Future optional LLM adapters can plug in **behind an explicit interface** without removing the offline path (see roadmap).

## UNICEF / Digital Public Good alignment

| Principle | How this repo helps |
|-----------|---------------------|
| Open source | MIT license, public GitHub |
| Do no harm | Local-first; sanitize helpers; no default telemetry |
| Use & improve | Documented CLI + library API + tests |
| Be scalable | Pure TypeScript/Node ≥18; no GPU required |
| Be designed for equity | Offline heuristic path for low-connectivity contexts |

UNICEF Venture Fund reviewers: please use GitHub user **`@unicefinnovation`** — collaborators are invited on this repository.

## Roadmap

- [ ] Optional LLM provider interface (opt-in; sanitize-first)
- [ ] Richer curriculum tag packs (WAEC / JAMB / tertiary)
- [ ] Public aggregate metrics sample dashboard (counts only)
- [ ] Language detection for non-English notes

## Company

- **Legal:** ExamCrush Ltd · RC 7553819 · Lagos, Nigeria  
- **Product:** https://www.examcrush.app  
- **Contact:** founders@examcrush.app  

## License

[MIT](./LICENSE) © 2026 ExamCrush Ltd
