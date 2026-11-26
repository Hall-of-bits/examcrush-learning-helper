#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { generateFromNotes } from '../generate/heuristic.js';
import { exportItems, type ExportFormat } from '../export/formats.js';
import { sanitizeNotes } from '../privacy/sanitize.js';
import { PACKAGE_VERSION } from '../version.js';

function usage(): never {
  console.log(`examcrush-learning-helper v${PACKAGE_VERSION}

Usage:
  examcrush-learning-helper generate <notes.md> [--format json|anki-csv|qti-lite] [--out path] [--max N] [--sanitize]

Examples:
  examcrush-learning-helper generate examples/waec-biology-notes.md --format json
  examcrush-learning-helper generate notes.txt --format anki-csv --out deck.csv --sanitize
`);
  process.exit(1);
}

function main(argv: string[]): void {
  const [cmd, ...rest] = argv;
  if (!cmd || cmd === '-h' || cmd === '--help') usage();

  if (cmd !== 'generate') {
    console.error(`Unknown command: ${cmd}`);
    usage();
  }

  const file = rest.find((a) => !a.startsWith('--'));
  if (!file) usage();

  const format = (flagValue(rest, '--format') ?? 'json') as ExportFormat;
  const out = flagValue(rest, '--out');
  const maxRaw = flagValue(rest, '--max');
  const maxItems = maxRaw ? Number(maxRaw) : 20;
  const doSanitize = rest.includes('--sanitize');

  let notes = readFileSync(resolve(file), 'utf8');
  if (doSanitize) {
    const s = sanitizeNotes(notes);
    notes = s.text;
    console.error(`sanitized: ${s.redactions} redaction(s)`);
  }

  const result = generateFromNotes(notes, {
    maxItems,
    tags: ['examcrush-learning-helper'],
  });
  const payload = exportItems(result, format);

  if (out) {
    writeFileSync(resolve(out), payload, 'utf8');
    console.error(
      `wrote ${result.items.length} items → ${out} (${format}; ${result.meta.chunkCount} chunks)`,
    );
  } else {
    process.stdout.write(payload);
  }
}

function flagValue(args: string[], name: string): string | undefined {
  const i = args.indexOf(name);
  if (i === -1) return undefined;
  return args[i + 1];
}

main(process.argv.slice(2));
