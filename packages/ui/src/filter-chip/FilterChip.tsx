import type { ComponentPropsWithRef } from 'react';

interface FilterChipProps extends ComponentPropsWithRef<'button'> {
  active: boolean;
  count: number;
}

export function FilterChip({ active, count, children, className = '', ...props }: FilterChipProps) {
  const appearance = active
    ? 'border-plum-800 bg-plum-800 text-white'
    : 'border-line bg-white text-muted hover:border-plum-200 hover:text-plum-800';

  return (
    <button
      {...props}
      type="button"
      aria-pressed={active}
      className={`inline-flex min-h-11 shrink-0 items-center gap-2 rounded-xl border px-3.5 py-2 text-sm font-semibold transition-colors motion-reduce:transition-none ${appearance} ${className}`}
    >
      {children}{' '}
      <span
        className={
          active
            ? 'rounded-full bg-white/20 px-1.5 text-xs leading-5'
            : 'rounded-full bg-plum-50 px-1.5 text-xs leading-5 text-plum-700'
        }
      >
        {count}
      </span>
    </button>
  );
}
