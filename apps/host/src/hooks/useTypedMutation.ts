import { useMutation, type UseMutationOptions } from '@tanstack/react-query';
import { getTypedMutationOptions, type ApiMutations } from '../api/mutations';

type Endpoint = keyof ApiMutations;
type ManagedOptions = 'mutationKey' | 'mutationFn';
type OptionsFor<Key extends Endpoint, Context> = Omit<
  UseMutationOptions<ApiMutations[Key]['response'], Error, ApiMutations[Key]['variables'], Context>,
  ManagedOptions
> & { [Option in ManagedOptions]?: never };

export function useTypedMutation<Key extends Endpoint, Context = unknown>(
  endpoint: Key,
  options?: OptionsFor<NoInfer<Key>, Context>,
) {
  return useMutation<ApiMutations[Key]['response'], Error, ApiMutations[Key]['variables'], Context>(
    {
      retry: false,
      ...options,
      ...getTypedMutationOptions(endpoint),
    },
  );
}
