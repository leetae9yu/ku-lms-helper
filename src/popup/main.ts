/**
 * Popup script for KU LMS Helper
 */
import '../styles/global.css';
import './popup.css';
import { downloadQuizAsFile, type QuizExtraction } from '../lib/quiz';
import {
  type ExtensionMessage,
  type ExtensionResponse,
  type PageInfoMessage,
  type PageInfoRequest,
  type QuizExtractionResultMessage,
} from '../lib/page-types';

console.log('[KU LMS Helper] Popup script loaded');

const elements = {
  appRoot: document.getElementById('app'),
  loadingState: document.getElementById('loading-state'),
  readyState: document.getElementById('ready-state'),
  errorState: document.getElementById('error-state'),
  errorMessage: document.getElementById('error-message'),
  extractQuizBtn: document.getElementById('extract-quiz-btn'),
  actionStatus: document.getElementById('action-status'),
  retryBtn: document.getElementById('retry-btn'),
  themeToggleBtn: document.getElementById('theme-toggle-btn'),
} as const;

type PopupState = 'loading' | 'ready' | 'error';
type ThemePreference = 'system' | 'light' | 'dark';
type ActionStatusTone = 'loading' | 'success' | 'error';

const THEME_STORAGE_KEY = 'ku-lms-helper-theme-preference';
const THEME_SEQUENCE: ThemePreference[] = ['system', 'dark', 'light'];
const THEME_LABELS = {
  system: '시스템',
  dark: '다크',
  light: '라이트',
} as const;

const BUTTON_RESET_DELAY_MS = 2000;
const themeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

let currentThemePreference: ThemePreference = 'system';

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

function setElementHidden(element: HTMLElement | null, hidden: boolean): void {
  if (!element) {
    return;
  }

  element.classList.toggle('hidden', hidden);
  element.toggleAttribute('hidden', hidden);
  element.setAttribute('aria-hidden', String(hidden));
}

function readStoredThemePreference(): ThemePreference {
  try {
    const storedPreference = localStorage.getItem(THEME_STORAGE_KEY);
    return storedPreference === 'light' || storedPreference === 'dark' || storedPreference === 'system'
      ? storedPreference
      : 'system';
  } catch (error) {
    console.warn('[KU LMS Helper] Failed to read theme preference:', error);
    return 'system';
  }
}

function persistThemePreference(preference: ThemePreference): void {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, preference);
  } catch (error) {
    console.warn('[KU LMS Helper] Failed to save theme preference:', error);
  }
}

function getEffectiveTheme(preference: ThemePreference = currentThemePreference): 'light' | 'dark' {
  return preference === 'system' ? (themeMediaQuery.matches ? 'dark' : 'light') : preference;
}

function updateThemeToggle(): void {
  const themeButton = elements.themeToggleBtn as HTMLButtonElement | null;

  if (!themeButton) {
    return;
  }

  const currentIndex = THEME_SEQUENCE.indexOf(currentThemePreference);
  const nextPreference = THEME_SEQUENCE[(currentIndex + 1) % THEME_SEQUENCE.length];
  const currentLabel = THEME_LABELS[currentThemePreference];
  const nextLabel = THEME_LABELS[nextPreference];
  const effectiveTheme = getEffectiveTheme();

  themeButton.textContent = '테마';
  themeButton.dataset.mode = currentThemePreference;
  themeButton.dataset.effectiveTheme = effectiveTheme;
  themeButton.setAttribute('aria-label', `테마 전환: 현재 ${currentLabel}, 다음 ${nextLabel}`);
  themeButton.setAttribute('aria-pressed', String(currentThemePreference !== 'system'));
  themeButton.setAttribute('title', `현재 ${currentLabel} 모드 · 클릭하면 ${nextLabel} 모드로 전환`);
}

function applyThemePreference(preference: ThemePreference, persist = true): void {
  currentThemePreference = preference;

  if (preference === 'system') {
    document.documentElement.removeAttribute('data-theme');
  } else {
    document.documentElement.setAttribute('data-theme', preference);
  }

  document.documentElement.setAttribute('data-theme-preference', preference);
  document.documentElement.setAttribute('data-effective-theme', getEffectiveTheme(preference));
  updateThemeToggle();

  if (persist) {
    persistThemePreference(preference);
  }
}

function cycleThemePreference(): void {
  const currentIndex = THEME_SEQUENCE.indexOf(currentThemePreference);
  const nextPreference = THEME_SEQUENCE[(currentIndex + 1) % THEME_SEQUENCE.length];
  applyThemePreference(nextPreference);
}

function initializeTheme(): void {
  applyThemePreference(readStoredThemePreference(), false);

  const handleThemeMediaChange = (): void => {
    if (currentThemePreference !== 'system') {
      return;
    }

    document.documentElement.setAttribute('data-effective-theme', getEffectiveTheme());
    updateThemeToggle();
  };

  themeMediaQuery.addEventListener('change', handleThemeMediaChange);
}

function showState(state: PopupState): void {
  setElementHidden(elements.loadingState, true);
  setElementHidden(elements.readyState, true);
  setElementHidden(elements.errorState, true);

  if (elements.appRoot) {
    elements.appRoot.setAttribute('data-page-state', state);
  }

  switch (state) {
    case 'loading':
      setElementHidden(elements.loadingState, false);
      break;
    case 'ready':
      setElementHidden(elements.readyState, false);
      break;
    case 'error':
      setElementHidden(elements.errorState, false);
      break;
  }
}

