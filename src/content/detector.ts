/**
 * Content script page detector
 * Detects quiz pages on Korea University LMS
 */
import { 
  PageType, 
  PageInfoMessage, 
  isQuizPage
} from '../lib/page-types';

export type { PageType, PageInfoMessage };
export { isQuizPage };

/**
 * Detect quiz page with LMS-specific selectors
 */
export function detectQuizPageLMS(): boolean {
  // Korea University LMS quiz page selectors
  const lmsQuizSelectors = [
    // Quiz question containers
    '.question_holder',
    '.display_question',
    // Quiz header/score elements
    '.quiz-header',
    '.quiz_score',
    '.quiz-submission',
    // Question text and answers
    '.question_text',
    '.answer_text',
    '.select_answer',
    // Canvas LMS specific
    '#questions',
    '.quiz_content',
    // Generic quiz indicators
    '[id*="quiz"]',
    '[class*="quiz"]'
  ];
  
  for (const selector of lmsQuizSelectors) {
    try {
      const element = document.querySelector(selector);
      if (element) {
        console.log('[KU LMS Helper] Quiz detected via selector:', selector);
        return true;
      }
    } catch (e) {
      // Invalid selector, skip
      continue;
    }
  }
  
  // Check URL patterns specific to KU LMS
  const url = window.location.href.toLowerCase();
  const quizUrlPatterns = [
    '/quiz',
    '/quizzes/',
    'quiz_id=',
    'take?quiz'
  ];
  
  for (const pattern of quizUrlPatterns) {
    if (url.includes(pattern)) {
      console.log('[KU LMS Helper] Quiz detected via URL pattern:', pattern);
      return true;
    }
  }
  
  return false;
}

/**
 * Detect page type specifically for KU LMS
 */
export function detectLMSPageType(): PageType {
  // Check for quiz first (more specific)
  if (detectQuizPageLMS()) {
    return 'quiz';
  }

  return 'unknown';
}

/**
 * Get detailed page info for KU LMS
 */
export function getLMSPageInfo(): PageInfoMessage {
  return {
    type: 'PAGE_INFO',
    pageType: detectLMSPageType(),
    url: window.location.href,
    title: document.title
  };
}
