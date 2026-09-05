export { Button, type ButtonProps } from './button/Button';
export { buttonClassName, type ButtonVariant } from './button/button-styles';

export function OrdoBrand() {
  return (
    <span className="ordo-brand" aria-label="ORDO">
      <span className="ordo-symbol" aria-hidden="true">
        <span />
        <span />
      </span>
      <span>ORDO</span>
    </span>
  );
}
