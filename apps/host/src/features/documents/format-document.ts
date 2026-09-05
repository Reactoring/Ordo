import type { DocumentSummary } from './document.types';

const amountFormatter = new Intl.NumberFormat('en-IE', { style: 'currency', currency: 'EUR' });
const dateFormatter = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  timeZone: 'UTC',
});

export function formatDocumentAmount(document: Pick<DocumentSummary, 'amountMinor'>) {
  return amountFormatter.format(document.amountMinor / 100);
}

export function formatDocumentDate(date: string) {
  return dateFormatter.format(new Date(`${date}T00:00:00Z`));
}
