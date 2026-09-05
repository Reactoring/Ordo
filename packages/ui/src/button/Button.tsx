import type { ComponentPropsWithRef } from 'react';
import { buttonClassName, type ButtonVariant } from './button-styles';

export interface ButtonProps extends ComponentPropsWithRef<'button'> {
  variant?: ButtonVariant;
}

export function Button({
  variant = 'primary',
  className = '',
  type = 'button',
  ...props
}: ButtonProps) {
  return <button {...props} type={type} className={buttonClassName({ variant, className })} />;
}
