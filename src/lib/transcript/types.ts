export interface TranscriptItem {
  index: number;
  time: string;
  text: string;
}

export interface TranscriptDocument {
  sourceUrl: string;
  pageTitle: string;
  extractedAt: string;
  itemCount: number;
  items: TranscriptItem[];
}

export interface CaptionPayload {
  language: string;
  vttText: string;
}
