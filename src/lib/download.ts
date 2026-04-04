const FILENAME_SAFE_PATTERN = new RegExp('[<>:"/\\\\|?*\\x00-\\x1F]+', 'g');
const WHITESPACE_PATTERN = /\s+/g;
const MAX_FILENAME_LENGTH = 120;

function pad(value: number): string {
  return value.toString().padStart(2, '0');
}

function getTimestamp(): string {
  const now = new Date();
  return [
    now.getFullYear().toString(),
    pad(now.getMonth() + 1),
    pad(now.getDate()),
  ].join('') + '-' + [pad(now.getHours()), pad(now.getMinutes()), pad(now.getSeconds())].join('');
}

export function sanitizeFilename(name: string): string {
  const cleaned = name
    .normalize('NFKC')
    .replace(FILENAME_SAFE_PATTERN, '-')
    .replace(WHITESPACE_PATTERN, '-')
    .replace(/-+/g, '-')
    .replace(/^[.-]+|[.-]+$/g, '');

  return cleaned.slice(0, MAX_FILENAME_LENGTH) || 'download';
}

export function generateFilename(
  type: 'quiz' | string,
  title: string,
  format: 'txt' | 'json',
): string {
  const safeType = sanitizeFilename(type.toLowerCase());
  const safeTitle = sanitizeFilename(title);
  const timestamp = getTimestamp();
  const base = safeTitle.length > 0 ? `${safeType}-${safeTitle}` : safeType;
  return `${base}-${timestamp}.${format}`;
}

function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = url;
  link.download = filename;
  link.style.display = 'none';

  document.body.appendChild(link);
  link.click();
  link.remove();

  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

export function downloadAsTxt(data: string, filename: string): void {
  downloadFile(data, filename, 'text/plain;charset=utf-8');
}

export function downloadAsJson(data: unknown, filename: string): void {
  const content = typeof data === 'string' ? data : JSON.stringify(data, null, 2);
  downloadFile(content, filename, 'application/json;charset=utf-8');
}
