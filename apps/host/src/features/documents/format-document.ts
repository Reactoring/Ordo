const dateFormatter = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  timeZone: 'UTC',
});
const sizeFormatter = new Intl.NumberFormat('en-GB', { maximumFractionDigits: 1 });
export function formatUploadDate(date: string) {
  return dateFormatter.format(new Date(date));
}
export function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${sizeFormatter.format(bytes / 1024)} KB`;
  return `${sizeFormatter.format(bytes / 1024 / 1024)} MB`;
}
export function documentContentUrl(id: string) {
  return `/api/documents/${encodeURIComponent(id)}/content`;
}
