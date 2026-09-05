import { Button } from '@ordo/ui';
import { useTypedQuery } from '../../hooks/useTypedQuery';

export function ServiceStatus() {
  const { fetchStatus, isPending, isError, isFetching, refetch } = useTypedQuery('serviceHealth');

  let message = 'Document service available';
  if (fetchStatus === 'paused') message = 'Waiting for a connection…';
  else if (isPending) message = 'Checking document service…';
  else if (isError) message = 'Document service unavailable.';

  return (
    <div className="flex flex-wrap items-center gap-3 text-xs text-muted">
      <p role="status">{message}</p>
      {isError ? (
        <Button
          variant="secondary"
          size="sm"
          disabled={isFetching || fetchStatus === 'paused'}
          onClick={() => void refetch()}
        >
          Try again
        </Button>
      ) : null}
    </div>
  );
}
