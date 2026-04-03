/**
 * Content script page detector
 * Detects quiz and video pages on Korea University LMS
 */
import { 
  PageType, 
  PageInfoMessage, 
  detectPageType, 
  getPageInfo,
  isQuizPage,
  isVideoPage 
} from '../lib/page-types';

export type { PageType, PageInfoMessage };
export { isQuizPage, isVideoPage };

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
 * Detect video/transcript page with LMS-specific selectors
 */
export function detectVideoPageLMS(): boolean {
  // Korea University LMS video/lecture page selectors
  const lmsVideoSelectors = [
    // Video containers
    'video',
    '.video-js',
    '.video-player',
    // KU specific video platforms
    '#kollus-player',
    '[class*="kollus"]',
    // Lecture content areas
    '.lecture-content',
    '.lecture-video',
    // Iframes containing video
    'iframe[src*="kucom.korea.ac.kr"]',
    'iframe[src*="video"]',
    'iframe[src*="player"]',
    'iframe[src*="kollus"]'
  ];
  
  for (const selector of lmsVideoSelectors) {
    try {
      const element = document.querySelector(selector);
      if (element) {
        console.log('[KU LMS Helper] Video detected via selector:', selector);
        return true;
      }
    } catch (e) {
      // Invalid selector, skip
      continue;
    }
  }
  
  // Check URL patterns specific to KU LMS
  const url = window.location.href.toLowerCase();
  const videoUrlPatterns = [
    '/lecture',
    '/lectures/',
    '/video',
    '/videos/',
    'lecture_id=',
    'module_item_id=' // Often used for lecture content
  ];
  
  for (const pattern of videoUrlPatterns) {
    if (url.includes(pattern)) {
      console.log('[KU LMS Helper] Video detected via URL pattern:', pattern);
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
  
  // Then check for video/lecture
  if (detectVideoPageLMS()) {
    return 'transcript';
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
