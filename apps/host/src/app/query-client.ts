import { QueryClient } from '@tanstack/react-query';
import { HttpError } from '../api/http';

export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        gcTime: 5 * 60_000,
        retry: (failureCount, error) => {
          const isTransient =
            error instanceof TypeError || (error instanceof HttpError && error.status >= 500);
          return isTransient && failureCount < 1;
        },
      },
    },
  });
}
