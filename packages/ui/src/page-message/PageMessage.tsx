import type { ComponentPropsWithoutRef } from 'react';

interface PageMessageProps extends ComponentPropsWithoutRef<'section'> {
  title: string;
  description: string;
  label?: string;
}

export function PageMessage({
  title,
  description,
  label,
  children,
  className = '',
  ...props
}: PageMessageProps) {
  return (
    <section
      {...props}
      className={`rounded-3xl border border-line bg-white p-7 sm:p-12 ${className}`}
    >
      {label ? (
        <p className="mb-3 text-xs font-semibold tracking-widest text-plum-600 uppercase">
          {label}
        </p>
      ) : null}
      <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{title}</h1>
      <p className="mt-4 max-w-xl leading-7 text-muted">{description}</p>
      {children ? <div className="mt-7 flex flex-wrap gap-3">{children}</div> : null}
    </section>
  );
}
