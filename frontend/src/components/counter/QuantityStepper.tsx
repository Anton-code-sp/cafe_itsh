interface QuantityStepperProps {
  value: number;
  onChange: (value: number) => void;
  /** Cantidad máxima (límite actual del sistema: 99). */
  max?: number;
  disabled?: boolean;
  /** Etiqueta accesible base; se combina con el nombre del platillo. */
  label?: string;
}

/**
 * Stepper `− n +` con botones de 44 px (FR-020). `−` queda deshabilitado
 * en 0; el valor nunca baja de 0 ni sube de `max`.
 */
export function QuantityStepper({
  value,
  onChange,
  max = 99,
  disabled = false,
  label = "cantidad",
}: QuantityStepperProps) {
  return (
    <div className="flex shrink-0 items-center gap-1" role="group" aria-label={label}>
      <button
        type="button"
        aria-label={`Quitar una unidad de ${label}`}
        disabled={disabled || value <= 0}
        onClick={() => onChange(Math.max(0, value - 1))}
        className="flex h-11 w-11 items-center justify-center rounded-md border border-outline-variant bg-white text-xl leading-none text-on-surface transition-colors hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-40"
      >
        −
      </button>
      <span
        aria-live="polite"
        className="w-8 text-center font-display text-title-md font-bold text-on-surface"
      >
        {value}
      </span>
      <button
        type="button"
        aria-label={`Agregar una unidad de ${label}`}
        disabled={disabled || value >= max}
        onClick={() => onChange(Math.min(max, value + 1))}
        className="flex h-11 w-11 items-center justify-center rounded-md border border-outline-variant bg-white text-xl leading-none text-on-surface transition-colors hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-40"
      >
        +
      </button>
    </div>
  );
}
