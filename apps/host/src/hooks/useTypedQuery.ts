import { useQuery, type UseQueryOptions, type UseQueryResult } from '@tanstack/react-query';
import type { ApiQueries } from '@ordo/contracts';
import { getTypedQueryOptions } from '../api/endpoints';
import type { QueryParameters } from '../api/typed-query-options';

type Endpoint = keyof ApiQueries;
type ResponseFor<Key extends Endpoint> = ApiQueries[Key]['response'];
type KeyFor<Key extends Endpoint> = readonly ['api', Key, ApiQueries[Key]['params']];
type ManagedOptions = 'queryKey' | 'queryFn' | 'queryKeyHashFn' | 'initialData';

type OptionsFor<Key extends Endpoint, Selected = ResponseFor<Key>> = Omit<
  UseQueryOptions<ResponseFor<Key>, Error, Selected, KeyFor<Key>>,
  ManagedOptions
> & { [Option in ManagedOptions]?: never };

export function useTypedQuery<Key extends Endpoint>(
  endpoint: Key,
  ...args: QueryParameters<
    NoInfer<ApiQueries[Key]['params']>,
    Omit<OptionsFor<Key>, 'select'> & { select?: never }
  >
): UseQueryResult<ResponseFor<Key>, Error>;

export function useTypedQuery<Key extends Endpoint, Selected>(
  endpoint: Key,
  params: NoInfer<ApiQueries[Key]['params']>,
  options: OptionsFor<Key, Selected> & { select: (data: ResponseFor<Key>) => Selected },
): UseQueryResult<Selected, Error>;

export function useTypedQuery<Key extends Endpoint, Selected = ResponseFor<Key>>(
  endpoint: Key,
  params?: ApiQueries[Key]['params'],
  options?: OptionsFor<Key, Selected>,
) {
  // Public overloads require parameters whenever the endpoint contract requires them.
  const queryArgs = [params] as QueryParameters<NoInfer<ApiQueries[Key]['params']>>;
  const { queryKey, queryFn } = getTypedQueryOptions(endpoint, ...queryArgs);
  return useQuery<ResponseFor<Key>, Error, Selected, KeyFor<Key>>({
    ...options,
    queryKey,
    queryFn,
  });
}
