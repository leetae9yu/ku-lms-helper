/**
 * Popup script for KU LMS Helper
 */
import '../styles/global.css';
import './popup.css';
import { formatQuizOutput, type QuizExtraction } from '../lib/quiz';
import { downloadTranscriptAsFile, formatTranscriptOutput, type TranscriptDocument } from '../lib/transcript';
import {
  type ExtensionMessage,
  type ExtensionResponse,
  type PageInfoMessage,
  type PageInfoRequest,
  type QuizExtractionResultMessage,
  type TranscriptExtractionResultMessage,
} from '../lib/page-types';

console.log('[KU LMS Helper] Popup script loaded');

const elements = {
  appRoot: document.getElementById('app'),
  loadingState: document.getElementById('loading-state'),
  readyState: document.getElementById('ready-state'),
  errorState: document.getElementById('error-state'),
  errorMessage: document.getElementById('error-message'),
  extractQuizBtn: document.getElementById('extract-quiz-btn'),
  extractTranscriptBtn: document.getElementById('extract-transcript-btn'),
  retryBtn: document.getElementById('retry-btn'),
  resultsPanel: document.getElementById('results-panel'),
  resultsTitle: document.getElementById('results-title'),
  resultCountBadge: document.getElementById('result-count-badge'),
  resultLoading: document.getElementById('result-loading'),
  resultLoadingMessage: document.getElementById('result-loading-message'),
  resultError: document.getElementById('result-error'),
  resultErrorMessage: document.getElementById('result-error-message'),
  resultRetryBtn: document.getElementById('result-retry-btn'),
  resultContent: document.getElementById('result-content'),
  resultsMeta: document.getElementById('results-meta'),
  resultsPreview: document.getElementById('results-preview'),
  downloadActions: document.querySelector('.download-actions'),
  downloadTxtBtn: document.getElementById('download-txt-btn'),
  downloadJsonBtn: document.getElementById('download-json-btn'),
  themeToggleBtn: document.getElementById('theme-toggle-btn'),
  themeToggleIcon: document.getElementById('theme-toggle-icon'),
} as const;

type PopupState = 'loading' | 'ready' | 'error';
type ExtractionRequestType = 'EXTRACT_QUIZ' | 'EXTRACT_TRANSCRIPT';
type ExtractedResult =
  | { kind: 'quiz'; data: QuizExtraction }
  | { kind: 'transcript'; data: TranscriptDocument }
  | null;
type ThemePreference = 'system' | 'light' | 'dark';

const BUTTON_LABELS = {
  quiz: '📝 퀴즈 추출하기',
  transcript: '🎥 자막 추출하기',
} as const;

const THEME_STORAGE_KEY = 'ku-lms-helper-theme-preference';
const THEME_SEQUENCE: ThemePreference[] = ['system', 'dark', 'light'];
const THEME_LABELS = {
  system: '시스템',
  dark: '다크',
  light: '라이트',
} as const;
const THEME_ICONS = {
  system: '◐',
  dark: '☾',
  light: '☀',
} as const;

const QUIZ_PREVIEW_COUNT = 3;
const themeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

let currentPageInfo: PageInfoMessage | null = null;
let lastExtractionRequest: ExtractionRequestType | null = null;
let latestExtraction: ExtractedResult = null;
let currentThemePreference: ThemePreference = 'system';

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

  if (!themeButton || !elements.themeToggleIcon) {
    return;
  }

  const currentIndex = THEME_SEQUENCE.indexOf(currentThemePreference);
  const nextPreference = THEME_SEQUENCE[(currentIndex + 1) % THEME_SEQUENCE.length];
  const currentLabel = THEME_LABELS[currentThemePreference];
  const nextLabel = THEME_LABELS[nextPreference];
  const effectiveTheme = getEffectiveTheme();

  elements.themeToggleIcon.textContent = THEME_ICONS[currentThemePreference];
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

function showResultsPanel(): void {
  setElementHidden(elements.resultsPanel, false);
}

function hideResultsPanel(): void {
  setElementHidden(elements.resultsPanel, true);
}

function setDownloadButtonsEnabled(enabled: boolean): void {
  const txtButton = elements.downloadTxtBtn as HTMLButtonElement | null;
  const jsonButton = elements.downloadJsonBtn as HTMLButtonElement | null;

  if (txtButton) {
    txtButton.disabled = !enabled;
  }

  if (jsonButton) {
    jsonButton.disabled = !enabled;
  }
}

