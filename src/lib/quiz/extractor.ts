/**
 * Quiz Extraction Core
 * 
 * Extracts quiz questions, answers, and explanations from Korea University LMS
 * quiz result pages using native DOM APIs (no JSDOM - designed for content scripts).
 * 
 * Based on Canvas LMS quiz format.
 */

import type {
  QuizExtraction,
  QuizMeta,
  QuizQuestion,
  QuizAnswer,
  QuizTextBlock,
  QuizOutputFormat,
} from "./types";
import { downloadAsJson, downloadAsTxt, generateFilename } from '../download';
import { formatQuizAsJson, formatQuizAsTxt } from './formatter';

/**
 * Collapse multiple whitespace characters into single spaces
 */
function collapseWhitespace(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

/**
 * Decode HTML entities (basic implementation)
 */
function decodeHtml(value: string): string {
  const textarea = document.createElement("textarea");
  textarea.innerHTML = value;
  return textarea.value.replace(/&nbsp;/g, " ").trim();
}

/**
 * Extract text block from an element
 */
function extractTextBlock(element: Element | null | undefined): QuizTextBlock | undefined {
  if (!element) {
    return undefined;
  }

  const text = collapseWhitespace(element.textContent ?? "");
  const html = collapseWhitespace(decodeHtml(element.innerHTML));

  if (text.length === 0 && html.length === 0) {
    return undefined;
  }

  return {
    text,
    html: html.length > 0 ? html : undefined,
  };
}

/**
 * Get preferred text representation (plain text first, then HTML)
 */
function preferredText(block: QuizTextBlock | undefined): string {
  if (!block) {
    return "";
  }

  return block.text.length > 0 ? block.text : block.html ?? "";
}

/**
 * Find first non-empty text block matching any of the selectors
 */
function firstNonEmptyBlock(
  root: ParentNode,
  selectors: string[],
): QuizTextBlock | undefined {
  for (const selector of selectors) {
    const block = extractTextBlock(root.querySelector(selector));
    if (block && (block.text.length > 0 || (block.html?.length ?? 0) > 0)) {
      return block;
    }
  }

  return undefined;
}

/**
 * Extract quiz metadata from the page
 */
function extractQuizMeta(): QuizMeta {
  const title = collapseWhitespace(
    document.querySelector("#quiz_title")?.textContent ?? "",
  );
  const score = collapseWhitespace(
    document.querySelector(".quiz_score .score_value")?.textContent ?? "",
  );

  // Extract submission info from quiz-submission section
  const metaLines = Array.from(
    document.querySelectorAll<HTMLDivElement>(".quiz-submission > div"),
  )
    .map((element) => collapseWhitespace(element.textContent ?? ""))
    .filter((line) => line.length > 0);

  const submittedAt = metaLines.find((line) => line.includes("제출"));
  const duration =
    collapseWhitespace(
      document.querySelector(".quiz_duration")?.textContent ?? "",
    ) || undefined;

  return {
    title: title.length > 0 ? title : undefined,
    score: score.length > 0 ? score : undefined,
    submittedAt,
    duration,
  };
}

/**
 * Extract question comment/explanation
 */
function extractQuestionComment(questionElement: Element): QuizTextBlock | undefined {
  return firstNonEmptyBlock(questionElement, [
    ".question_comments .question_comment_html",
    ".question_comments .question_comment_text",
    ".question_comments .quiz_comment",
    ".after_answers .question_comment_html",
    ".after_answers .question_comment_text",
    ".after_answers .quiz_comment",
  ]);
}

/**
 * Extract all questions from the page
 */
function extractQuestions(): QuizQuestion[] {
  const questionElements = Array.from(
    document.querySelectorAll<HTMLElement>(
      ".question_holder .display_question.question",
    ),
  );

  return questionElements
    .map((questionElement, questionIndex) => {
      // Extract question label
      const label = collapseWhitespace(
        questionElement.querySelector(".question_name")?.textContent ?? "",
      );

      // Extract question text
      const questionBlock = firstNonEmptyBlock(questionElement, [
        ".question_text.user_content",
        "[id^='question_'][id$='_question_text'].question_text",
        ".question_text",
      ]);

      // Extract answers
      const answerElements = Array.from(
        questionElement.querySelectorAll<HTMLElement>(
          ".answers_wrapper > .answer, .answers .answer, .answer_group .answer",
        ),
      );

      const extractedAnswers = answerElements
        .map((answerElement) => {
          // Extract answer text
          const answerBlock = firstNonEmptyBlock(answerElement, [
            ".answer_html",
            ".answer_text",
            ".answer_match_left_html",
            ".answer_match_left",
          ]);

          // Extract answer comment
          const comment = firstNonEmptyBlock(answerElement, [
            ".quiz_comment .answer_comment_html",
            ".quiz_comment .answer_comment",
            ".answer_comment_html",
            ".answer_comment",
          ]);

          return {
            index: 0, // Will be assigned after filtering
            text: preferredText(answerBlock),
            html: answerBlock?.html,
            isCorrect: answerElement.classList.contains("correct_answer"),
            isSelected: answerElement.classList.contains("selected_answer"),
            comment,
          } satisfies Omit<QuizAnswer, "index"> & { index: number };
        })
        .filter(
          (answer) => answer.text.length > 0 || (answer.html?.length ?? 0) > 0,
        );

      // Assign proper indexes (1-based)
      const answers = extractedAnswers.map((answer, answerIndex) => ({
        ...answer,
        index: answerIndex + 1,
      }));

      return {
        index: questionIndex + 1,
        label: label.length > 0 ? label : undefined,
        text: preferredText(questionBlock),
        html: questionBlock?.html,
        answers,
        correctAnswerIndexes: answers
          .filter((answer) => answer.isCorrect)
          .map((answer) => answer.index),
        selectedAnswerIndexes: answers
          .filter((answer) => answer.isSelected)
          .map((answer) => answer.index),
        questionComment: extractQuestionComment(questionElement),
      } satisfies QuizQuestion;
    })
    .filter(
      (question) => question.text.length > 0 || (question.html?.length ?? 0) > 0,
    );
}

/**
 * Extract answers for a specific question element
 * Exported for potential individual question extraction use cases
 */
export function extractAnswers(questionElement: Element): QuizAnswer[] {
  const answerElements = Array.from(
    questionElement.querySelectorAll<HTMLElement>(
      ".answers_wrapper > .answer, .answers .answer, .answer_group .answer",
    ),
  );

  const extractedAnswers = answerElements
    .map((answerElement) => {
      const answerBlock = firstNonEmptyBlock(answerElement, [
        ".answer_html",
        ".answer_text",
        ".answer_match_left_html",
        ".answer_match_left",
      ]);

      const comment = firstNonEmptyBlock(answerElement, [
        ".quiz_comment .answer_comment_html",
        ".quiz_comment .answer_comment",
        ".answer_comment_html",
        ".answer_comment",
      ]);

      return {
        index: 0,
        text: preferredText(answerBlock),
        html: answerBlock?.html,
        isCorrect: answerElement.classList.contains("correct_answer"),
        isSelected: answerElement.classList.contains("selected_answer"),
        comment,
      } satisfies Omit<QuizAnswer, "index"> & { index: number };
    })
    .filter(
      (answer) => answer.text.length > 0 || (answer.html?.length ?? 0) > 0,
    );

  return extractedAnswers.map((answer, answerIndex) => ({
    ...answer,
    index: answerIndex + 1,
  }));
}

/**
 * Main entry point: Extract complete quiz data from the current page
 */
export function extractQuizFromPage(): QuizExtraction {
  return {
    url: window.location.href,
    extractedAt: new Date().toISOString(),
    meta: extractQuizMeta(),
    questions: extractQuestions(),
  };
}

/**
 * Check if current page looks like a Canvas quiz results page
 */
export function isQuizResultsPage(): boolean {
  // Check URL patterns
  const url = window.location.href.toLowerCase();
  if (url.includes("/quizzes/") && (url.includes("/history") || url.includes("/take"))) {
    return true;
  }

  // Check for quiz-specific elements
  const hasQuizElements =
    document.querySelector(".question_holder .display_question.question") !== null ||
    document.querySelector("#quiz_title") !== null ||
    document.querySelector(".quiz_score") !== null;

  return hasQuizElements;
}

/**
 * Check if extracted quiz data looks valid
 */
export function looksLikeValidQuiz(extraction: QuizExtraction): boolean {
  return extraction.questions.length > 0;
}

/**
 * Format quiz extraction as human-readable text
 */
export function formatQuizAsText(extraction: QuizExtraction): string {
  return formatQuizAsTxt(extraction);
}

/**
 * Format quiz extraction as formatted output
 * Main formatting entry point that supports multiple output formats
 */
export function formatQuizOutput(
  extraction: QuizExtraction,
  format: QuizOutputFormat = "json",
): string {
  switch (format) {
    case "text":
      return formatQuizAsTxt(extraction);
    case "json":
    default:
      return formatQuizAsJson(extraction);
  }
}

/**
 * Download quiz extraction as a file
 */
export function downloadQuizAsFile(
  extraction: QuizExtraction,
  format: QuizOutputFormat = "json",
): void {
  const content = formatQuizOutput(extraction, format);
  const title = extraction.meta.title ?? extraction.questions[0]?.text ?? 'quiz';
  const filename = generateFilename('quiz', title, format === 'json' ? 'json' : 'txt');

  if (format === 'json') {
    downloadAsJson(content, filename);
    return;
  }

  downloadAsTxt(content, filename);
}
