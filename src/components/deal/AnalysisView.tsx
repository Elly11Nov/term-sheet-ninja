import { Button } from "@/components/ui/button";
import { analyze, formatCHF, formatPct, type Analysis, type TermSheet } from "@/lib/deal";

function Metric({
  label,
  value,
  sub,
  tone = "default",
}: {
  label: string;
  value: string;
  sub?: string;
  tone?: "default" | "primary" | "warning" | "destructive" | "success";
}) {
  const toneClass = {
    default: "text-foreground",
    primary: "text-primary",
    warning: "text-warning",
    destructive: "text-destructive",
    success: "text-success",
  }[tone];
  return (
    <div className="panel p-5">
      <p className="label-caps">{label}</p>
      <p className={`numeric mt-2 text-2xl font-semibold ${toneClass}`}>{value}</p>
      {sub ? <p className="mt-1 text-xs text-muted-foreground">{sub}</p> : null}
    </div>
  );
}

function SeverityDot({ severity }: { severity: "good" | "watch" | "risk" }) {
  const cls = {
    good: "bg-success",
    watch: "bg-warning",
    risk: "bg-destructive",
  }[severity];
  return <span className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${cls}`} />;
}

function Bar({ label, value, total, tone }: { label: string; value: number; total: number; tone: string }) {
  const pct = total > 0 ? (value / total) * 100 : 0;
  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="numeric font-medium text-foreground">
          {formatCHF(value, true)} · {formatPct(pct, 0)}
        </span>
      </div>
      <div className="h-2.5 w-full overflow-hidden rounded-full bg-secondary">
        <div className={`h-full rounded-full ${tone}`} style={{ width: `${Math.min(100, pct)}%` }} />
      </div>
    </div>
  );
}

export function AnalysisView({ terms, onBack }: { terms: TermSheet; onBack: () => void }) {
  const a: Analysis = analyze(terms);
  const scoreTone =
    a.score >= 80 ? "text-success" : a.score >= 60 ? "text-primary" : a.score >= 40 ? "text-warning" : "text-destructive";
  const risks = a.flags.filter((f) => f.severity === "risk");
  const watches = a.flags.filter((f) => f.severity === "watch");

  return (
    <div className="grid gap-5">
      <section className="panel flex flex-col gap-6 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
        <div>
          <p className="label-caps">Deal assessment</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">{a.verdict}</h2>
          <p className="mt-2 max-w-xl text-sm text-muted-foreground">
            {risks.length} red flag{risks.length === 1 ? "" : "s"} and {watches.length} point
            {watches.length === 1 ? "" : "s"} to negotiate across {a.flags.length} reviewed terms.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className={`numeric text-5xl font-semibold ${scoreTone}`}>{a.score}</p>
            <p className="label-caps mt-1">Founder score /100</p>
          </div>
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="Post-money valuation" value={formatCHF(a.postMoney)} sub={`Pre-money ${formatCHF(terms.preMoney, true)} + ticket ${formatCHF(terms.ticketSize, true)}`} />
        <Metric
          label="Implied investor equity"
          value={formatPct(a.impliedInvestorEquity)}
          tone="primary"
          sub={`Term sheet states ${formatPct(terms.investorEquity)} (${a.equityDelta >= 0 ? "+" : ""}${a.equityDelta.toFixed(1)} pts)`}
        />
        <Metric
          label="Founder ownership after"
          value={formatPct(a.founderAfter)}
          tone={a.founderAfter < 50 ? "warning" : "success"}
          sub={`Diluted by ${formatPct(a.founderDilution)} from ${formatPct(terms.founderOwnership)}`}
        />
        <Metric
          label="Funding gap"
          value={formatCHF(a.fundingGap)}
          tone={a.fundingGap > 0 ? "destructive" : "success"}
          sub={`Ticket covers ${formatPct(a.fundingCoverage, 0)} of the requirement`}
        />
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <section className="panel p-6">
          <p className="label-caps">Term-by-term review</p>
          <ul className="mt-4 divide-y divide-border">
            {a.flags.map((f) => (
              <li key={f.id} className="flex gap-3 py-4 first:pt-0 last:pb-0">
                <SeverityDot severity={f.severity} />
                <div>
                  <div className="flex flex-wrap items-baseline gap-x-2">
                    <span className="label-caps">{f.area}</span>
                    <h3 className="text-sm font-semibold text-foreground">{f.headline}</h3>
                  </div>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{f.detail}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <div className="grid gap-5 self-start">
          <section className="panel p-6">
            <p className="label-caps">Cap table after the round</p>
            <div className="mt-4 space-y-4">
              <Bar label="Investor" value={terms.investorEquity} total={100} tone="bg-accent" />
              <Bar label="Founders" value={a.founderAfter} total={100} tone="bg-primary" />
              <Bar
                label="Others / option pool"
                value={Math.max(0, 100 - terms.investorEquity - a.founderAfter)}
                total={100}
                tone="bg-muted-foreground"
              />
            </div>
          </section>

          <section className="panel p-6">
            <p className="label-caps">Exit waterfall</p>
            <p className="numeric mt-2 text-lg font-semibold">{formatCHF(terms.exitValue)}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {a.prefMultiple}x {a.participating ? "participating" : "non-participating"} preference
              applied first ({formatCHF(a.prefMultiple * terms.ticketSize)}).
            </p>
            <div className="mt-4 space-y-4">
              <Bar label="Investor proceeds" value={a.investorExitProceeds} total={terms.exitValue} tone="bg-accent" />
              <Bar label="Founder proceeds" value={a.founderExitProceeds} total={terms.exitValue} tone="bg-primary" />
              <Bar label="Other shareholders" value={a.otherExitProceeds} total={terms.exitValue} tone="bg-muted-foreground" />
            </div>
          </section>

          <section className="panel p-6">
            <p className="label-caps">Capital release</p>
            <p className="mt-2 text-sm text-muted-foreground">
              {Math.max(1, Math.round(terms.tranches))} tranche
              {terms.tranches > 1 ? "s" : ""} · {formatCHF(a.firstTranche)} at closing
            </p>
            <ol className="mt-4 space-y-3">
              {terms.milestones
                .slice(0, Math.min(3, Math.max(1, Math.round(terms.tranches))))
                .map((m, i) => (
                  <li key={i} className="flex gap-3 text-sm">
                    <span className="numeric text-xs text-muted-foreground">T{i + 1}</span>
                    <span className="text-foreground">{m || "No milestone defined"}</span>
                  </li>
                ))}
            </ol>
          </section>
        </div>
      </div>

      <div>
        <Button variant="outline" size="lg" onClick={onBack}>
          Back to terms
        </Button>
      </div>
    </div>
  );
}