function setDownloadActionsVisible(visible: boolean): void {
  setElementHidden(elements.downloadActions as HTMLElement | null, !visible);
}

function setResultsPreviewVisible(visible: boolean): void {
  setElementHidden(elements.resultsPreview, !visible);
}

function setResultCountBadge(text: string | null): void {
  if (!elements.resultCountBadge) {
    return;
  }

  if (!text) {
    elements.resultCountBadge.textContent = '';
    setElementHidden(elements.resultCountBadge, true);
    return;
  }

  elements.resultCountBadge.textContent = text;
  setElementHidden(elements.resultCountBadge, false);
}

function setActionButtonsDisabled(disabled: boolean): void {
  const quizButton = elements.extractQuizBtn as HTMLButtonElement | null;
  const transcriptButton = elements.extractTranscriptBtn as HTMLButtonElement | null;
  const quizLoading = disabled && lastExtractionRequest === 'EXTRACT_QUIZ';
  const transcriptLoading = disabled && lastExtractionRequest === 'EXTRACT_TRANSCRIPT';

  if (elements.appRoot) {
    elements.appRoot.setAttribute('data-busy', String(disabled));
  }

  if (quizButton) {
    quizButton.disabled = disabled;
    quizButton.textContent = quizLoading ? '퀴즈 추출 중...' : BUTTON_LABELS.quiz;
    if (quizLoading) {
      quizButton.setAttribute('data-loading', 'true');
    } else {
      quizButton.removeAttribute('data-loading');
    }
    quizButton.setAttribute('aria-busy', String(quizLoading));
  }

  if (transcriptButton) {
    transcriptButton.disabled = disabled;
    transcriptButton.textContent = transcriptLoading
      ? '자막 추출 중...'
      : BUTTON_LABELS.transcript;
    if (transcriptLoading) {
      transcriptButton.setAttribute('data-loading', 'true');
    } else {
      transcriptButton.removeAttribute('data-loading');
    }
    transcriptButton.setAttribute('aria-busy', String(transcriptLoading));
  }
}

function resetResultsPanel(): void {
  latestExtraction = null;
  lastExtractionRequest = null;
  hideResultsPanel();
  setElementHidden(elements.resultLoading, true);
  setElementHidden(elements.resultError, true);
  setElementHidden(elements.resultContent, true);
  setResultCountBadge(null);
  setActionButtonsDisabled(false);
  setDownloadButtonsEnabled(false);
  setDownloadActionsVisible(true);
  setResultsPreviewVisible(false);

  if (elements.resultsTitle) {
    elements.resultsTitle.textContent = '미리보기';
  }

  if (elements.resultsMeta) {
    elements.resultsMeta.textContent = '';
  }

  if (elements.resultLoadingMessage) {
    elements.resultLoadingMessage.textContent = '추출 중입니다...';
  }

  if (elements.resultsPreview) {
    elements.resultsPreview.replaceChildren();
  }
}

