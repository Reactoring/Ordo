import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { DocumentResponse, ReviewDocumentInput } from '@ordo/contracts';
import { getTypedQueryOptions } from '../../../api/endpoints';
import { HttpError } from '../../../api/http';
import { useTypedQuery } from '../../../hooks/useTypedQuery';
import { useTypedMutation } from '../../../hooks/useTypedMutation';

export function useDocumentReview(id: string) {
  const client = useQueryClient();
  const validId = /^[a-f0-9]{64}$/.test(id);
  const query = useTypedQuery('document', { id }, { enabled: validId });
  const attempted = useRef(new Set<string>());
  async function publish(response: DocumentResponse) {
    const key = getTypedQueryOptions('document', { id: response.document.id }).queryKey;
    await client.cancelQueries({ queryKey: key });
    client.setQueryData(key, (current) =>
      current && current.document.revision > response.document.revision ? current : response,
    );
    const collectionKey = getTypedQueryOptions('documents').queryKey;
    const published = client.getQueryData(key)?.document ?? response.document;
    client.setQueryData(collectionKey, (current) =>
      current
        ? {
            ...current,
            documents: current.documents.map((document) =>
              document.id === response.document.id
                ? { ...document, status: published.status }
                : document,
            ),
          }
        : current,
    );
    await client.invalidateQueries({ queryKey: collectionKey });
  }
  const extraction = useTypedMutation('extractDocument', { onSuccess: publish });
  const review = useTypedMutation('reviewDocument', {
    onSuccess: publish,
    onError: async (error) => {
      if (error instanceof HttpError && error.status === 409) {
        await client.invalidateQueries({
          queryKey: getTypedQueryOptions('document', { id }).queryKey,
        });
      }
    },
  });
  const { mutate: extract } = extraction;
  const document = query.data?.document;
  useEffect(() => {
    if (document?.extraction.status === 'pending' && !attempted.current.has(id)) {
      attempted.current.add(id);
      extract({ id });
    }
  }, [document?.extraction.status, extract, id]);
  return {
    document,
    notFound:
      !validId || (!document && query.error instanceof HttpError && query.error.status === 404),
    isLoading:
      query.isPending || (document?.extraction.status === 'pending' && !extraction.isError),
    error: !document
      ? query.error
      : document.extraction.status === 'pending'
        ? extraction.error
        : null,
    isRetrying: query.isFetching || extraction.isPending,
    retry: () => (!document ? void query.refetch() : extract({ id })),
    save: async (input: ReviewDocumentInput) => (await review.mutateAsync({ id, input })).document,
  };
}
