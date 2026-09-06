import { useId, type ComponentPropsWithRef, type ReactNode } from 'react';

interface FieldProps {
  label: string;
  error?: string | undefined;
  hint?: string | undefined;
}

const controlStyle =
  'min-h-11 w-full rounded-xl border border-line bg-white px-3 py-2.5 text-sm text-ink outline-offset-2 placeholder:text-muted/70 focus:border-plum-400 focus:outline-2 focus:outline-plum-300 disabled:bg-canvas disabled:text-muted aria-invalid:border-warning';

function FieldFrame({
  id,
  label,
  hint,
  error,
  children,
}: FieldProps & { id: string; children: ReactNode }) {
  return (
    <div className="min-w-0">
      <label htmlFor={id} className="mb-1.5 block text-xs font-semibold text-ink">
        {label}
      </label>
      {children}
      {hint ? (
        <p id={`${id}-hint`} className="mt-1.5 text-xs leading-5 text-muted">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={`${id}-error`} className="mt-1.5 text-xs leading-5 text-warning">
          {error}
        </p>
      ) : null}
    </div>
  );
}

function descriptions(
  id: string,
  hint: string | undefined,
  error: string | undefined,
  existing?: string,
) {
  return (
    [existing, hint ? `${id}-hint` : '', error ? `${id}-error` : ''].filter(Boolean).join(' ') ||
    undefined
  );
}

export function TextField({
  label,
  error,
  hint,
  id: suppliedId,
  className = '',
  ...props
}: FieldProps & ComponentPropsWithRef<'input'>) {
  const generatedId = useId();
  const id = suppliedId ?? generatedId;
  return (
    <FieldFrame id={id} label={label} hint={hint} error={error}>
      <input
        {...props}
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={descriptions(id, hint, error, props['aria-describedby'])}
        className={`${controlStyle} ${className}`}
      />
    </FieldFrame>
  );
}

export function SelectField({
  label,
  error,
  hint,
  id: suppliedId,
  className = '',
  ...props
}: FieldProps & ComponentPropsWithRef<'select'>) {
  const generatedId = useId();
  const id = suppliedId ?? generatedId;
  return (
    <FieldFrame id={id} label={label} hint={hint} error={error}>
      <select
        {...props}
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={descriptions(id, hint, error, props['aria-describedby'])}
        className={`${controlStyle} ${className}`}
      />
    </FieldFrame>
  );
}