function showError(message: string): void {
  resetResultsPanel();

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

function showResultLoading(message: string, requestType: ExtractionRequestType): void {
  showResultsPanel();
  lastExtractionRequest = requestType;
  latestExtraction = null;
  setActionButtonsDisabled(true);
  setDownloadButtonsEnabled(false);
  setDownloadActionsVisible(requestType === 'EXTRACT_QUIZ');
  setResultsPreviewVisible(false);
  setElementHidden(elements.resultError, true);
  setElementHidden(elements.resultContent, true);
  setElementHidden(elements.resultLoading, false);

  if (elements.resultsTitle) {
    elements.resultsTitle.textContent = requestType === 'EXTRACT_QUIZ' ? '퀴즈 미리보기 준비 중' : '자막 미리보기 준비 중';
  }

  if (elements.resultLoadingMessage) {
    elements.resultLoadingMessage.textContent = message;
  }

  if (elements.resultsMeta) {
    elements.resultsMeta.textContent = '';
  }

  if (elements.resultsPreview) {
    elements.resultsPreview.replaceChildren();
  }

  setResultCountBadge(null);
}

function showResultError(message: string): void {
  showResultsPanel();
  setActionButtonsDisabled(false);
  setDownloadButtonsEnabled(false);
  setElementHidden(elements.resultLoading, true);
  setElementHidden(elements.resultContent, true);
  setElementHidden(elements.resultError, false);

  if (elements.resultsTitle) {
    elements.resultsTitle.textContent = '추출에 실패했습니다';
  }

  if (elements.resultErrorMessage) {
    elements.resultErrorMessage.textContent = message;
  }

  setResultCountBadge(null);
}

function createPreviewCard(title: string, badgeText?: string): HTMLElement {
  const card = document.createElement('article');
  card.className = 'preview-card';

  const header = document.createElement('div');
  header.className = 'preview-card-header';

  const heading = document.createElement('h4');
  heading.className = 'preview-card-title';
  heading.textContent = title;
  header.appendChild(heading);

  if (badgeText) {
    const badge = document.createElement('span');
    badge.className = 'preview-card-badge';
    badge.textContent = badgeText;
    header.appendChild(badge);
  }

  card.appendChild(header);
  return card;
}

function createPreviewText(text: string): HTMLParagraphElement {
  const paragraph = document.createElement('p');
  paragraph.className = 'preview-card-text';
  paragraph.textContent = text;
  return paragraph;
}

function renderQuizPreview(result: QuizExtraction): void {
  if (!elements.resultsPreview || !elements.resultsMeta || !elements.resultsTitle) {
    return;
  }

  setDownloadActionsVisible(true);
  setResultsPreviewVisible(true);
  elements.resultsTitle.textContent = result.meta.title || '퀴즈 추출 미리보기';
  elements.resultsMeta.textContent = [
    `총 ${result.questions.length}문항`,
    result.meta.score ? `점수 ${result.meta.score}` : null,
    result.meta.duration ? `소요 ${result.meta.duration}` : null,
  ].filter(Boolean).join(' · ');

  setResultCountBadge(`${result.questions.length}문항`);
  elements.resultsPreview.replaceChildren();

  result.questions.slice(0, QUIZ_PREVIEW_COUNT).forEach((question) => {
    const questionText = question.text || question.html || '문항 텍스트 없음';
    const card = createPreviewCard(`문제 ${question.index}`, `${question.answers.length}개 선택지`);
    card.appendChild(createPreviewText(questionText));

    const answers = document.createElement('div');
    answers.className = 'preview-answer-list';

    question.answers.slice(0, 4).forEach((answer) => {
      const line = document.createElement('div');
      line.className = 'preview-answer';

      if (answer.isCorrect) {
        line.classList.add('is-correct');
      }

      if (answer.isSelected) {
        line.classList.add('is-selected');
      }

      const index = document.createElement('span');
      index.className = 'preview-answer-index';
      index.textContent = `${answer.index}.`;

      const text = document.createElement('span');
      text.className = 'preview-answer-text';
      text.textContent = answer.text || answer.html || '선택지 텍스트 없음';

      line.append(index, text);

      if (answer.isCorrect) {
        const marker = document.createElement('span');
        marker.className = 'preview-answer-marker';
        marker.textContent = '정답';
        line.appendChild(marker);
      }

      answers.appendChild(line);
    });

    card.appendChild(answers);
    elements.resultsPreview?.appendChild(card);
  });
}

function showExtractedResult(result: ExtractedResult): void {
  if (!result) {
    return;
  }

  showResultsPanel();
  setActionButtonsDisabled(false);
  setDownloadButtonsEnabled(true);
  setElementHidden(elements.resultLoading, true);
  setElementHidden(elements.resultError, true);
  setElementHidden(elements.resultContent, false);

  if (result.kind === 'quiz') {
    renderQuizPreview(result.data);
    return;
  }
}

function showTranscriptDownloadSuccess(result: TranscriptDocument): void {
  showResultsPanel();
  setActionButtonsDisabled(false);
  setDownloadButtonsEnabled(false);
  setDownloadActionsVisible(false);
  setResultsPreviewVisible(false);
  setElementHidden(elements.resultLoading, true);
  setElementHidden(elements.resultError, true);
  setElementHidden(elements.resultContent, false);

  if (elements.resultsTitle) {
    elements.resultsTitle.textContent = '자막 추출 완료';
  }

  if (elements.resultsMeta) {
    elements.resultsMeta.textContent = '자막 파일을 바로 다운로드했습니다.';
  }

  if (elements.resultsPreview) {
    elements.resultsPreview.replaceChildren();
  }

  setResultCountBadge(`${result.itemCount}개 구간`);
}

function escapeFilenameSegment(value: string, fallback: string): string {
  const sanitized = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9가-힣]+/gi, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);

  return sanitized || fallback;
}

