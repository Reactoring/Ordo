import type { UploadLimits } from '@ordo/contracts';

export function validateSelection(
  files: readonly File[],
  limits: UploadLimits,
): string | undefined {
  if (files.length === 0) return 'Choose at least one document.';
  if (files.length > limits.maxFiles) return `Choose up to ${limits.maxFiles} documents at a time.`;
  for (const file of files) {
    if (!/\.(pdf|png|jpe?g)$/i.test(file.name))
      return `${file.name}: choose a PDF, PNG or JPEG file.`;
    if (file.size === 0) return `${file.name} is empty.`;
    if (file.size > limits.maxFileSizeBytes)
      return `${file.name} exceeds the ${limits.maxFileSizeBytes / 1024 / 1024} MB limit.`;
  }
}
