import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Field, NumberField, Section } from "./Field";
import {
  ANTI_DILUTION_OPTIONS,
  LIQ_PREF_OPTIONS,
  VETO_OPTIONS,
  formatCHF,
  formatPct,
  type TermSheet,
} from "@/lib/deal";

type Props = {
  terms: TermSheet;
  onChange: <K extends keyof TermSheet>(key: K, value: TermSheet[K]) => void;
  onAnalyze: () => void;
  postMoney: number;
  impliedEquity: number;
};

export function InputView({ terms, onChange, onAnalyze, postMoney, impliedEquity }: Props) {
  const trancheCount = Math.max(0, Math.min(6, Math.round(terms.tranches)));


  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
      <div className="grid gap-5">
        <Section
          index="01"
          title="Investment"
          description="The headline numbers of the proposed round."
        >
          <Field label="Ticket size">
            <NumberField
              value={terms.ticketSize}
              onChange={(v) => onChange("ticketSize", v)}
              prefix="CHF"
              step={50000}
            />
          </Field>
          <Field label="Company funding requirement">
            <NumberField
              value={terms.fundingRequirement}
              onChange={(v) => onChange("fundingRequirement", v)}
              prefix="CHF"
              step={50000}
            />
          </Field>
          <Field label="Pre-money valuation" full>
            <NumberField
              value={terms.preMoney}
              onChange={(v) => onChange("preMoney", v)}
              prefix="CHF"
              step={100000}
            />
          </Field>
        </Section>

        <Section
          index="02"
          title="Ownership"
          description="What the term sheet states, before we check it against the maths."
        >
          <Field label="Investor equity" hint={`Implied by valuation: ${formatPct(impliedEquity)}`}>
            <NumberField
              value={terms.investorEquity}
              onChange={(v) => onChange("investorEquity", v)}
              suffix="%"
              step={0.5}
            />
          </Field>
          <Field label="Founder ownership (pre-round)" hint="Calculated as 100% − investor equity">
            <div className="relative">
              <div className="numeric flex h-11 items-center rounded-md border border-input bg-surface-2/60 px-3 text-base text-muted-foreground">
                <span className="mr-1">{formatPct(100 - terms.investorEquity)}</span>
              </div>
              <span className="numeric pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-xs text-muted-foreground">
                %
              </span>
            </div>
          </Field>
        </Section>

        <Section index="03" title="Liquidation preference">
          <Field label="Type" full>
            <Select
              value={terms.liquidationPreference}
              onValueChange={(v) =>
                onChange("liquidationPreference", v as TermSheet["liquidationPreference"])
              }
            >
              <SelectTrigger className="h-11 w-full bg-surface-2/60">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LIQ_PREF_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        </Section>

        <Section index="04" title="Vesting">
          <Field label="Vesting period">
            <NumberField
              value={terms.vestingYears}
              onChange={(v) => onChange("vestingYears", v)}
              suffix="years"
              step={0.5}
            />
          </Field>
          <Field label="Cliff">
            <NumberField
              value={terms.cliffYears}
              onChange={(v) => onChange("cliffYears", v)}
              suffix="years"
              step={0.25}
            />
          </Field>
        </Section>

        <Section index="05" title="Board & control">
          <Field label="Investor board seat">
            <div className="flex h-11 items-center gap-3 rounded-md border border-input bg-surface-2/60 px-3">
              <Switch
                checked={terms.investorBoardSeat}
                onCheckedChange={(v) => onChange("investorBoardSeat", v)}
              />
              <span className="text-sm text-muted-foreground">
                {terms.investorBoardSeat ? "Yes" : "No"}
              </span>
            </div>
          </Field>
          <Field label="Number of investor board seats">
            <NumberField
              value={terms.investorBoardSeats}
              onChange={(v) => onChange("investorBoardSeats", v)}
              step={1}
            />
          </Field>
          <Field label="Veto rights" full>
            <Select
              value={terms.vetoRights}
              onValueChange={(v) => onChange("vetoRights", v as TermSheet["vetoRights"])}
            >
              <SelectTrigger className="h-11 w-full bg-surface-2/60">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {VETO_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        </Section>

        <Section index="06" title="Anti-dilution">
          <Field label="Protection" full>
            <Select
              value={terms.antiDilution}
              onValueChange={(v) => onChange("antiDilution", v as TermSheet["antiDilution"])}
            >
              <SelectTrigger className="h-11 w-full bg-surface-2/60">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ANTI_DILUTION_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        </Section>

        <Section
          index="07"
          title="Tranches"
          description="Capital released against milestones instead of at closing."
        >
          <Field label="Number of tranches" full>
            <NumberField
              value={terms.tranches}
              onChange={(v) => onChange("tranches", Math.min(6, Math.max(0, v)))}
              step={1}
              min={0}
            />
          </Field>
          {trancheCount > 0 && Array.from({ length: trancheCount }).map((_, i) => (

            <Field key={i} label={`Tranche ${i + 1} milestone`} full>
              <Input
                value={terms.milestones[i] ?? ""}
                placeholder={i === 0 ? "e.g. Signing / closing" : "e.g. CHF 500k ARR reached"}
                onChange={(e) => {
                  const next = [...terms.milestones];
                  next[i] = e.target.value;
                  onChange("milestones", next);
                }}
                className="h-11 bg-surface-2/60"
              />
            </Field>
          ))}
        </Section>

        <Section
          index="08"
          title="Optional exit scenario"
          description="Used to model the liquidation waterfall."
        >
          <Field label="Expected company exit value" full>
            <NumberField
              value={terms.exitValue}
              onChange={(v) => onChange("exitValue", v)}
              prefix="CHF"
              step={1000000}
            />
          </Field>
        </Section>
      </div>

      <aside className="panel sticky top-24 hidden p-6 lg:block">
        <p className="label-caps">Live maths</p>
        <dl className="mt-4 space-y-4">
          <div>
            <dt className="text-xs text-muted-foreground">Post-money valuation</dt>
            <dd className="numeric text-xl font-semibold text-foreground">
              {formatCHF(postMoney)}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Implied investor equity</dt>
            <dd className="numeric text-xl font-semibold text-primary">
              {formatPct(impliedEquity)}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Funding gap</dt>
            <dd className="numeric text-xl font-semibold text-foreground">
              {formatCHF(terms.fundingRequirement - terms.ticketSize)}
            </dd>
          </div>
        </dl>
        <Button variant="hero" size="lg" className="mt-6 w-full" onClick={onAnalyze}>
          Analyze deal
        </Button>
      </aside>

      <div className="lg:hidden">
        <Button variant="hero" size="lg" className="w-full" onClick={onAnalyze}>
          Analyze deal
        </Button>
      </div>
    </div>
  );
}
