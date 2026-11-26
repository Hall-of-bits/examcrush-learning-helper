import { createHash } from 'node:crypto';
import type {
  GenerateOptions,
  GenerateResult,
  ItemKind,
  NoteChunk,
  PracticeItem,
} from '../schema/types.js';
import { chunkNotes } from '../chunk/chunkNotes.js';
import { PACKAGE_VERSION } from '../version.js';

const STOPWORDS = new Set(
  `a an the and or but if then else when at by for in of on to from with as is are was were be been being it this that these those i you he she we they them their our your not no yes do does did can could should would may might will just also into about over under again further once here there all any both each few more most other some such than too very`.split(
    /\s+/,
  ),
);

/**
 * Offline heuristic generator — no API keys required.
 * Designed for low-connectivity classrooms and UNICEF programme countries.
 * Grounds every item in a source span from the learner's own notes.
 */
export function generateFromNotes(
  notes: string,
  options: GenerateOptions = {},
): GenerateResult {
  const maxItems = options.maxItems ?? 20;
  const kinds = new Set<ItemKind>(
    options.kinds ?? ['flashcard', 'cloze', 'mcq', 'true_false'],
  );
  const tags = options.tags ?? [];
  const seed = options.seed ?? hashSeed(notes);
  const chunks = chunkNotes(notes);
  const items: PracticeItem[] = [];
  let seq = 0;

  const nextId = (kind: string) =>
    `elh_${kind}_${(++seq).toString().padStart(3, '0')}`;

  for (const chunk of chunks) {
    if (items.length >= maxItems) break;

    const definitions = extractDefinitions(chunk.text);
    const keyTerms = extractKeyTerms(chunk.text);

    if (kinds.has('flashcard')) {
      for (const def of definitions) {
        if (items.length >= maxItems) break;
        items.push({
          id: nextId('flashcard'),
          kind: 'flashcard',
          topic: chunk.title,
          difficulty: 'easy',
          source: {
            start: chunk.start,
            end: chunk.end,
            section: chunk.title,
          },
          tags: [...tags],
          front: `What is ${def.term}?`,
          back: def.definition,
        });
      }

      for (const term of keyTerms.slice(0, 2)) {
        if (items.length >= maxItems) break;
        if (definitions.some((d) => d.term.toLowerCase() === term.toLowerCase())) {
          continue;
        }
        const sentence = sentenceContaining(chunk.text, term);
        if (!sentence) continue;
        items.push({
          id: nextId('flashcard'),
          kind: 'flashcard',
          topic: chunk.title,
          difficulty: 'medium',
          source: {
            start: chunk.start,
            end: chunk.end,
            section: chunk.title,
          },
          tags: [...tags],
          front: `Explain: ${term}`,
          back: sentence,
        });
      }
    }

    if (kinds.has('cloze')) {
      for (const term of keyTerms.slice(0, 2)) {
        if (items.length >= maxItems) break;
        const sentence = sentenceContaining(chunk.text, term);
        if (!sentence || sentence.length < 30) continue;
        const cloze = sentence.replace(
          new RegExp(`\\b${escapeRegExp(term)}\\b`, 'i'),
          `{{c1::${term}}}`,
        );
        if (cloze === sentence) continue;
        items.push({
          id: nextId('cloze'),
          kind: 'cloze',
          topic: chunk.title,
          difficulty: 'medium',
          source: {
            start: chunk.start,
            end: chunk.end,
            section: chunk.title,
          },
          tags: [...tags],
          text: cloze,
          answers: [term],
        });
      }
    }

    if (kinds.has('mcq') && definitions.length > 0) {
      const def = definitions[0];
      if (items.length < maxItems) {
        const distractors = buildDistractors(def.term, keyTerms, seed + seq);
        const choices = shuffle(
          [def.definition, ...distractors].slice(0, 4),
          seed + seq,
        );
        const correctIndex = choices.indexOf(def.definition);
        if (correctIndex >= 0 && choices.length >= 3) {
          items.push({
            id: nextId('mcq'),
            kind: 'mcq',
            topic: chunk.title,
            difficulty: 'medium',
            source: {
              start: chunk.start,
              end: chunk.end,
              section: chunk.title,
            },
            tags: [...tags],
            stem: `Which of the following best defines ${def.term}?`,
            choices,
            correctIndex,
            explanation: `${def.term}: ${def.definition}`,
          });
        }
      }
    }

    if (kinds.has('true_false')) {
      const sentence = firstFactSentence(chunk.text);
      if (sentence && items.length < maxItems) {
        const flip = (seed + seq) % 2 === 0;
        items.push({
          id: nextId('tf'),
          kind: 'true_false',
          topic: chunk.title,
          difficulty: 'easy',
          source: {
            start: chunk.start,
            end: chunk.end,
            section: chunk.title,
          },
          tags: [...tags],
          statement: flip ? negateSentence(sentence) : sentence,
          answer: !flip,
          explanation: sentence,
        });
      }
    }
  }

  return {
    items: items.slice(0, maxItems),
    meta: {
      generator: 'examcrush-learning-helper',
      version: PACKAGE_VERSION,
      mode: 'heuristic',
      sourceChars: notes.length,
      chunkCount: chunks.length,
      generatedAt: new Date().toISOString(),
    },
  };
}

