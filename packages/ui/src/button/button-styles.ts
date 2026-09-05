export type ButtonVariant = 'primary' | 'secondary';

interface ButtonStyleOptions {
  variant?: ButtonVariant;
  className?: string;
}

const variants: Record<ButtonVariant, string> = {
  primary: 'button',
  secondary: 'button button-secondary',
};

export function buttonClassName({ variant = 'primary', className }: ButtonStyleOptions = {}) {
  return [variants[variant], className].filter(Boolean).join(' ');
}
