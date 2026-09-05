import { queryOptions } from '@tanstack/react-query';
import { getJson } from '../../api/http';

async function getServiceHealth(signal: AbortSignal) {
  const data = await getJson('/api/health', signal);

  if (typeof data !== 'object' || data === null || !('status' in data) || data.status !== 'ok') {
    throw new Error('Unexpected service response.');
  }

  return { status: 'ok' } as const;
}

export const serviceHealthQuery = queryOptions({
  queryKey: ['service', 'health'],
  queryFn: ({ signal }) => getServiceHealth(signal),
});