/** Re-export for advanced callers who already chunked notes. */
export function generateFromChunks(
  chunks: NoteChunk[],
  options: GenerateOptions = {},
): GenerateResult {
  const joined = chunks.map((c) => `## ${c.title}\n\n${c.text}`).join('\n\n');
  return generateFromNotes(joined, options);
}

function extractDefinitions(
  text: string,
): Array<{ term: string; definition: string }> {
  const out: Array<{ term: string; definition: string }> = [];
  const patterns = [
    /\b([A-Z][A-Za-z0-9\- ]{2,40}?)\s+(?:is|are|refers to|means)\s+([^.]{10,160})\./g,
    /\*\*([^*]{2,40})\*\*\s*[—:-]\s*([^\n.]{10,160})/g,
    /^([A-Z][A-Za-z0-9\- ]{2,40}):\s+([^\n]{10,160})$/gm,
  ];
  for (const re of patterns) {
    let m: RegExpExecArray | null;
    const r = new RegExp(re.source, re.flags);
    while ((m = r.exec(text)) !== null) {
      const term = m[1].trim();
      const definition = m[2].trim().replace(/\s+/g, ' ');
      if (term.split(/\s+/).length > 6) continue;
      if (STOPWORDS.has(term.toLowerCase())) continue;
      out.push({ term, definition });
    }
  }
  return dedupeBy(out, (d) => d.term.toLowerCase());
}

function extractKeyTerms(text: string): string[] {
  const words = text.match(/\b[A-Z][a-z]{3,}(?:\s+[A-Z][a-z]{3,})?\b/g) ?? [];
  const freq = new Map<string, number>();
  for (const w of words) {
    if (STOPWORDS.has(w.toLowerCase())) continue;
    freq.set(w, (freq.get(w) ?? 0) + 1);
  }
  return [...freq.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([w]) => w)
    .slice(0, 8);
}

function sentenceContaining(text: string, term: string): string | null {
  const sentences = text.split(/(?<=[.!?])\s+/);
  const re = new RegExp(`\\b${escapeRegExp(term)}\\b`, 'i');
  return sentences.find((s) => re.test(s) && s.length > 25)?.trim() ?? null;
}

function firstFactSentence(text: string): string | null {
  const sentences = text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 30 && s.length < 180);
  return sentences[0] ?? null;
}

function negateSentence(s: string): string {
  if (/\bis\b/i.test(s)) return s.replace(/\bis\b/i, 'is not');
  if (/\bare\b/i.test(s)) return s.replace(/\bare\b/i, 'are not');
  return `It is not true that ${s.charAt(0).toLowerCase()}${s.slice(1)}`;
}

function buildDistractors(
  term: string,
  keyTerms: string[],
  seed: number,
): string[] {
  const pool = [
    `A process unrelated to ${term}`,
    `An outdated theory about ${term}`,
    `A measurement unit used in ${term}`,
    ...keyTerms
      .filter((t) => t.toLowerCase() !== term.toLowerCase())
      .slice(0, 3)
      .map((t) => `A concept closely associated with ${t}, not ${term}`),
  ];
  return shuffle(pool, seed).slice(0, 3);
}

function shuffle<T>(arr: T[], seed: number): T[] {
  const a = [...arr];
  let s = seed >>> 0;
  for (let i = a.length - 1; i > 0; i--) {
    s = (s * 1664525 + 1013904223) >>> 0;
    const j = s % (i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function hashSeed(s: string): number {
  const h = createHash('sha256').update(s).digest();
  return h.readUInt32BE(0);
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function dedupeBy<T>(arr: T[], key: (t: T) => string): T[] {
  const seen = new Set<string>();
  const out: T[] = [];
  for (const item of arr) {
    const k = key(item);
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(item);
  }
  return out;
}