function setActionStatus(message: string | null, tone?: ActionStatusTone): void {
  if (!elements.actionStatus) {
    return;
  }

  if (!message) {
    elements.actionStatus.textContent = '';
    elements.actionStatus.removeAttribute('data-tone');
    setElementHidden(elements.actionStatus, true);
    return;
  }

  elements.actionStatus.textContent = message;
  if (tone) {
    elements.actionStatus.setAttribute('data-tone', tone);
  } else {
    elements.actionStatus.removeAttribute('data-tone');
  }

  setElementHidden(elements.actionStatus, false);
}

function setActionButtonsDisabled(disabled: boolean): void {
  const quizButton = elements.extractQuizBtn as HTMLButtonElement | null;

  if (elements.appRoot) {
    elements.appRoot.setAttribute('data-busy', String(disabled));
  }

  if (quizButton) {
    quizButton.disabled = disabled;
    quizButton.removeAttribute('data-loading');
    quizButton.removeAttribute('data-status');
    quizButton.setAttribute('aria-busy', String(disabled));
  }
}

function resetActionFeedback(clearStatus = true): void {
  setActionButtonsDisabled(false);
  if (clearStatus) {
    setActionStatus(null);
  }
}

function showError(message: string): void {
  resetActionFeedback();

  if (elements.errorMessage) {
    elements.errorMessage.textContent = message;
  }

  showState('error');
}

async function getActiveTab(): Promise<chrome.tabs.Tab> {
  return new Promise((resolve, reject) => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const activeTab = tabs[0];

      if (!activeTab?.id) {
        reject(new Error('활성 탭을 찾을 수 없습니다.'));
        return;
      }

      resolve(activeTab);
    });
  });
}

async function sendMessageToActiveTab<TResponse extends ExtensionResponse>(
  request: ExtensionMessage,
): Promise<TResponse> {
  const activeTab = await getActiveTab();

  if (!activeTab.url?.includes('korea.ac.kr')) {
    throw new Error('고려대학교 LMS 페이지가 아닙니다.');
  }

  return new Promise((resolve, reject) => {
    chrome.tabs.sendMessage(activeTab.id!, request, (response?: TResponse | { error: string }) => {
      if (chrome.runtime.lastError) {
        reject(new Error('콘텐츠 스크립트와 통신할 수 없습니다. 페이지를 새로고침한 뒤 다시 시도해주세요.'));
        return;
      }

      if (!response) {
        reject(new Error('응답이 없습니다.'));
        return;
      }

      if ('error' in response) {
        reject(new Error(response.error));
        return;
      }

      resolve(response as TResponse);
    });
  });
}

async function queryPageInfo(): Promise<PageInfoMessage> {
  const request: PageInfoRequest = { type: 'GET_PAGE_INFO' };
  const response = await sendMessageToActiveTab<PageInfoMessage>(request);

  if (response.type !== 'PAGE_INFO') {
    throw new Error('잘못된 응답 형식입니다.');
  }

  return response;
}

async function runActionWithFeedback<T>(options: {
  loadingMessage: string;
  successMessage: string;
  onSuccess: (result: T) => void;
  action: () => Promise<T>;
  errorMessage: string;
}): Promise<void> {
  setActionButtonsDisabled(true);
  setActionStatus(options.loadingMessage, 'loading');

  try {
    const result = await options.action();
    options.onSuccess(result);
    setActionStatus(options.successMessage, 'success');
  } catch (error) {
    console.error('[KU LMS Helper] quiz extraction error:', error);
    setActionStatus(options.errorMessage, 'error');
  }

  await delay(BUTTON_RESET_DELAY_MS);
  resetActionFeedback();
}

async function handleExtractQuiz(): Promise<void> {
  console.log('[KU LMS Helper] Extract quiz clicked');

  await runActionWithFeedback<QuizExtraction>({
    loadingMessage: '추출 중...',
    successMessage: '완료',
    errorMessage: '실패',
    action: async () => {
      const response = await sendMessageToActiveTab<QuizExtractionResultMessage>({ type: 'EXTRACT_QUIZ' });
      if (response.type !== 'QUIZ_EXTRACTION_RESULT') {
        throw new Error('퀴즈 추출 응답 형식이 올바르지 않습니다.');
      }

      return response.data;
    },
    onSuccess: (result) => {
      downloadQuizAsFile(result, 'text');
    },
  });
}

function setupEventListeners(): void {
  elements.themeToggleBtn?.addEventListener('click', cycleThemePreference);
  elements.extractQuizBtn?.addEventListener('click', () => {
    void handleExtractQuiz();
  });
  elements.retryBtn?.addEventListener('click', () => {
    void initializePopup();
  });
}

function initializePopup(): void {
  console.log('[KU LMS Helper] Initializing popup...');

  showState('loading');
  resetActionFeedback();

  void (async () => {
    try {
      const pageInfo = await queryPageInfo();
      console.log('[KU LMS Helper] Received page info:', pageInfo);
      showState('ready');
    } catch (error) {
      console.error('[KU LMS Helper] Error:', error);
      showError(error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.');
    }
  })();
}

function main(): void {
  console.log('[KU LMS Helper] Popup main() starting...');

  initializeTheme();
  setupEventListeners();
  initializePopup();

  console.log('[KU LMS Helper] Popup initialized');
}

document.addEventListener('DOMContentLoaded', main);
