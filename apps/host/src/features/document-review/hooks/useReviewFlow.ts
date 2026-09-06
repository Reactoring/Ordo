import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate, useSearchParams } from 'react-router';
import type { DocumentReviewProps, ReviewDocumentInput } from '@ordo/contracts';
import { getTypedQueryOptions } from '../../../api/endpoints';
import { useTypedQuery } from '../../../hooks/useTypedQuery';
import type { ReviewNotice } from '../review-notice';

export function useReviewFlow(id: string, persist: DocumentReviewProps['onSave']) {
  const [params] = useSearchParams();
  const isQueue = params.get('mode') === 'queue';
  const navigate = useNavigate();
  const client = useQueryClient();
  const active = useRef(true);
  useEffect(() => {
    active.current = true;
    return () => {
      active.current = false;
    };
  }, []);
  const collection = useTypedQuery('documents', undefined, {
    enabled: isQueue && /^[a-f0-9]{64}$/.test(id),
  });
  const pending = collection.data?.documents.filter((document) => document.status !== 'reviewed');
  const next = pending?.find((document) => document.id !== id);
  function goTo(path: string, reviewNotice: ReviewNotice) {
    if (active.current) void navigate(path, { replace: true, state: { reviewNotice } });
  }
  async function save(input: ReviewDocumentInput) {
    const saved = await persist(input);
    if (!isQueue) {
      goTo('/documents?status=reviewed', {
        title: 'Document saved',
        description: `${saved.fileName} is validated and saved in Reviewed.`,
      });
      return saved;
    }
    // A failed queue refresh must never turn a successful save into a form error.
    let refreshed;
    try {
      refreshed = await client.fetchQuery({ ...getTypedQueryOptions('documents'), retry: false });
    } catch {
      goTo('/documents?status=reviewed', {
        title: 'Document saved',
        description: `${saved.fileName} is validated. The remaining queue could not be loaded; return to Needs review to continue.`,
      });
      return saved;
    }
    const nextDocument = refreshed.documents.find(
      (document) => document.id !== saved.id && document.status !== 'reviewed',
    );
    if (nextDocument) {
      goTo(`/review/${nextDocument.id}?mode=queue`, {
        title: 'Saved. Next document.',
        description: `${saved.fileName} is validated. You are now reviewing ${nextDocument.fileName}.`,
      });
    } else {
      goTo('/documents?status=reviewed', {
        title: 'Review complete',
        description: `${saved.fileName} is saved. No documents are waiting for review.`,
      });
    }
    return saved;
  }
  return {
    isQueue,
    remaining: pending?.length,
    save,
    saveLabel: !isQueue
      ? 'Save and return'
      : !collection.data || collection.isError
        ? 'Save and continue'
        : next
          ? 'Save and next'
          : 'Save and finish',
    saveHint: !isQueue
      ? 'Validate this document and return to Reviewed.'
      : !collection.data || collection.isError
        ? 'After saving, we’ll check for the next document to review.'
        : next
          ? `After saving, you’ll review ${next.fileName}.`
          : 'Validate the last document and return to Reviewed.',
  };
}
