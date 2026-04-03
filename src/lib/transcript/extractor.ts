import type { CaptionPayload, TranscriptDocument, TranscriptItem } from './types';
import { downloadAsJson, downloadAsTxt, generateFilename } from '../download';
import { formatTranscriptAsJson, formatTranscriptAsTxt } from './formatter';

const PLAYER_FRAME_URL_FRAGMENT = 'kucom.korea.ac.kr/em/';
const TRANSCRIPT_ROW_SELECTOR = '#cs-script-list > li.cs-script-item';
const RETRY_ATTEMPTS = 80;
const RETRY_DELAY_MS = 250;

interface PlayerStory {
  isIntro?: boolean;
  storyFileNameList?: {
    caption?: string;
  };
}

interface ContentPlayingInfo {
  contentUri?: string;
  storyList?: PlayerStory[];
}

interface PlayerConfig {
  getContentPlayingInfoData?: () => ContentPlayingInfo;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

function normalizeCueText(value: string): string {
  const html = new DOMParser().parseFromString(`<body>${value}</body>`, 'text/html');
  const text = html.body.textContent ?? value;

  return text.replace(/\s*\n+\s*/gu, ' ').replace(/\s+/gu, ' ').trim();
}

function formatCueTime(value: string): string {
  const [hours = '00', minutes = '00', secondsWithMillis = '00.000'] = value.split(':');
  const seconds = secondsWithMillis.split('.')[0] ?? '00';

  if (hours === '00') {
    return `${minutes}:${seconds}`;
  }

  return `${hours}:${minutes}:${seconds}`;
}

function createTranscriptDocument(items: TranscriptItem[]): TranscriptDocument {
  return {
    sourceUrl: window.location.href,
    pageTitle: document.title.trim() || 'Transcript',
    extractedAt: new Date().toISOString(),
    itemCount: items.length,
    items,
  };
}

function getAccessibleFrameWindow(iframe: HTMLIFrameElement): Window | null {
  try {
    return iframe.contentWindow;
  } catch {
    return null;
  }
}

function findPlayerIframe(): HTMLIFrameElement | null {
  const iframes = Array.from(document.querySelectorAll('iframe'));

  return (
    iframes.find((iframe) => {
      const src = iframe.getAttribute('src') ?? '';
      return src.includes(PLAYER_FRAME_URL_FRAGMENT) || src.includes('kucom.korea.ac.kr');
    }) ?? null
  );
}

function readDomTranscriptItems(sourceDocument: Document): TranscriptItem[] {
  return Array.from(sourceDocument.querySelectorAll(TRANSCRIPT_ROW_SELECTOR))
    .map((row, index) => ({
      index,
      time: row.querySelector('.cs-script-item-time')?.textContent?.trim() ?? '',
      text: row.querySelector('.cs-script-item-text')?.textContent?.trim() ?? '',
    }))
    .filter((row) => row.time.length > 0 && row.text.length > 0);
}

function extractDomTranscript(): TranscriptItem[] | null {
  const mainItems = readDomTranscriptItems(document);
  if (mainItems.length > 0) {
    return mainItems;
  }

  const iframes = Array.from(document.querySelectorAll('iframe'));
  for (const iframe of iframes) {
    try {
      const frameWindow = getAccessibleFrameWindow(iframe);
      const frameDocument = frameWindow?.document;
      if (!frameDocument) {
        continue;
      }

      const frameItems = readDomTranscriptItems(frameDocument);
      if (frameItems.length > 0) {
        return frameItems;
      }
    } catch {
      continue;
    }
  }

  return null;
}

async function fetchCaptionPayload(playerWindow: Window): Promise<CaptionPayload | null> {
  try {
    const config = (playerWindow as Window & { uniPlayerConfig?: PlayerConfig }).uniPlayerConfig;
    const contentPlayingInfo = config?.getContentPlayingInfoData?.();
    const contentUri = contentPlayingInfo?.contentUri;
    const story = contentPlayingInfo?.storyList?.find(
      (candidate) => !candidate.isIntro && candidate.storyFileNameList?.caption,
    );

    if (!contentUri || !story?.storyFileNameList?.caption) {
      return null;
    }

    const captionListUrl = new URL(story.storyFileNameList.caption, `${contentUri}/`).toString();
    const captionListResponse = await fetch(captionListUrl, { credentials: 'include' });
    const captionListText = await captionListResponse.text();
    const captionListDoc = new DOMParser().parseFromString(captionListText, 'text/xml');

    const captions = Array.from(captionListDoc.querySelectorAll('caption')).map((caption) => ({
      language: caption.querySelector('lang')?.textContent?.trim() ?? '',
      uri: caption.querySelector('uri')?.textContent?.trim() ?? '',
    }));

    const selectedCaption =
      captions.find((caption) => /국문|korean|한국어|\bko\b/iu.test(caption.language)) ?? captions[0];

    if (!selectedCaption?.uri) {
      return null;
    }

    const vttUrl = new URL(selectedCaption.uri, `${contentUri}/`).toString();
    const vttResponse = await fetch(vttUrl, { credentials: 'include' });
    const vttText = await vttResponse.text();

    if (!vttText.includes('WEBVTT')) {
      return null;
    }

    return {
      language: selectedCaption.language,
      vttText,
    };
  } catch {
    return null;
  }
}

async function extractFromVideoPlayerOnce(): Promise<CaptionPayload | null> {
  const iframe = findPlayerIframe();
  const playerWindow = iframe ? getAccessibleFrameWindow(iframe) : null;

  if (!playerWindow) {
    return null;
  }

  return fetchCaptionPayload(playerWindow);
}

export function parseVttContent(vttText: string): TranscriptItem[] {
  const lines = vttText.replace(/^WEBVTT\s*/u, '').split(/\r?\n/u);
  const items: TranscriptItem[] = [];
  let index = 0;

  for (let cursor = 0; cursor < lines.length; cursor += 1) {
    const line = lines[cursor]?.trim() ?? '';
    if (!line || /^NOTE(?:\s|$)/u.test(line)) {
      continue;
    }

    if (/^\d+$/u.test(line) && lines[cursor + 1]?.includes('-->') === true) {
      continue;
    }

    if (!line.includes('-->')) {
      continue;
    }

    const [start] = line.split('-->').map((part) => part.trim());
    const textLines: string[] = [];

    for (cursor += 1; cursor < lines.length; cursor += 1) {
      const textLine = lines[cursor] ?? '';
      if (!textLine.trim()) {
        break;
      }

      if (/^(STYLE|REGION)$/u.test(textLine.trim())) {
        textLines.length = 0;
        break;
      }

      textLines.push(textLine);
    }

    const text = normalizeCueText(textLines.join('\n'));
    if (!text) {
      continue;
    }

    items.push({
      index,
      time: formatCueTime(start),
      text,
    });
    index += 1;
  }

  return items;
}

export function formatTranscriptOutput(document: TranscriptDocument): string {
  return formatTranscriptAsTxt(document);
}

export function formatTranscriptJson(document: TranscriptDocument): string {
  return formatTranscriptAsJson(document);
}

export function downloadTranscriptAsFile(
  document: TranscriptDocument,
  format: 'json' | 'text' = 'json',
): void {
  const title = document.pageTitle || 'transcript';
  const filename = generateFilename('transcript', title, format === 'json' ? 'json' : 'txt');
  const content = format === 'json' ? formatTranscriptAsJson(document) : formatTranscriptAsTxt(document);

  if (format === 'json') {
    downloadAsJson(content, filename);
    return;
  }

  downloadAsTxt(content, filename);
}

export async function extractFromVideoPlayer(): Promise<CaptionPayload | null> {
  for (let attempt = 0; attempt < RETRY_ATTEMPTS; attempt += 1) {
    const payload = await extractFromVideoPlayerOnce();
    if (payload) {
      return payload;
    }

    await delay(RETRY_DELAY_MS);
  }

  return null;
}

export async function extractTranscriptFromPage(): Promise<TranscriptDocument> {
  const captionPayload = await extractFromVideoPlayer();
  const vttItems = captionPayload ? parseVttContent(captionPayload.vttText) : [];
  if (vttItems.length > 0) {
    return createTranscriptDocument(vttItems);
  }

  const domItems = extractDomTranscript();
  if (domItems && domItems.length > 0) {
    return createTranscriptDocument(domItems);
  }

  throw new Error('자막을 찾을 수 없습니다.');
}