function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function handleDownload(format: 'txt' | 'json'): void {
  if (!latestExtraction) {
    return;
  }

  if (latestExtraction.kind === 'quiz') {
    const title = latestExtraction.data.meta.title ?? currentPageInfo?.title ?? 'quiz';
    const filename = `${escapeFilenameSegment(title, 'quiz')}.${format}`;
    const content = format === 'json'
      ? formatQuizOutput(latestExtraction.data, 'json')
      : formatQuizOutput(latestExtraction.data, 'text');

    downloadFile(
      content,
      filename,
      format === 'json' ? 'application/json;charset=utf-8' : 'text/plain;charset=utf-8',
    );
    return;
  }

  const title = latestExtraction.data.pageTitle || currentPageInfo?.title || 'transcript';
  const filename = `${escapeFilenameSegment(title, 'transcript')}.${format}`;
  const content = format === 'json'
    ? JSON.stringify(latestExtraction.data, null, 2)
    : formatTranscriptOutput(latestExtraction.data);

  downloadFile(
    content,
    filename,
    format === 'json' ? 'application/json;charset=utf-8' : 'text/plain;charset=utf-8',
  );
}

async function initializePopup(): Promise<void> {
  console.log('[KU LMS Helper] Initializing popup...');

  showState('loading');
  resetResultsPanel();

  try {
    const pageInfo = await queryPageInfo();
    console.log('[KU LMS Helper] Received page info:', pageInfo);

    currentPageInfo = pageInfo;
    showState('ready');
  } catch (error) {
    console.error('[KU LMS Helper] Error:', error);
    showError(error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.');
  }
}

async function handleExtractQuiz(): Promise<void> {
  console.log('[KU LMS Helper] Extract quiz clicked');

  try {
    showResultLoading('퀴즈 문항과 정답을 분석하고 있습니다...', 'EXTRACT_QUIZ');

    const response = await sendMessageToActiveTab<QuizExtractionResultMessage>({ type: 'EXTRACT_QUIZ' });
    if (response.type !== 'QUIZ_EXTRACTION_RESULT') {
      throw new Error('퀴즈 추출 응답 형식이 올바르지 않습니다.');
    }

    latestExtraction = {
      kind: 'quiz',
      data: response.data,
    };
    showExtractedResult(latestExtraction);
  } catch (error) {
    console.error('[KU LMS Helper] Quiz extraction error:', error);
    showResultError(error instanceof Error ? error.message : '퀴즈 추출 중 오류가 발생했습니다.');
  }
}

async function handleExtractTranscript(): Promise<void> {
  console.log('[KU LMS Helper] Extract transcript clicked');

  try {
    showResultLoading('강의 자막을 수집하고 있습니다...', 'EXTRACT_TRANSCRIPT');

    const response = await sendMessageToActiveTab<TranscriptExtractionResultMessage>({ type: 'EXTRACT_TRANSCRIPT' });
    if (response.type !== 'TRANSCRIPT_EXTRACTION_RESULT') {
      throw new Error('자막 추출 응답 형식이 올바르지 않습니다.');
    }

    latestExtraction = {
      kind: 'transcript',
      data: response.data,
    };
    downloadTranscriptAsFile(response.data, 'text');
    showTranscriptDownloadSuccess(response.data);
  } catch (error) {
    console.error('[KU LMS Helper] Transcript extraction error:', error);
    showResultError(error instanceof Error ? error.message : '자막 추출 중 오류가 발생했습니다.');
  }
}

function handleRetryExtraction(): void {
  if (lastExtractionRequest === 'EXTRACT_QUIZ') {
    void handleExtractQuiz();
    return;
  }

  if (lastExtractionRequest === 'EXTRACT_TRANSCRIPT') {
    void handleExtractTranscript();
  }
}

function setupEventListeners(): void {
  elements.themeToggleBtn?.addEventListener('click', cycleThemePreference);
  elements.extractQuizBtn?.addEventListener('click', () => {
    void handleExtractQuiz();
  });
  elements.extractTranscriptBtn?.addEventListener('click', () => {
    void handleExtractTranscript();
  });
  elements.retryBtn?.addEventListener('click', () => {
    void initializePopup();
  });
  elements.resultRetryBtn?.addEventListener('click', handleRetryExtraction);
  elements.downloadTxtBtn?.addEventListener('click', () => {
    handleDownload('txt');
  });
  elements.downloadJsonBtn?.addEventListener('click', () => {
    handleDownload('json');
  });
}

function main(): void {
  console.log('[KU LMS Helper] Popup main() starting...');

  initializeTheme();
  setupEventListeners();
  void initializePopup();

  console.log('[KU LMS Helper] Popup initialized');
}

document.addEventListener('DOMContentLoaded', main);
