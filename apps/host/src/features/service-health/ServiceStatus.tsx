import { useQuery } from '@tanstack/react-query';
import { serviceHealthQuery } from './service-health.query';

export function ServiceStatus() {
  const { fetchStatus, isPending, isError, isFetching, refetch } = useQuery(serviceHealthQuery);

  let message = 'Document service available';
  if (fetchStatus === 'paused') message = 'Waiting for a connection…';
  else if (isPending) message = 'Checking document service…';
  else if (isError) message = 'Document service unavailable.';

  return (
    <div className="mt-6 flex flex-wrap items-center gap-3 text-sm">
      <p role="status">{message}</p>
      {isError && (
        <button
          className="button button-secondary"
          disabled={isFetching || fetchStatus === 'paused'}
          onClick={() => void refetch()}
        >
          Try again
        </button>
      )}
    </div>
  );
}
