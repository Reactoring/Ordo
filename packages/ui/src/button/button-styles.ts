export type ButtonVariant = 'primary' | 'secondary' | 'ghost';
export type ButtonSize = 'sm' | 'md';

interface ButtonStyleOptions {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
}

const variants: Record<ButtonVariant, string> = {
  primary: 'border-transparent bg-plum-800 text-white hover:bg-plum-900 disabled:hover:bg-plum-800',
  secondary: 'border-plum-100 bg-white text-plum-800 hover:bg-plum-50 disabled:hover:bg-white',
  ghost: 'border-transparent text-plum-700 hover:bg-plum-50 disabled:hover:bg-transparent',
};

const sizes: Record<ButtonSize, string> = {
  sm: 'min-h-9 px-3 py-1.5 text-xs',
  md: 'min-h-11 px-4 py-2.5 text-sm',
};

export function buttonClassName({
  variant = 'primary',
  size = 'md',
  className,
}: ButtonStyleOptions = {}) {
  return [
    'inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border font-semibold no-underline transition-colors disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none',
    variants[variant],
    sizes[size],
    className,
  ]
    .filter(Boolean)
    .join(' ');
}
