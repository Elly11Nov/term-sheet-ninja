import type { ReactNode } from "react";
import { Input } from "@/components/ui/input";

export function Section({
  title,
  index,
  description,
  children,
}: {
  title: string;
  index: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="panel p-5 sm:p-6">
      <header className="mb-5 flex items-start gap-3">
        <span className="numeric mt-0.5 rounded-md bg-secondary px-2 py-1 text-xs text-muted-foreground">
          {index}
        </span>
        <div>
          <h2 className="text-sm font-semibold tracking-wide text-foreground uppercase">{title}</h2>
          {description ? (
            <p className="mt-1 text-xs text-muted-foreground">{description}</p>
          ) : null}
        </div>
      </header>
      <div className="grid gap-4 sm:grid-cols-2">{children}</div>
    </section>
  );
}

export function Field({
  label,
  hint,
  full,
  children,
}: {
  label: string;
  hint?: string;
  full?: boolean;
  children: ReactNode;
}) {
  return (
    <div className={full ? "sm:col-span-2" : undefined}>
      <div className="label-caps mb-2 block">{label}</div>
      {children}
      {hint ? <p className="mt-1.5 text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

export function NumberField({
  value,
  onChange,
  prefix,
  suffix,
  step = 1,
  min = 0,
}: {
  value: number;
  onChange: (v: number) => void;
  prefix?: string;
  suffix?: string;
  step?: number;
  min?: number;
}) {
  return (
    <div className="relative">
      {prefix ? (
        <span className="numeric pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-xs text-muted-foreground">
          {prefix}
        </span>
      ) : null}
      <Input
        type="number"
        inputMode="decimal"
        min={min}
        step={step}
        value={Number.isFinite(value) ? value : 0}
        onChange={(e) => onChange(e.target.value === "" ? 0 : Number(e.target.value))}
        className={`numeric h-11 bg-surface-2/60 text-base ${prefix ? "pl-12" : ""} ${suffix ? "pr-10" : ""}`}
      />
      {suffix ? (
        <span className="numeric pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-xs text-muted-foreground">
          {suffix}
        </span>
      ) : null}
    </div>
  );
}
