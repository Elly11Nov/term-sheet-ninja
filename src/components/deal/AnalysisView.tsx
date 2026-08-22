import { Button } from "@/components/ui/button";
import {
  analyze,
  counteroffer,
  exitBreakdown,
  formatCHF,
  formatPct,
  isRedFlag,
  overallStatus,
  STATUS_META,
  termRows,
  type Analysis,
  type Status,
  type TermSheet,
} from "@/lib/deal";

const statusStyles: Record<Status, { chip: string; bar: string; text: string }> = {
  fair: {
    chip: "bg-success/10 text-success border-success/30",
    bar: "bg-success",
    text: "text-success",
  },
  negotiate: {
    chip: "bg-warning/15 text-warning-foreground border-warning/40",
    bar: "bg-warning",
    text: "text-warning-foreground",
  },
  unfavourable: {
    chip: "bg-destructive/10 text-destructive border-destructive/30",
    bar: "bg-destructive",
    text: "text-destructive",
  },
  "high-risk": {
    chip: "bg-destructive text-destructive-foreground border-destructive",
    bar: "bg-destructive",
    text: "text-destructive",
  },
};

function StatusChip({ status }: { status: Status }) {
  const meta = STATUS_META[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold tracking-wide uppercase ${statusStyles[status].chip}`}
    >
      <span aria-hidden>{meta.icon}</span>
      {meta.label}
    </span>
  );
}

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
    warning: "text-warning-foreground",
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

export function AnalysisView({ terms, onBack }: { terms: TermSheet; onBack: () => void }) {
  const a: Analysis = analyze(terms);
  const rows = termRows(terms, a);
  const status = overallStatus(a.score);
  const redFlags = rows.filter((r) => isRedFlag(r.status));
  const counters = counteroffer(terms, a);
  const exit = exitBreakdown(terms, a);

  return (
    <div className="grid gap-8">
      {/* A. Overall assessment */}
      <section className="panel flex flex-col gap-6 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
        <div>
          <p className="label-caps">Overall deal assessment</p>
          <div className="mt-3">
            <StatusChip status={status} />
          </div>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">{a.verdict}</h2>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            {redFlags.length > 0
              ? `${redFlags.length} term${redFlags.length === 1 ? "" : "s"} (${redFlags
                  .map((r) => r.term.toLowerCase())
                  .join(", ")}) fall outside the seed fair zone and need to be renegotiated before signing.`
              : "Every reviewed term sits inside the seed fair zone, so the offer can be accepted broadly as drafted."}
          </p>
        </div>
        <div className="shrink-0 text-left sm:text-right">
          <p className="label-caps">Deal score</p>
          <p className={`numeric text-6xl font-semibold ${statusStyles[status].text}`}>
            {a.score}
            <span className="text-2xl text-muted-foreground"> / 100</span>
          </p>
        </div>
      </section>

      {/* Key numbers */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric
          label="Post-money valuation"
          value={formatCHF(a.postMoney)}
          sub={`Pre-money ${formatCHF(terms.preMoney, true)} + ticket ${formatCHF(terms.ticketSize, true)}`}
        />
        <Metric
          label="Implied investor equity"
          value={formatPct(a.impliedInvestorEquity)}
          tone="primary"
          sub={`Term sheet states ${formatPct(terms.investorEquity)} (${a.equityDelta >= 0 ? "+" : ""}${a.equityDelta.toFixed(1)} pts)`}
        />
        <Metric
          label="Founder ownership after"
          value={formatPct(a.founderAfter)}
          tone={a.founderAfter < 50 ? "destructive" : "success"}
          sub={`Diluted by ${formatPct(a.founderDilution)} from ${formatPct(terms.founderOwnership)}`}
        />
        <Metric
          label="Funding gap"
          value={formatCHF(a.fundingGap)}
          tone={a.fundingGap > 0 ? "destructive" : "success"}
          sub={`Ticket covers ${formatPct(a.fundingCoverage, 0)} of the requirement`}
        />
      </div>

      {/* B. Immediate negotiation */}
      <section>
        <h2 className="text-lg font-semibold tracking-tight">Terms requiring immediate negotiation</h2>
        {redFlags.length === 0 ? (
          <div className="panel mt-4 border-success/40 p-6 text-sm">
            🟢 No immediate red flags. The proposed terms are broadly within the fair zone.
          </div>
        ) : (
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            {redFlags.map((r) => (
              <article key={r.id} className="panel border-destructive/30 p-5">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-base font-semibold">
                    <span aria-hidden className="mr-1.5">
                      {STATUS_META[r.status].icon}
                    </span>
                    {r.term}
                  </h3>
                  <StatusChip status={r.status} />
                </div>
                <dl className="mt-4 space-y-2.5 text-sm">
                  <div>
                    <dt className="label-caps">Investor offer</dt>
                    <dd className="font-medium text-foreground">{r.offer}</dd>
                  </div>
                  <div>
                    <dt className="label-caps">Problem</dt>
                    <dd className="text-muted-foreground">{r.why}</dd>
                  </div>
                  <div>
                    <dt className="label-caps">Recommended</dt>
                    <dd className="font-medium text-primary">{r.recommended}</dd>
                  </div>
                </dl>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* C. Term-by-term */}
      <section>
        <h2 className="text-lg font-semibold tracking-tight">Term-by-term assessment</h2>
        <div className="panel mt-4 overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead>
              <tr className="border-b border-border">
                {["Term", "Investor offer", "Benchmark", "Status", "Why it matters", "Recommended position"].map(
                  (h) => (
                    <th key={h} className="label-caps px-4 py-3 align-bottom">
                      {h}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-b border-border/70 last:border-0 align-top">
                  <td className="px-4 py-4 font-semibold">{r.term}</td>
                  <td className="px-4 py-4">{r.offer}</td>
                  <td className="px-4 py-4 text-muted-foreground">{r.benchmark}</td>
                  <td className="px-4 py-4">
                    <StatusChip status={r.status} />
                  </td>
                  <td className="max-w-[22rem] px-4 py-4 text-muted-foreground">{r.why}</td>
                  <td className="max-w-[18rem] px-4 py-4 font-medium text-primary">{r.recommended}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* 2. Counteroffer */}
      <section>
        <h2 className="text-lg font-semibold tracking-tight">Recommended counteroffer</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Built from the values entered, against the seed fair zone.
        </p>
        <div className="panel mt-4 overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="label-caps px-4 py-3">Term</th>
                <th className="label-caps px-4 py-3">Investor's offer</th>
                <th className="label-caps px-4 py-3">Our counteroffer</th>
                <th className="label-caps px-4 py-3">Economic effect</th>
              </tr>
            </thead>
            <tbody>
              {counters.map((c) => (
                <tr key={c.term} className="border-b border-border/70 last:border-0 align-top">
                  <td className="px-4 py-3.5 font-semibold">{c.term}</td>
                  <td className="px-4 py-3.5">{c.offer}</td>
                  <td className="px-4 py-3.5 font-medium text-primary">{c.counter}</td>
                  <td className="max-w-[24rem] px-4 py-3.5 text-muted-foreground">{c.effect}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* 3. Exit scenario */}
      {exit ? (
        <section>
          <h2 className="text-lg font-semibold tracking-tight">Exit scenario</h2>
          <div className="panel mt-4 p-6 sm:p-8">
            <div className="grid gap-4 sm:grid-cols-4">
              {[
                { l: "Company exit value", v: formatCHF(exit.exitValue) },
                { l: "Investor investment", v: formatCHF(exit.investment) },
                { l: "Investor equity", v: formatPct(exit.investorEquityPct) },
                { l: "Liquidation preference", v: exit.prefLabel },
              ].map((m) => (
                <div key={m.l} className="rounded-lg border border-border bg-surface-2 p-4">
                  <p className="label-caps">{m.l}</p>
                  <p className="numeric mt-1.5 text-lg font-semibold">{m.v}</p>
                </div>
              ))}
            </div>

            <div className="mt-8">
              <div className="flex items-baseline justify-between">
                <p className="label-caps">Total exit value</p>
                <p className="numeric text-xl font-semibold">{formatCHF(exit.exitValue)}</p>
              </div>
              <div className="mt-3 flex h-12 w-full overflow-hidden rounded-lg border border-border">
                <div
                  className="flex items-center justify-center bg-accent text-xs font-semibold text-accent-foreground"
                  style={{ width: `${Math.max(4, exit.investorPctOfExit)}%` }}
                >
                  {formatPct(exit.investorPctOfExit, 0)}
                </div>
                <div
                  className="flex items-center justify-center bg-primary text-xs font-semibold text-primary-foreground"
                  style={{ width: `${Math.max(4, exit.commonPctOfExit)}%` }}
                >
                  {formatPct(exit.commonPctOfExit, 0)}
                </div>
              </div>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <div className="rounded-lg border border-border p-4">
                  <p className="label-caps">→ Investor</p>
                  <p className="numeric mt-1 text-2xl font-semibold text-accent">
                    {formatCHF(exit.investorTotal)}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {formatPct(exit.investorPctOfExit)} of exit proceeds on a{" "}
                    {formatCHF(exit.investment)} investment
                  </p>
                </div>
                <div className="rounded-lg border border-border p-4">
                  <p className="label-caps">→ Founders</p>
                  <p className="numeric mt-1 text-2xl font-semibold text-primary">
                    {formatCHF(exit.commonTotal)}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {formatPct(exit.commonPctOfExit)} of exit proceeds · founders' own share{" "}
                    {formatCHF(exit.founderShare)}, other shareholders {formatCHF(exit.otherShare)}
                  </p>
                </div>
              </div>
            </div>

            <ol className="mt-8 space-y-3 text-sm">
              {[
                {
                  l: "1. Investor preference payment",
                  v: formatCHF(exit.prefPayment),
                  n: exit.tookPreference
                    ? `${a.prefMultiple}x of ${formatCHF(exit.investment)} paid before common shareholders`
                    : "Non-participating: converting to equity pays more, so the preference is waived",
                },
                {
                  l: "2. Remaining proceeds",
                  v: formatCHF(exit.remaining),
                  n: "Exit value less the preference payment",
                },
                {
                  l: `3. Investor's ${formatPct(exit.investorEquityPct)} equity participation`,
                  v: formatCHF(exit.participationPayment),
                  n: a.participating
                    ? "Participating: investor also shares pro-rata in the remainder"
                    : exit.tookPreference
                      ? "Non-participating: no additional participation once the preference is taken"
                      : "Investor converts and takes its pro-rata share instead of the preference",
                },
                {
                  l: "4. Total investor proceeds",
                  v: formatCHF(exit.investorTotal),
                  n: `${(exit.investorTotal / Math.max(1, exit.investment)).toFixed(2)}x return on invested capital`,
                },
                {
                  l: "5. Founder proceeds",
                  v: formatCHF(exit.commonTotal),
                  n: "Everything left for the common shareholders",
                },
              ].map((s) => (
                <li
                  key={s.l}
                  className="flex flex-wrap items-baseline justify-between gap-2 border-b border-border/70 pb-3 last:border-0"
                >
                  <span className="font-medium">{s.l}</span>
                  <span className="numeric text-base font-semibold">{s.v}</span>
                  <span className="w-full text-xs text-muted-foreground">{s.n}</span>
                </li>
              ))}
            </ol>
          </div>
        </section>
      ) : (
        <section className="panel p-6 text-sm text-muted-foreground">
          Add an expected exit value on the input screen to model the liquidation waterfall.
        </section>
      )}

      <div>
        <Button variant="outline" size="lg" onClick={onBack}>
          ← Edit offer
        </Button>
      </div>
    </div>
  );
}
