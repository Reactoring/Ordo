import type { ReactNode } from 'react';

interface EmptyStateProps {
  title: string;
  description: string;
  icon: ReactNode;
  children?: ReactNode;
}

export function EmptyState({ title, description, icon, children }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center px-5 py-16 text-center sm:py-20">
      <div
        className="mb-5 flex size-16 items-center justify-center rounded-2xl bg-plum-50 text-plum-600"
        aria-hidden="true"
      >
        {icon}
      </div>
      <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
      <p className="mt-2 max-w-sm text-sm leading-6 text-muted">{description}</p>
      {children ? <div className="mt-6">{children}</div> : null}
    </div>
  );
}
