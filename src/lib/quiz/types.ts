/**
 * Quiz Extraction Types
 * 
 * Type definitions for extracting quiz data from Korea University LMS (Canvas-based)
 */

/** Text block with both plain text and optional HTML */
export interface QuizTextBlock {
  text: string;
  html?: string;
}

/** Individual answer option */
export interface QuizAnswer {
  /** Answer index (1-based) */
  index: number;
  /** Plain text content */
  text: string;
  /** Optional HTML content */
  html?: string;
  /** Whether this is the correct answer */
  isCorrect: boolean;
  /** Whether this answer was selected by the user */
  isSelected: boolean;
  /** Optional comment/explanation for this specific answer */
  comment?: QuizTextBlock;
}

/** Quiz question with answers */
export interface QuizQuestion {
  /** Question index (1-based) */
  index: number;
  /** Optional question label (e.g., "Question 1") */
  label?: string;
  /** Question text content */
  text: string;
  /** Optional HTML content */
  html?: string;
  /** Array of answer options */
  answers: QuizAnswer[];
  /** Indexes of correct answers */
  correctAnswerIndexes: number[];
  /** Indexes of answers selected by user */
  selectedAnswerIndexes: number[];
  /** Optional question-level comment/explanation */
  questionComment?: QuizTextBlock;
}

/** Quiz metadata */
export interface QuizMeta {
  /** Quiz title */
  title?: string;
  /** Score achieved */
  score?: string;
  /** Submission timestamp */
  submittedAt?: string;
  /** Duration spent on quiz */
  duration?: string;
}

/** Complete quiz extraction result */
export interface QuizExtraction {
  /** Source URL */
  url: string;
  /** ISO timestamp of extraction */
  extractedAt: string;
  /** Quiz metadata */
  meta: QuizMeta;
  /** Array of questions */
  questions: QuizQuestion[];
}

/** Output format options */
export type QuizOutputFormat = "json" | "text";

/** Legacy alias for backward compatibility with Canvas naming */
export type CanvasQuizTextBlock = QuizTextBlock;
export type CanvasQuizAnswer = QuizAnswer;
export type CanvasQuizQuestion = QuizQuestion;
export type CanvasQuizMeta = QuizMeta;
export type CanvasQuizExtraction = QuizExtraction;
export type CanvasQuizOutputFormat = QuizOutputFormat;
