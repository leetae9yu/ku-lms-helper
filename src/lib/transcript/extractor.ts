import type { TranscriptDocument, TranscriptItem } from './types';
import { downloadAsJson, downloadAsTxt, generateFilename } from '../download';
import { formatTranscriptAsJson, formatTranscriptAsTxt } from './formatter';

const TRANSCRIPT_ROW_SELECTOR = '#cs-script-list > li.cs-script-item';

function createTranscriptDocument(items: TranscriptItem[]): TranscriptDocument {
  return {
    sourceUrl: window.location.href,
    pageTitle: document.title.trim() || 'Transcript',
    extractedAt: new Date().toISOString(),
    itemCount: items.length,
    items,
  };
}

function readDomTranscriptItems(): TranscriptItem[] {
  return Array.from(document.querySelectorAll(TRANSCRIPT_ROW_SELECTOR))
    .map((row, index) => ({
      index,
      time: row.querySelector('.cs-script-item-time')?.textContent?.trim() ?? '',
      text: row.querySelector('.cs-script-item-text')?.textContent?.trim() ?? '',
    }))
    .filter((row) => row.time.length > 0 && row.text.length > 0);
}

function extractDomTranscript(): TranscriptItem[] {
  return readDomTranscriptItems();
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

export function extractTranscriptFromPage(): TranscriptDocument {
  const items = extractDomTranscript();

  if (items.length > 0) {
    return createTranscriptDocument(items);
  }

  throw new Error('자막을 찾을 수 없습니다. 자막 패널이 열린 상태인지 확인하세요.');
}
