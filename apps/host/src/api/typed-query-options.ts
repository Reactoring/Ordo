import { queryOptions } from '@tanstack/react-query';
import { getJson } from './http';

type QuerySchema<Schema> = {
  [Key in keyof Schema]: { params: unknown; response: unknown };
};

export type QueryEndpoints<Schema extends QuerySchema<Schema>> = {
  [Key in keyof Schema]: {
    url: (params: Schema[Key]['params']) => string;
    parse: (value: unknown) => Schema[Key]['response'];
  };
};

export type QueryParameters<Params, Options = never> = [Params] extends [undefined]
  ? [params?: Params, options?: Options]
  : [params: Params, options?: Options];

export function createTypedQueryOptions<Schema extends QuerySchema<Schema>>(
  endpoints: QueryEndpoints<Schema>,
) {
  return function getTypedQueryOptions<Key extends keyof Schema & string>(
    endpoint: Key,
    ...[params]: QueryParameters<NoInfer<Schema[Key]['params']>>
  ) {
    const definition = endpoints[endpoint];
    const queryKey = ['api', endpoint, params] as const;
    const queryFn = async ({
      signal,
    }: {
      signal: AbortSignal;
    }): Promise<Schema[Key]['response']> => {
      const value = await getJson(definition.url(params), signal);
      return definition.parse(value);
    };

    return { queryKey: queryOptions({ queryKey, queryFn }).queryKey, queryFn };
  };
}
