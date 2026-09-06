import type { ApiQueries, DocumentResponse, ServiceHealthResponse } from '@ordo/contracts';
import { QueryClient } from '@tanstack/react-query';
import { expectTypeOf } from 'vitest';
import { getTypedQueryOptions } from '../api/endpoints';
import { createTypedQueryOptions, type QueryEndpoints } from '../api/typed-query-options';
import { useTypedQuery } from './useTypedQuery';

interface TestQueries {
  document: { params: { id: string }; response: { id: string } };
  documents: { params: { page: number }; response: { total: number } };
}

declare const testEndpoints: QueryEndpoints<TestQueries>;

export function checkEndpointTypes() {
  const optionsFor = createTypedQueryOptions<TestQueries>(testEndpoints);
  const client = new QueryClient();
  const document = optionsFor('document', { id: '42' });
  const documents = optionsFor('documents', { page: 1 });
  expectTypeOf(client.getQueryData(document.queryKey)).toEqualTypeOf<{ id: string } | undefined>();
  expectTypeOf(client.getQueryData(documents.queryKey)).toEqualTypeOf<
    { total: number } | undefined
  >();
  expectTypeOf(client.getQueryData(getTypedQueryOptions('serviceHealth').queryKey)).toEqualTypeOf<
    ServiceHealthResponse | undefined
  >();

  // @ts-expect-error Unknown endpoints are rejected.
  optionsFor('missing', {});
  // @ts-expect-error Required endpoint parameters cannot be omitted.
  optionsFor('document');
  // @ts-expect-error Parameters cannot be borrowed from a different endpoint.
  optionsFor('document', { page: 1 });
  // @ts-expect-error Parameter values keep their declared types.
  optionsFor('documents', { page: '1' });
  // @ts-expect-error Unexpected parameter properties are rejected.
  optionsFor('documents', { page: 1, id: '42' });

  const invalidEndpoints: QueryEndpoints<Pick<ApiQueries, 'serviceHealth'>> = {
    serviceHealth: {
      url: () => '/api/health',
      // @ts-expect-error The decoder must return the registered response shape.
      parse: () => ({ status: 123 }),
    },
  };
  void invalidEndpoints;
}

export function TypedQueryTypeChecks() {
  const document = useTypedQuery('document', { id: '42' });
  expectTypeOf(document.data).toEqualTypeOf<DocumentResponse | undefined>();
  // @ts-expect-error A document identifier is required.
  useTypedQuery('document');
  // @ts-expect-error Identifiers cannot be numeric.
  useTypedQuery('document', { id: 42 });
  const query = useTypedQuery('serviceHealth');
  expectTypeOf(query.data).toEqualTypeOf<ServiceHealthResponse | undefined>();
  const selected = useTypedQuery('serviceHealth', undefined, { select: (data) => data.status });
  expectTypeOf(selected.data).toEqualTypeOf<'ok' | undefined>();

  // @ts-expect-error Only registered endpoints can be queried.
  useTypedQuery('missing');
  // @ts-expect-error The health endpoint accepts no parameters.
  useTypedQuery('serviceHealth', { page: 1 });
  // @ts-expect-error A response type cannot be supplied without a matching select function.
  useTypedQuery<'serviceHealth', string>('serviceHealth');
  useTypedQuery<'serviceHealth', number>('serviceHealth', undefined, {
    // @ts-expect-error The selected result must agree with the select return type.
    select: (data) => data.status,
  });
  // @ts-expect-error The hook owns cache keys.
  useTypedQuery('serviceHealth', undefined, { queryKey: ['other'] });
  // @ts-expect-error The hook owns HTTP requests and response decoding.
  useTypedQuery('serviceHealth', undefined, { queryFn: async () => ({ status: 'ok' }) });
}
