import type { TranscriptDocument } from './types';

export function formatTranscriptAsTxt(transcript: TranscriptDocument): string {
  const lines: string[] = [];

  lines.push(`강의: ${transcript.pageTitle || 'Transcript'}`);
  lines.push('');

  for (const item of transcript.items) {
    lines.push(`${item.time} ${item.text}`);
  }

  return `${lines.join('\n').trim()}\n`;
}

export function formatTranscriptAsJson(transcript: TranscriptDocument): string {
  return JSON.stringify(transcript, null, 2);
}
