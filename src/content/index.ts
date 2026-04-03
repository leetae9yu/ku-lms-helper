/**
 * Content script for KU LMS Helper
 *
 * Responsibilities:
 * - Detect page type (quiz vs video) on page load
 * - Listen for messages from popup
 * - Send page information to popup when requested
 */
import {
  type ExtensionMessage,
  type ExtensionResponse,
} from '../lib/page-types';
import {
  getLMSPageInfo,
  detectLMSPageType,
} from './detector';
import { extractQuizFromPage, looksLikeValidQuiz } from '../lib/quiz';
import { extractTranscriptFromPage } from '../lib/transcript';

console.log('[KU LMS Helper] Content script loaded');

/**
 * Store the current page info for quick access
 */
let currentPageInfo = getLMSPageInfo();

/**
 * Initialize page detection
 * Runs immediately when content script loads
 */
function initializePageDetection(): void {
  console.log('[KU LMS Helper] Initializing page detection...');

  const pageType = detectLMSPageType();
  console.log('[KU LMS Helper] Detected page type:', pageType);

  currentPageInfo = getLMSPageInfo();
  console.log('[KU LMS Helper] Page info:', currentPageInfo);

  try {
    chrome.runtime.sendMessage({
      type: 'PAGE_INFO',
      pageType,
      url: window.location.href,
      title: document.title,
    });
  } catch (error) {
    console.log('[KU LMS Helper] Could not send initial page info:', error);
  }
}

function handleMessage(
  request: ExtensionMessage,
  sender: chrome.runtime.MessageSender,
  sendResponse: (response: ExtensionResponse) => void,
): boolean {
  console.log('[KU LMS Helper] Received message:', request, 'from:', sender);

  if (request.type === 'GET_PAGE_INFO') {
    try {
      currentPageInfo = getLMSPageInfo();
      console.log('[KU LMS Helper] Sending page info:', currentPageInfo);
      sendResponse(currentPageInfo);
    } catch (error) {
      console.error('[KU LMS Helper] Error getting page info:', error);
      sendResponse({
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }

    return true;
  }

  if (request.type === 'EXTRACT_QUIZ') {
    try {
      const extraction = extractQuizFromPage();

      if (!looksLikeValidQuiz(extraction)) {
        sendResponse({
          error: '퀴즈 문항을 찾지 못했습니다. 페이지가 완전히 로드된 뒤 다시 시도해주세요.',
        });
        return true;
      }

      sendResponse({
        type: 'QUIZ_EXTRACTION_RESULT',
        data: extraction,
      });
    } catch (error) {
      console.error('[KU LMS Helper] Error extracting quiz:', error);
      sendResponse({
        error: error instanceof Error ? error.message : '퀴즈 추출 중 오류가 발생했습니다.',
      });
    }

    return true;
  }

  if (request.type === 'EXTRACT_TRANSCRIPT') {
    void (async () => {
      try {
        const extraction = await extractTranscriptFromPage();

        if (extraction.itemCount === 0) {
          sendResponse({
            error: '자막을 찾지 못했습니다. 자막 패널을 연 뒤 다시 시도해주세요.',
          });
          return;
        }

        sendResponse({
          type: 'TRANSCRIPT_EXTRACTION_RESULT',
          data: extraction,
        });
      } catch (error) {
        console.error('[KU LMS Helper] Error extracting transcript:', error);
        sendResponse({
          error: error instanceof Error ? error.message : '자막 추출 중 오류가 발생했습니다.',
        });
      }
    })();

    return true;
  }

  return false;
}

/**
 * Handle page navigation (SPA navigation detection)
 * KU LMS may use SPA navigation, so we need to detect URL changes
 */
function setupNavigationDetection(): void {
  let lastUrl = window.location.href;

  const observer = new MutationObserver(() => {
    const currentUrl = window.location.href;

    if (currentUrl !== lastUrl) {
      console.log('[KU LMS Helper] URL changed from', lastUrl, 'to', currentUrl);
      lastUrl = currentUrl;

      window.setTimeout(() => {
        initializePageDetection();
      }, 500);
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });

  window.addEventListener('popstate', () => {
    console.log('[KU LMS Helper] Popstate detected');
    window.setTimeout(() => {
      initializePageDetection();
    }, 500);
  });

  window.addEventListener('hashchange', () => {
    console.log('[KU LMS Helper] Hash change detected');
    window.setTimeout(() => {
      initializePageDetection();
    }, 500);
  });
}

/**
 * Main initialization
 */
function main(): void {
  console.log('[KU LMS Helper] Content script main() starting...');

  initializePageDetection();
  chrome.runtime.onMessage.addListener(handleMessage);
  setupNavigationDetection();

  console.log('[KU LMS Helper] Content script initialized successfully');
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', main);
} else {
  main();
}
