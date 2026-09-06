import { describe, expect, it } from 'vitest';
import { parseInvoiceText } from './parse-invoice.js';

describe('invoice field extraction', () => {
  it('reads a receipt header and date only when a receipt reference is present', () => {
    expect(parseInvoiceText('PAPER CORNER\nRCPT-2026-0401\n2026-09-04 09:18')).toMatchObject({
      supplier: 'PAPER CORNER',
      invoiceNumber: 'RCPT-2026-0401',
      invoiceDate: '2026-09-04',
    });
    expect(parseInvoiceText('PAPER CORNER\n2026-09-04 09:18')).toMatchObject({
      supplier: null,
      invoiceDate: null,
    });
    expect(
      parseInvoiceText(
        'PAPER CORNER\nRCPT-1\nSupplier: Company A\nSupplier: Company B\nDate: 2026-02-30\n2026-09-04',
      ),
    ).toMatchObject({ supplier: null, invoiceDate: null });
  });
  it('does not mistake a supplier name beginning with a label for a labelled field', () => {
    expect(parseInvoiceText('Fromage Example\nSupplierware Ltd').supplier).toBeNull();
  });
  it('reads labelled English fields and preserves integer cents', () => {
    expect(
      parseInvoiceText(
        'Supplier: Cedar Workspace\nInvoice: INV-2026-09\nIssued: 2026-09-02\nSubtotal 125.00 EUR\nVAT (20%) 25.00 EUR\nTOTAL 150.00 EUR',
      ),
    ).toEqual({
      supplier: 'Cedar Workspace',
      invoiceNumber: 'INV-2026-09',
      invoiceDate: '2026-09-02',
      currency: 'EUR',
      subtotalCents: 12500,
      taxCents: 2500,
      totalCents: 15000,
    });
  });
  it('reads French labels and decimal commas without treating a tax rate as an amount', () => {
    expect(
      parseInvoiceText(
        'Fournisseur : Atelier Exemple\nFacture n° F-42\nDate de facture : 05/09/2026\nTotal HT : 1 250,50 EUR\nTVA 20% : 250,10 EUR\nTotal TTC : 1 500,60 EUR',
      ),
    ).toMatchObject({
      supplier: 'Atelier Exemple',
      invoiceNumber: 'F-42',
      invoiceDate: '2026-09-05',
      subtotalCents: 125050,
      taxCents: 25010,
      totalCents: 150060,
    });
  });
  it('leaves missing or ambiguous values empty rather than guessing', () => {
    const fields = parseInvoiceText(
      'Some business\nInvoice INV-1\nInvoice INV-2\nDue: 2026-10-01\nVAT 20%\nItem 10.00\nTOTAL 12.00 USD\nTOTAL 20.00 EUR',
    );
    expect(fields).toMatchObject({
      supplier: null,
      invoiceNumber: null,
      invoiceDate: null,
      currency: null,
      taxCents: null,
      totalCents: null,
    });
  });
  it('rejects invalid calendar dates and does not derive missing totals', () => {
    expect(parseInvoiceText('Issued: 2026-02-30\nSubtotal 10.00 EUR\nVAT 2.00 EUR')).toMatchObject({
      invoiceDate: null,
      subtotalCents: 1000,
      taxCents: 200,
      totalCents: null,
    });
  });
  it('finds a supplier in an explicit FROM block and a reference beneath the invoice heading', () => {
    expect(
      parseInvoiceText(
        'PAPERLINE OFFICE\nINVOICE\nINV-2026-0901\nFROM\nPaperline Office\n12 Example Lane\nBILL TO\nMorgan Reed',
      ),
    ).toMatchObject({ supplier: 'Paperline Office', invoiceNumber: 'INV-2026-0901' });
  });
});
