export type DocumentStatus = 'needs-review' | 'reviewed';
export type DocumentFilter = 'all' | DocumentStatus;

export interface DocumentSummary {
  id: string;
  fileName: string;
  fileType: 'PDF' | 'PNG' | 'JPG';
  supplier: string;
  category: string;
  reference: string;
  date: string;
  description: string;
  amountMinor: number;
  currency: 'EUR';
  status: DocumentStatus;
  checksRemaining: number;
}
