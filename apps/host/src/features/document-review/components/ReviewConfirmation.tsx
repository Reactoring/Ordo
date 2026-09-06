import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router';
import { Button, Icon } from '@ordo/ui';
import { readReviewNotice } from '../review-notice';

export function ReviewConfirmation() {
  const location = useLocation();
  const notice = readReviewNotice(location.state);
  const [dismissed, setDismissed] = useState<string>();
  const banner = useRef<HTMLDivElement>(null);
  useEffect(() => {
    banner.current?.focus();
  }, [location.key]);
  if (!notice || dismissed === location.key) return null;
  return (
    <div
      ref={banner}
      tabIndex={-1}
      role="status"
      aria-atomic="true"
      className="mb-6 flex items-start gap-3 rounded-2xl border border-success/20 bg-success-soft p-4 text-success focus:outline-offset-4"
    >
      <Icon name="check" className="mt-0.5 size-5 shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="font-semibold">{notice.title}</p>
        <p className="mt-1 text-sm leading-6 break-words">{notice.description}</p>
      </div>
      <Button variant="ghost" size="sm" onClick={() => setDismissed(location.key)}>
        Dismiss
      </Button>
    </div>
  );
}
