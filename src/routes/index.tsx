import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { InputView } from "@/components/deal/InputView";
import { AnalysisView } from "@/components/deal/AnalysisView";
import { defaultTermSheet, type TermSheet } from "@/lib/deal";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Term Sheet Negotiator — Seed Deal Analysis for Founders" },
      {
        name: "description",
        content:
          "Enter an investor's proposed seed terms and get an instant assessment: post-money valuation, dilution, liquidation waterfall and red flags.",
      },
      { property: "og:title", content: "Term Sheet Negotiator — Seed Deal Analysis for Founders" },
      {
        property: "og:description",
        content:
          "Model post-money valuation, implied equity, dilution and exit waterfall from an investor's seed term sheet.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  const [terms, setTerms] = useState<TermSheet>(defaultTermSheet);
  const [view, setView] = useState<"input" | "analysis">("input");

  const update = <K extends keyof TermSheet>(key: K, value: TermSheet[K]) =>
    setTerms((prev) => ({ ...prev, [key]: value }));

  const postMoney = terms.preMoney + terms.ticketSize;
  const impliedEquity = useMemo(
    () => (postMoney > 0 ? (terms.ticketSize / postMoney) * 100 : 0),
    [postMoney, terms.ticketSize],
  );

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b border-border/70 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[image:var(--gradient-brand)]">
              <span className="numeric text-sm font-bold text-primary-foreground">TS</span>
            </div>
            <div>
              <h1 className="text-base font-semibold tracking-tight">
                Term Sheet <span className="text-gradient-brand">Negotiator</span>
              </h1>
              <p className="text-xs text-muted-foreground">Seed deal assessment for founders</p>
            </div>
          </div>

          <nav className="flex rounded-lg border border-border bg-surface p-1">
            {(["input", "analysis"] as const).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`flex-1 rounded-md px-4 py-1.5 text-xs font-semibold tracking-widest uppercase transition-colors sm:flex-none ${
                  view === v
                    ? "bg-secondary text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {v}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-10">
        {view === "input" ? (
          <InputView
            terms={terms}
            onChange={update}
            onAnalyze={() => setView("analysis")}
            postMoney={postMoney}
            impliedEquity={impliedEquity}
          />
        ) : (
          <AnalysisView terms={terms} onBack={() => setView("input")} />
        )}
      </main>

      <footer className="mx-auto max-w-7xl px-4 pb-10 text-xs text-muted-foreground sm:px-6">
        Indicative analysis only — not legal or investment advice.
      </footer>
    </div>
  );
}
