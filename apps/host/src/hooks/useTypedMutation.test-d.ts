import { expectTypeOf } from 'vitest';
import type {
  DocumentResponse,
  ReviewDocumentInput,
  UploadDocumentsResponse,
} from '@ordo/contracts';
import { useTypedMutation } from './useTypedMutation';

export function TypedMutationTypeChecks() {
  useTypedMutation('reviewDocument', {
    onSuccess: (data, variables) => {
      expectTypeOf(data).toEqualTypeOf<DocumentResponse>();
      expectTypeOf(variables.input).toEqualTypeOf<ReviewDocumentInput>();
    },
  });
  // @ts-expect-error A review needs both an identifier and a typed review payload.
  useTypedMutation('reviewDocument').mutate({ id: '42' });
  // @ts-expect-error Extraction needs an identifier rather than uploaded files.
  useTypedMutation('extractDocument').mutate({ files: [] });
  const upload = useTypedMutation('uploadDocuments');
  expectTypeOf(upload.data).toEqualTypeOf<UploadDocumentsResponse | undefined>();
  expectTypeOf(upload.mutateAsync({ files: [] })).toEqualTypeOf<Promise<UploadDocumentsResponse>>();
  useTypedMutation('uploadDocuments', {
    onSuccess: (data, variables) => {
      expectTypeOf(data).toEqualTypeOf<UploadDocumentsResponse>();
      expectTypeOf(variables.files).toEqualTypeOf<readonly File[]>();
    },
  });
  // @ts-expect-error Only registered mutations are accepted.
  useTypedMutation('missing');
  // @ts-expect-error File inputs are required.
  upload.mutate({});
  // @ts-expect-error File names cannot replace file objects.
  upload.mutate({ files: ['invoice.pdf'] });
  // @ts-expect-error Mutation functions belong to the endpoint catalog.
  useTypedMutation('uploadDocuments', { mutationFn: async () => ({ results: [] }) });
  // @ts-expect-error Cache keys belong to the endpoint catalog.
  useTypedMutation('uploadDocuments', { mutationKey: ['custom'] });
}
