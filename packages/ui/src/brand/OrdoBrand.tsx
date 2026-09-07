const logoUrl = new URL('./ordo-mark.svg', import.meta.url).href;

export function OrdoBrand() {
  return (
    <span
      className="inline-flex items-center gap-3 text-xl font-semibold tracking-[0.14em]"
      aria-label="ORDO"
    >
      <img src={logoUrl} alt="" width={36} height={36} className="size-9 shrink-0" />
      <span>ORDO</span>
    </span>
  );
}
