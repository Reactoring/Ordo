import { useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { UploadLimits } from '@ordo/contracts';
import { useTypedMutation } from '../../../hooks/useTypedMutation';
import { getTypedQueryOptions } from '../../../api/endpoints';
import { validateSelection } from '../validate-selection';

export function useDocumentUpload(limits: UploadLimits | undefined, onImported: () => void) {
  const client = useQueryClient();
  const submitting = useRef(false);
  const [validationError, setValidationError] = useState<string>();
  const mutation = useTypedMutation('uploadDocuments', {
    // A failed batch can still contain saved files; refresh the collection in either case.
    onSettled: () =>
      client.invalidateQueries({ queryKey: getTypedQueryOptions('documents').queryKey }),
  });
  async function submitFiles(files: File[]) {
    if (submitting.current) return;
    mutation.reset();
    const error = limits
      ? validateSelection(files, limits)
      : 'Wait for the document service to load.';
    setValidationError(error);
    if (error) return;
    submitting.current = true;
    try {
      await mutation.mutateAsync({ files });
      onImported();
    } catch {
      // The mutation exposes the server error for the import feedback.
    } finally {
      submitting.current = false;
    }
  }
  const imported =
    mutation.data?.results.filter((result) => result.outcome === 'imported').length ?? 0;
  const duplicates =
    mutation.data?.results.filter((result) => result.outcome === 'duplicate').length ?? 0;
  const summary = mutation.isSuccess
    ? [
        imported ? `${imported} ${imported === 1 ? 'document' : 'documents'} imported.` : '',
        duplicates ? `${duplicates} ${duplicates === 1 ? 'duplicate' : 'duplicates'} skipped.` : '',
      ]
        .filter(Boolean)
        .join(' ')
    : undefined;
  return {
    submitFiles,
    isPending: mutation.isPending,
    error: validationError ?? mutation.error?.message,
    summary,
  };
}
