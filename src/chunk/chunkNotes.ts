import type { NoteChunk } from '../schema/types.js';

/**
 * Split study notes into grounded chunks by markdown/heading boundaries
 * or blank-line paragraphs. Offsets stay aligned to the original string
 * so every practice item can cite its source span.
 */
export function chunkNotes(raw: string): NoteChunk[] {
  const text = raw.replace(/\r\n/g, '\n');
  if (!text.trim()) return [];

  const headingSplit = /(?=^#{1,3}\s+.+$)/m;
  const parts = text.split(headingSplit).filter((p) => p.trim().length > 0);

  const chunks: NoteChunk[] = [];
  let cursor = 0;

  for (const part of parts) {
    const start = text.indexOf(part, cursor);
    const end = start + part.length;
    cursor = end;

    const lines = part.split('\n');
    const headingMatch = lines[0]?.match(/^#{1,3}\s+(.+)$/);
    const title = headingMatch
      ? headingMatch[1].trim()
      : firstSentence(part) || 'Untitled section';
    const body = headingMatch ? lines.slice(1).join('\n').trim() : part.trim();

    if (body.length < 40 && !headingMatch) {
      // Very short stray paragraphs — merge later via paragraph fallback
      continue;
    }

    if (body.length >= 40) {
      chunks.push({
        id: `chunk_${chunks.length + 1}`,
        title,
        text: body,
        start: headingMatch ? start + (lines[0]?.length ?? 0) + 1 : start,
        end,
      });
    }
  }

  if (chunks.length === 0) {
    return paragraphChunks(text);
  }

  return chunks;
}

function paragraphChunks(text: string): NoteChunk[] {
  const chunks: NoteChunk[] = [];
  const re = /(.+?)(?:\n\s*\n|$)/gs;
  let match: RegExpExecArray | null;
  while ((match = re.exec(text)) !== null) {
    const body = match[1].trim();
    if (body.length < 40) continue;
    chunks.push({
      id: `chunk_${chunks.length + 1}`,
      title: firstSentence(body) || `Section ${chunks.length + 1}`,
      text: body,
      start: match.index,
      end: match.index + match[0].length,
    });
  }
  return chunks;
}

function firstSentence(s: string): string {
  const cleaned = s.replace(/^#+\s+/, '').trim();
  const m = cleaned.match(/^(.{8,80}?)([.!?\n]|$)/);
  return (m?.[1] ?? cleaned.slice(0, 60)).trim();
}
