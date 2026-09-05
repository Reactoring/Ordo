import type { ApiQueries } from '@ordo/contracts';
import { createTypedQueryOptions, type QueryEndpoints } from './typed-query-options';

const endpoints: QueryEndpoints<ApiQueries> = {
  serviceHealth: {
    url: () => '/api/health',
    parse: (data) => {
      if (
        typeof data !== 'object' ||
        data === null ||
        !('status' in data) ||
        data.status !== 'ok'
      ) {
        throw new Error('Unexpected service response.');
      }
      return { status: data.status };
    },
  },
};

export const getTypedQueryOptions = createTypedQueryOptions<ApiQueries>(endpoints);
