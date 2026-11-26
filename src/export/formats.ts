import type { GenerateResult, PracticeItem } from '../schema/types.js';

export type ExportFormat = 'json' | 'anki-csv' | 'qti-lite';

export function exportItems(
  result: GenerateResult,
  format: ExportFormat,
): string {
  switch (format) {
    case 'json':
      return JSON.stringify(result, null, 2);
    case 'anki-csv':
      return toAnkiCsv(result.items);
    case 'qti-lite':
      return toQtiLite(result.items);
    default:
      throw new Error(`Unsupported format: ${format as string}`);
  }
}

/** Anki-compatible TSV: front\tback (no header). Clozes use the cloze text. */
function toAnkiCsv(items: PracticeItem[]): string {
  const rows: string[] = [];
  for (const item of items) {
    switch (item.kind) {
      case 'flashcard':
        rows.push(`${escapeTsv(item.front)}\t${escapeTsv(item.back)}`);
        break;
      case 'cloze':
        rows.push(`${escapeTsv(item.text)}\t`);
        break;
      case 'mcq': {
        const front = `${item.stem}\n${item.choices
          .map((c, i) => `${String.fromCharCode(65 + i)}. ${c}`)
          .join('\n')}`;
        const back = `${String.fromCharCode(65 + item.correctIndex)}. ${item.choices[item.correctIndex]}\n${item.explanation}`;
        rows.push(`${escapeTsv(front)}\t${escapeTsv(back)}`);
        break;
      }
      case 'true_false':
        rows.push(
          `${escapeTsv(`True or False: ${item.statement}`)}\t${escapeTsv(
            `${item.answer ? 'True' : 'False'}. ${item.explanation}`,
          )}`,
        );
        break;
    }
  }
  return rows.join('\n') + (rows.length ? '\n' : '');
}

/**
 * Minimal QTI-inspired XML for MCQ / true-false interchange.
 * Not a full IMS QTI package — enough for partners to map into LMS tools.
 */
function toQtiLite(items: PracticeItem[]): string {
  const blocks = items
    .filter((i) => i.kind === 'mcq' || i.kind === 'true_false')
    .map((item) => {
      if (item.kind === 'mcq') {
        const choices = item.choices
          .map(
            (c, i) =>
              `    <choice identifier="C${i}" correct="${i === item.correctIndex}">${escapeXml(c)}</choice>`,
          )
          .join('\n');
        return `  <item identifier="${escapeXml(item.id)}" type="mcq">\n    <prompt>${escapeXml(item.stem)}</prompt>\n${choices}\n  </item>`;
      }
      return `  <item identifier="${escapeXml(item.id)}" type="true_false">\n    <prompt>${escapeXml(item.statement)}</prompt>\n    <choice identifier="T" correct="${item.answer}">True</choice>\n    <choice identifier="F" correct="${!item.answer}">False</choice>\n  </item>`;
    });

  return `<?xml version="1.0" encoding="UTF-8"?>\n<qti-lite generator="examcrush-learning-helper">\n${blocks.join('\n')}\n</qti-lite>\n`;
}

function escapeTsv(s: string): string {
  return s.replace(/\t/g, ' ').replace(/\r?\n/g, '<br>');
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
