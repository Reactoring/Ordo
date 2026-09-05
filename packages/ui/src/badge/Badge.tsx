import type { ComponentPropsWithoutRef } from 'react';

type BadgeTone = 'neutral' | 'warning' | 'success';

interface BadgeProps extends ComponentPropsWithoutRef<'span'> {
  tone?: BadgeTone;
}

const tones: Record<BadgeTone, string> = {
  neutral: 'bg-plum-50 text-plum-700',
  warning: 'bg-warning-soft text-warning',
  success: 'bg-success-soft text-success',
};

export function Badge({ tone = 'neutral', className = '', ...props }: BadgeProps) {
  return (
    <span
      {...props}
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${tones[tone]} ${className}`}
    />
  );
}
