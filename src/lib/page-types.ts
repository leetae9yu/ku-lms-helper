/**
 * Page type definitions and detection utilities
 */

import type { QuizExtraction } from './quiz/types';

export type PageType = 'quiz' | 'unknown';

/**
 * Message interface for communication between content script and popup
 */
export interface PageInfoMessage {
  type: 'PAGE_INFO';
  pageType: PageType;
  url: string;
  title: string;
}

/**
 * Request interface for querying page info from popup
 */
export interface PageInfoRequest {
  type: 'GET_PAGE_INFO';
}

export interface ExtractQuizRequest {
  type: 'EXTRACT_QUIZ';
}

export interface QuizExtractionResultMessage {
  type: 'QUIZ_EXTRACTION_RESULT';
  data: QuizExtraction;
}

export interface ErrorResponseMessage {
  error: string;
}

/**
 * Union type for all message types
 */
export type ExtensionMessage =
  | PageInfoMessage
  | PageInfoRequest
  | ExtractQuizRequest;

export type ExtensionResponse =
  | PageInfoMessage
  | QuizExtractionResultMessage
  | ErrorResponseMessage;

/**
 * Check if the current page is a quiz page
 * Detects quiz pages by:
 * - URL containing '/quiz' pattern
 * - Presence of quiz-related DOM elements
 * - Quiz score or question elements
 */
export function isQuizPage(url: string = window.location.href): boolean {
  const urlLower = url.toLowerCase();

  if (urlLower.includes('/quiz') || urlLower.includes('quiz')) {
    return true;
  }

  if (typeof document !== 'undefined') {
    const quizSelectors = [
      '.question_holder',
      '.display_question',
      '.quiz_score',
      '.quiz-header',
      '[data-testid="quiz"]',
      '.question_text',
      '.answer_text',
    ];

    for (const selector of quizSelectors) {
      if (document.querySelector(selector)) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Detect the page type based on URL and DOM
 */
export function detectPageType(url: string = window.location.href): PageType {
  if (isQuizPage(url)) {
    return 'quiz';
  }

  return 'unknown';
}

/**
 * Get page information for messaging
 */
export function getPageInfo(): PageInfoMessage {
  return {
    type: 'PAGE_INFO',
    pageType: detectPageType(),
    url: window.location.href,
    title: document.title,
  };
}
