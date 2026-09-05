import type { ComponentPropsWithRef } from 'react';
import { buttonClassName, type ButtonSize, type ButtonVariant } from './button-styles';

export interface ButtonProps extends ComponentPropsWithRef<'button'> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

export function Button({
  variant = 'primary',
  size = 'md',
  className = '',
  type = 'button',
  ...props
}: ButtonProps) {
  return (
    <button {...props} type={type} className={buttonClassName({ variant, size, className })} />
  );
}
