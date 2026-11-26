/** Shared item schema for active-recall practice items. */

export type ItemKind = 'flashcard' | 'cloze' | 'mcq' | 'true_false';

export interface SourceSpan {
  /** 0-based start character offset in the source note text */
  start: number;
  /** 0-based end character offset (exclusive) */
  end: number;
  /** Optional human-readable section title */
  section?: string;
}

export interface BaseItem {
  id: string;
  kind: ItemKind;
  /** Short topic / heading derived from the note */
  topic: string;
  /** Difficulty hint for tutors / adaptive engines */
  difficulty: 'easy' | 'medium' | 'hard';
  /** Grounding: where in the note this came from */
  source: SourceSpan;
  /** Tags for curriculum mapping (e.g. WAEC, biology) */
  tags: string[];
}

export interface FlashcardItem extends BaseItem {
  kind: 'flashcard';
  front: string;
  back: string;
}

export interface ClozeItem extends BaseItem {
  kind: 'cloze';
  /** Text with {{c1::answer}} style cloze markers */
  text: string;
  answers: string[];
}

export interface McqItem extends BaseItem {
  kind: 'mcq';
  stem: string;
  choices: string[];
  /** 0-based index into choices */
  correctIndex: number;
  explanation: string;
}

export interface TrueFalseItem extends BaseItem {
  kind: 'true_false';
  statement: string;
  answer: boolean;
  explanation: string;
}

export type PracticeItem = FlashcardItem | ClozeItem | McqItem | TrueFalseItem;

export interface GenerateOptions {
  /** Max practice items to produce (default 20) */
  maxItems?: number;
  /** Prefer these kinds; default all */
  kinds?: ItemKind[];
  /** Extra tags applied to every item */
  tags?: string[];
  /** Deterministic seed for distractor shuffle */
  seed?: number;
}

export interface GenerateResult {
  items: PracticeItem[];
  meta: {
    generator: 'examcrush-learning-helper';
    version: string;
    mode: 'heuristic';
    sourceChars: number;
    chunkCount: number;
    generatedAt: string;
  };
}

export interface NoteChunk {
  id: string;
  title: string;
  text: string;
  start: number;
  end: number;
}
