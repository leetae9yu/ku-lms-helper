/**
 * Quiz Extraction Module
 *
 * Extract quiz questions, answers, and explanations from Korea University LMS
 * quiz result pages.
 *
 * @example
 * ```typescript
 * import { extractQuizFromPage, formatQuizOutput, isQuizResultsPage } from './quiz';
 *
 * if (isQuizResultsPage()) {
 *   const quiz = extractQuizFromPage();
 *   const jsonOutput = formatQuizOutput(quiz, 'json');
 *   console.log(jsonOutput);
 * }
 * ```
 */

// Export types
export type {
  QuizTextBlock,
  QuizAnswer,
  QuizQuestion,
  QuizMeta,
  QuizExtraction,
  QuizOutputFormat,
  // Legacy aliases
  CanvasQuizTextBlock,
  CanvasQuizAnswer,
  CanvasQuizQuestion,
  CanvasQuizMeta,
  CanvasQuizExtraction,
  CanvasQuizOutputFormat,
} from "./types";

// Export extraction functions
export {
  extractQuizFromPage,
  extractAnswers,
  formatQuizOutput,
  formatQuizAsText,
  isQuizResultsPage,
  looksLikeValidQuiz,
  downloadQuizAsFile,
} from "./extractor";

export {
  formatQuizAsTxt,
  formatQuizAsJson,
} from './formatter';
