import { generateFromNotes } from '../src/generate/heuristic.js';
import { chunkNotes } from '../src/chunk/chunkNotes.js';
import { exportItems } from '../src/export/formats.js';
import { sanitizeNotes } from '../src/privacy/sanitize.js';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const sample = readFileSync(resolve(root, 'examples/waec-biology-notes.md'), 'utf8');

describe('chunkNotes', () => {
  it('splits sample notes into multiple grounded chunks', () => {
    const chunks = chunkNotes(sample);
    expect(chunks.length).toBeGreaterThanOrEqual(3);
    expect(chunks[0].title.toLowerCase()).toContain('photosynthesis');
  });
});

describe('generateFromNotes', () => {
  it('produces mixed practice items grounded in the notes', () => {
    const result = generateFromNotes(sample, { maxItems: 12, seed: 42 });
    expect(result.items.length).toBeGreaterThan(3);
    expect(result.meta.mode).toBe('heuristic');
    expect(result.meta.chunkCount).toBeGreaterThan(0);

    const kinds = new Set(result.items.map((i) => i.kind));
    expect(kinds.size).toBeGreaterThan(1);

    for (const item of result.items) {
      expect(item.source.end).toBeGreaterThan(item.source.start);
      expect(item.topic.length).toBeGreaterThan(0);
    }
  });

  it('is deterministic for a fixed seed', () => {
    const a = generateFromNotes(sample, { maxItems: 8, seed: 7 });
    const b = generateFromNotes(sample, { maxItems: 8, seed: 7 });
    expect(a.items.map((i) => i.id)).toEqual(b.items.map((i) => i.id));
    expect(a.items.map((i) => i.kind)).toEqual(b.items.map((i) => i.kind));
  });
});

describe('exportItems', () => {
  it('exports JSON and Anki CSV', () => {
    const result = generateFromNotes(sample, { maxItems: 6, seed: 1 });
    const json = exportItems(result, 'json');
    expect(JSON.parse(json).items.length).toBe(result.items.length);

    const csv = exportItems(result, 'anki-csv');
    expect(csv.split('\n').filter(Boolean).length).toBeGreaterThan(0);
  });
});

describe('sanitizeNotes', () => {
  it('redacts emails without destroying curriculum text', () => {
    const { text, redactions } = sanitizeNotes(
      'Contact tutor@school.ng about Photosynthesis is the process by which green plants convert light.',
    );
    expect(redactions).toBeGreaterThanOrEqual(1);
    expect(text).toContain('[REDACTED]');
    expect(text.toLowerCase()).toContain('photosynthesis');
  });
});
