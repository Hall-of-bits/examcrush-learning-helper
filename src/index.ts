export type {
  PracticeItem,
  FlashcardItem,
  ClozeItem,
  McqItem,
  TrueFalseItem,
  GenerateOptions,
  GenerateResult,
  NoteChunk,
  ItemKind,
  SourceSpan,
} from './schema/types.js';

export { chunkNotes } from './chunk/chunkNotes.js';
export {
  generateFromNotes,
  generateFromChunks,
} from './generate/heuristic.js';
export { exportItems, type ExportFormat } from './export/formats.js';
export { sanitizeNotes, publicMetrics } from './privacy/sanitize.js';
export { PACKAGE_VERSION } from './version.js';
