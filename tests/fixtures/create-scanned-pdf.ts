/** Wrap a fictional JPEG in a real image-only PDF; optionally add an embedded-text page. */
export function createScannedPdf(
  jpeg: Uint8Array,
  width: number,
  height: number,
  options: { copies?: number; textPage?: string } = {},
) {
  const objects: (string | Buffer)[] = [
    '',
    '',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
  ];
  const pages: number[] = [];
  function addPage(resources: string, stream: string) {
    const pageId = objects.length + 1;
    pages.push(pageId);
    objects.push(
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${width / 2} ${height / 2}] /Resources ${resources} /Contents ${pageId + 1} 0 R >>`,
    );
    objects.push(`<< /Length ${Buffer.byteLength(stream)} >>\nstream\n${stream}\nendstream`);
  }
  if (options.textPage) {
    const escaped = options.textPage
      .replaceAll('\\', '\\\\')
      .replaceAll('(', '\\(')
      .replaceAll(')', '\\)');
    addPage(
      '<< /Font << /F1 3 0 R >> >>',
      `BT /F1 12 Tf 20 ${height / 2 - 30} Td (${escaped}) Tj ET`,
    );
  }
  const imageId = objects.length + 1;
  objects.push(
    Buffer.concat([
      Buffer.from(
        `<< /Type /XObject /Subtype /Image /Width ${width} /Height ${height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpeg.length} >>\nstream\n`,
      ),
      jpeg,
      Buffer.from('\nendstream'),
    ]),
  );
  for (let index = 0; index < (options.copies ?? 1); index++)
    addPage(
      `<< /XObject << /Im1 ${imageId} 0 R >> >>`,
      `q ${width / 2} 0 0 ${height / 2} 0 0 cm /Im1 Do Q`,
    );
  objects[0] = '<< /Type /Catalog /Pages 2 0 R >>';
  objects[1] = `<< /Type /Pages /Kids [${pages.map((id) => `${id} 0 R`).join(' ')}] /Count ${pages.length} >>`;
  const parts = [Buffer.from('%PDF-1.7\n')];
  const offsets: number[] = [];
  let length = parts[0]?.length ?? 0;
  objects.forEach((object, index) => {
    offsets.push(length);
    const part = Buffer.concat([
      Buffer.from(`${index + 1} 0 obj\n`),
      typeof object === 'string' ? Buffer.from(object) : object,
      Buffer.from('\nendobj\n'),
    ]);
    parts.push(part);
    length += part.length;
  });
  parts.push(
    Buffer.from(
      `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n${offsets.map((offset) => `${String(offset).padStart(10, '0')} 00000 n \n`).join('')}trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${length}\n%%EOF\n`,
    ),
  );
  return Buffer.concat(parts);
}
