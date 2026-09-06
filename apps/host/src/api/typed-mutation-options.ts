type MutationSchema<Schema> = { [Key in keyof Schema]: { variables: unknown; response: unknown } };

export type MutationEndpoints<Schema extends MutationSchema<Schema>> = {
  [Key in keyof Schema]: {
    execute: (variables: Schema[Key]['variables']) => Promise<unknown>;
    parse: (value: unknown) => Schema[Key]['response'];
  };
};

export function createTypedMutationOptions<Schema extends MutationSchema<Schema>>(
  endpoints: MutationEndpoints<Schema>,
) {
  return function getTypedMutationOptions<Key extends keyof Schema & string>(endpoint: Key) {
    const definition = endpoints[endpoint];
    return {
      mutationKey: ['api', endpoint] as const,
      mutationFn: async (variables: Schema[Key]['variables']): Promise<Schema[Key]['response']> =>
        definition.parse(await definition.execute(variables)),
    };
  };
}
