import type { DocumentCurrency, DocumentFields } from '@ordo/contracts';
import { emptyDocumentFields } from '../document-data.js';

function unique<T>(values: T[]): T | null {
  const distinct = [...new Set(values)];
  return distinct.length === 1 ? (distinct[0] ?? null) : null;
}

function dateValue(value: string): string | null {
  const iso = /\b(\d{4})-(\d{2})-(\d{2})\b/.exec(value);
  const local = /\b(\d{2})\/(\d{2})\/(\d{4})\b/.exec(value);
  const candidate = iso?.[0] ?? (local ? `${local[3]}-${local[2]}-${local[1]}` : null);
  if (!candidate) return null;
  const date = new Date(`${candidate}T00:00:00.000Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === candidate
    ? candidate
    : null;
}

function amountValue(value: string): number | null {
  const match =
    /^(?:(?:EUR|USD|GBP|€|£|\$)\s*)?((?:\d{1,3}(?:[ ,.\u00a0]\d{3})+|\d+)[.,]\d{2})(?:\s*(?:EUR|USD|GBP|€|£|\$))?$/i.exec(
      value,
    );
  const amount = match?.[1];
  if (!amount) return null;
  const separator = Math.max(amount.lastIndexOf('.'), amount.lastIndexOf(','));
  const cents =
    Number(amount.slice(0, separator).replace(/[ ,.\u00a0]/g, '')) * 100 +
    Number(amount.slice(separator + 1));
  return Number.isSafeInteger(cents) ? cents : null;
}

export function parseInvoiceText(text: string): DocumentFields {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  function values<T>(label: RegExp, parse: (value: string) => T | null) {
    const candidates: T[] = [];
    lines.forEach((line, index) => {
      const match = label.exec(line);
      if (!match) return;
      const raw = match[1]?.trim() || lines[index + 1] || '';
      const value = parse(raw);
      if (value !== null) candidates.push(value);
    });
    return unique(candidates);
  }
  const currencies: DocumentCurrency[] = [];
  if (/\bEUR\b|€/i.test(text)) currencies.push('EUR');
  if (/\bUSD\b/i.test(text)) currencies.push('USD');
  if (/\bGBP\b|£/i.test(text)) currencies.push('GBP');
  return {
    ...emptyDocumentFields(),
    supplier: values(/^(?:supplier|fournisseur|from|[eé]metteur)\s*:?\s*(.*)$/i, (value) =>
      value.length > 1 &&
      value.length <= 200 &&
      /[a-z]/i.test(value) &&
      !/^(?:bill to|client|invoice|facture)\b/i.test(value)
        ? value
        : null,
    ),
    invoiceNumber: values(
      /^(?:invoice(?:\s+(?:number|no\.?))?|facture(?:\s*(?:n[°oº.]|num[eé]ro))?|reference|r[eé]f[eé]rence)\s*[:#]?\s*(.*)$/i,
      (value) => (/^(?=.*\d)[a-z\d./_-]{2,80}$/i.test(value) ? value : null),
    ),
    invoiceDate: values(
      /^(?:issued|invoice date|date(?: de facture)?|[eé]mise? le)\s*:?\s*(.*)$/i,
      dateValue,
    ),
    currency: unique(currencies),
    subtotalCents: values(
      /^(?:subtotal|sub-total|total\s+HT|montant\s+HT)\s*:?\s*(.*)$/i,
      amountValue,
    ),
    taxCents: values(
      /^(?:VAT|TVA|tax)(?:\s*\(?\d+(?:[.,]\d+)?\s*%\)?)?\s*:?\s*(.*)$/i,
      amountValue,
    ),
    totalCents: values(
      /^(?:total\s+TTC|grand total|total(?:\s+(?:paid|due))?|net [aà] payer)\s*:?\s*(.*)$/i,
      amountValue,
    ),
  };
}
