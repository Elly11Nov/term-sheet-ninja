export type LiquidationPreference =
  | "1x-non-participating"
  | "1x-participating"
  | "2x-non-participating"
  | "2x-participating";

export type VetoRights = "none" | "limited" | "broad" | "day-to-day";

export type AntiDilution = "none" | "broad-based" | "full-ratchet" | "other";

export type TermSheet = {
  ticketSize: number;
  fundingRequirement: number;
  preMoney: number;
  investorEquity: number;
  founderOwnership: number;
  liquidationPreference: LiquidationPreference;
  vestingYears: number;
  cliffYears: number;
  investorBoardSeat: boolean;
  investorBoardSeats: number;
  vetoRights: VetoRights;
  antiDilution: AntiDilution;
  tranches: number;
  milestones: string[];
  exitValue: number;
};

export const defaultTermSheet: TermSheet = {
  ticketSize: 1_500_000,
  fundingRequirement: 2_500_000,
  preMoney: 6_000_000,
  investorEquity: 22,
  founderOwnership: 70,
  liquidationPreference: "1x-non-participating",
  vestingYears: 4,
  cliffYears: 1,
  investorBoardSeat: true,
  investorBoardSeats: 1,
  vetoRights: "limited",
  antiDilution: "broad-based",
  tranches: 2,
  milestones: ["Signing / closing", "CHF 500k ARR reached", ""],
  exitValue: 40_000_000,
};

export const LIQ_PREF_OPTIONS: { value: LiquidationPreference; label: string }[] = [
  { value: "1x-non-participating", label: "1x non-participating" },
  { value: "1x-participating", label: "1x participating" },
  { value: "2x-non-participating", label: "2x non-participating" },
  { value: "2x-participating", label: "2x participating" },
];

export const VETO_OPTIONS: { value: VetoRights; label: string }[] = [
  { value: "none", label: "None" },
  { value: "limited", label: "Limited major decisions" },
  { value: "broad", label: "Broad" },
  { value: "day-to-day", label: "Day-to-day operations" },
];

export const ANTI_DILUTION_OPTIONS: { value: AntiDilution; label: string }[] = [
  { value: "none", label: "None" },
  { value: "broad-based", label: "Broad-based weighted average" },
  { value: "full-ratchet", label: "Full ratchet" },
  { value: "other", label: "Other" },
];

export type Flag = {
  id: string;
  area: string;
  severity: "good" | "watch" | "risk";
  headline: string;
  detail: string;
};

export type Analysis = {
  postMoney: number;
  impliedInvestorEquity: number;
  equityDelta: number;
  founderAfter: number;
  founderDilution: number;
  fundingGap: number;
  fundingCoverage: number;
  firstTranche: number;
  prefMultiple: number;
  participating: boolean;
  investorExitProceeds: number;
  founderExitProceeds: number;
  otherExitProceeds: number;
  score: number;
  verdict: string;
  flags: Flag[];
};

export function formatCHF(value: number, compact = false): string {
  if (!isFinite(value)) return "—";
  return new Intl.NumberFormat("de-CH", {
    style: "currency",
    currency: "CHF",
    maximumFractionDigits: 0,
    notation: compact && Math.abs(value) >= 1_000_000 ? "compact" : "standard",
  }).format(value);
}

export function formatPct(value: number, digits = 1): string {
  if (!isFinite(value)) return "—";
  return `${value.toFixed(digits)}%`;
}

export type MilestoneAssessment = {
  severity: "good" | "watch" | "risk";
  worst: string;
  uncontrollable: string[];
  demanding: string[];
};

const OUTSIDE_CONTROL = [
  "econom", "gdp", "bip", "inflation", "interest rate", "market grows", "market growth",
  "stock market", "index", "regulat", "approval by", "authorit", "competitor", "third party",
  "follow-on investor", "another investor", "co-investor", "acquisition offer", "ipo",
  "pandemic", "war", "exchange rate", "currency", "grant awarded", "tender",
];

const DEMANDING = [
  "arr", "mrr", "revenue", "umsatz", "profitab", "break-even", "breakeven", "ebitda",
  "customers", "users", "subscribers", "bookings", "sales of",
];

export function assessMilestones(milestones: string[], count: number): MilestoneAssessment {
  const list = milestones.slice(0, Math.max(0, count)).map((m) => (m ?? "").trim()).filter(Boolean);
  const uncontrollable: string[] = [];
  const demanding: string[] = [];
  for (const m of list) {
    const text = m.toLowerCase();
    if (OUTSIDE_CONTROL.some((k) => text.includes(k))) uncontrollable.push(m);
    else if (DEMANDING.some((k) => text.includes(k))) demanding.push(m);
  }
  const severity = uncontrollable.length ? "risk" : demanding.length ? "watch" : "good";
  return {
    severity,
    worst: uncontrollable[0] ?? demanding[0] ?? list[0] ?? "",
    uncontrollable,
    demanding,
  };
}

export function analyze(t: TermSheet): Analysis {
  const postMoney = t.preMoney + t.ticketSize;
  const impliedInvestorEquity = postMoney > 0 ? (t.ticketSize / postMoney) * 100 : 0;
  const equityDelta = t.investorEquity - impliedInvestorEquity;
  const founderAfter = t.founderOwnership * (1 - impliedInvestorEquity / 100);
  const founderDilution = t.founderOwnership - founderAfter;
  const fundingGap = t.fundingRequirement - t.ticketSize;
  const fundingCoverage =
    t.fundingRequirement > 0 ? (t.ticketSize / t.fundingRequirement) * 100 : 100;
  const tranches = Math.max(0, Math.round(t.tranches));
  const firstTranche = tranches > 0 ? t.ticketSize / tranches : t.ticketSize;


  const prefMultiple = t.liquidationPreference.startsWith("2x") ? 2 : 1;
  const participating = t.liquidationPreference.endsWith("participating") &&
    !t.liquidationPreference.includes("non-participating");

  // Exit waterfall
  const exit = Math.max(0, t.exitValue);
  const investorPct = t.investorEquity / 100;
  const prefAmount = Math.min(exit, prefMultiple * t.ticketSize);
  let investorExitProceeds: number;
  if (participating) {
    investorExitProceeds = prefAmount + (exit - prefAmount) * investorPct;
  } else {
    investorExitProceeds = Math.max(prefAmount, exit * investorPct);
  }
  const remaining = Math.max(0, exit - investorExitProceeds);
  const nonInvestorPct = Math.max(0.0001, 1 - investorPct);
  const founderExitProceeds = remaining * ((t.founderOwnership / 100) / nonInvestorPct);
  const otherExitProceeds = Math.max(0, remaining - founderExitProceeds);

  const flags: Flag[] = [];
  const push = (f: Flag) => flags.push(f);

  // Valuation / equity consistency
  if (Math.abs(equityDelta) < 0.5) {
    push({
      id: "equity",
      area: "Ownership",
      severity: "good",
      headline: "Proposed equity matches the maths",
      detail: `Ticket / post-money implies ${formatPct(impliedInvestorEquity)}, which is in line with the ${formatPct(t.investorEquity)} requested.`,
    });
  } else if (equityDelta > 0) {
    push({
      id: "equity",
      area: "Ownership",
      severity: equityDelta > 3 ? "risk" : "watch",
      headline: `Investor asks ${formatPct(equityDelta)} more than the valuation implies`,
      detail: `At ${formatCHF(t.preMoney)} pre-money the ticket buys ${formatPct(impliedInvestorEquity)}. The extra points are effectively a hidden valuation discount — push back or raise the pre-money.`,
    });
  } else {
    push({
      id: "equity",
      area: "Ownership",
      severity: "good",
      headline: "Requested equity is below the implied stake",
      detail: `The maths supports ${formatPct(impliedInvestorEquity)} but only ${formatPct(t.investorEquity)} is requested.`,
    });
  }

  if (founderAfter < 50) {
    push({
      id: "founder",
      area: "Ownership",
      severity: founderAfter < 40 ? "risk" : "watch",
      headline: `Founders drop to ${formatPct(founderAfter)} post-round`,
      detail:
        "Below 50% at seed leaves little room for a Series A and an option pool. Investors in later rounds view this as a motivation risk.",
    });
  } else {
    push({
      id: "founder",
      area: "Ownership",
      severity: "good",
      headline: `Founders retain ${formatPct(founderAfter)}`,
      detail: "Healthy founder majority going into the next round.",
    });
  }

  // Funding gap
  if (fundingGap > 0) {
    push({
      id: "gap",
      area: "Investment",
      severity: fundingCoverage < 60 ? "risk" : "watch",
      headline: `Funding gap of ${formatCHF(fundingGap)}`,
      detail: `The ticket covers ${formatPct(fundingCoverage, 0)} of the stated requirement. Line up co-investors before signing, or shorten the plan to fit the runway this round actually buys.`,
    });
  } else {
    push({
      id: "gap",
      area: "Investment",
      severity: "good",
      headline: "Round fully covers the funding requirement",
      detail: `Ticket exceeds the requirement by ${formatCHF(-fundingGap)}.`,
    });
  }

  // Liquidation preference
  if (prefMultiple === 1 && !participating) {
    push({
      id: "liqpref",
      area: "Liquidation preference",
      severity: "good",
      headline: "1x non-participating is market standard",
      detail: "Investor takes the greater of their money back or their pro-rata share — no double dip.",
    });
  } else {
    push({
      id: "liqpref",
      area: "Liquidation preference",
      severity: prefMultiple === 2 && participating ? "risk" : "watch",
      headline: `${prefMultiple}x ${participating ? "participating" : "non-participating"} is off-market for seed`,
      detail: `In an exit the investor first takes ${formatCHF(prefMultiple * t.ticketSize)}${participating ? " and then still shares pro-rata in the rest" : ""}. This transfers value away from founders in every scenario below a strong exit.`,
    });
  }

  // Vesting
  if (t.vestingYears < 3) {
    push({
      id: "vesting",
      area: "Vesting",
      severity: "watch",
      headline: `Short ${t.vestingYears}-year vesting`,
      detail: "Later investors usually want 4 years; expect to re-vest at Series A.",
    });
  } else if (t.vestingYears > 4 || t.cliffYears > 1) {
    push({
      id: "vesting",
      area: "Vesting",
      severity: "watch",
      headline: `${t.vestingYears}-year vesting with a ${t.cliffYears}-year cliff`,
      detail: "Longer than the 4-year / 1-year cliff standard. Ask for credit for time already served.",
    });
  } else {
    push({
      id: "vesting",
      area: "Vesting",
      severity: "good",
      headline: `${t.vestingYears} years with a ${t.cliffYears}-year cliff`,
      detail: "Standard founder vesting. Make sure acceleration on change of control is addressed.",
    });
  }

  // Board & control
  const seats = t.investorBoardSeat ? Math.max(1, Math.round(t.investorBoardSeats)) : 0;
  if (seats >= 2) {
    push({
      id: "board",
      area: "Board & control",
      severity: "risk",
      headline: `${seats} investor board seats at seed`,
      detail: "Multiple seats for a single seed investor is unusual and can hand them effective board control. One seat plus an observer is the norm.",
    });
  } else if (seats === 1) {
    push({
      id: "board",
      area: "Board & control",
      severity: "good",
      headline: "One investor board seat",
      detail: "Standard for a lead seed investor. Keep the founder majority on the board.",
    });
  } else {
    push({
      id: "board",
      area: "Board & control",
      severity: "good",
      headline: "No investor board seat",
      detail: "Founders keep full board control; consider offering observer rights instead.",
    });
  }

  const vetoSeverity: Record<VetoRights, "good" | "watch" | "risk"> = {
    none: "good",
    limited: "good",
    broad: "risk",
    "day-to-day": "risk",
  };
  const vetoDetail: Record<VetoRights, string> = {
    none: "No investor veto rights — unusually founder-friendly.",
    limited:
      "Protective provisions limited to major decisions (new shares, sale, debt, changes to share rights) — market standard.",
    broad:
      "Broad veto rights let the investor block ordinary strategic moves such as hiring, budget, or pivots. Negotiate a closed list of reserved matters.",
    "day-to-day":
      "Veto over day-to-day operations is a red flag: it effectively makes the investor a shadow CEO and will scare off Series A leads.",
  };
  push({
    id: "veto",
    area: "Board & control",
    severity: vetoSeverity[t.vetoRights],
    headline: `Veto rights: ${VETO_OPTIONS.find((o) => o.value === t.vetoRights)!.label}`,
    detail: vetoDetail[t.vetoRights],
  });

  // Anti-dilution
  const adSeverity: Record<AntiDilution, "good" | "watch" | "risk"> = {
    none: "good",
    "broad-based": "good",
    "full-ratchet": "risk",
    other: "watch",
  };
  const adDetail: Record<AntiDilution, string> = {
    none: "No anti-dilution protection — founder friendly.",
    "broad-based":
      "Broad-based weighted average is the market standard and shares the pain of a down round fairly.",
    "full-ratchet":
      "Full ratchet re-prices the investor's entire stake to the lowest future price. A single small down round can wipe out a large share of founder equity.",
    other: "Non-standard anti-dilution wording — have counsel model the down-round outcome explicitly.",
  };
  push({
    id: "antidilution",
    area: "Anti-dilution",
    severity: adSeverity[t.antiDilution],
    headline: `Anti-dilution: ${ANTI_DILUTION_OPTIONS.find((o) => o.value === t.antiDilution)!.label}`,
    detail: adDetail[t.antiDilution],
  });

  // Tranches — the count alone is not a red flag; the milestones decide.
  const ms = assessMilestones(t.milestones, tranches);
  if (t.tranches <= 0) {
    push({
      id: "tranches",
      area: "Tranches",
      severity: "good",
      headline: "No tranches — full amount at closing",
      detail: "No milestone risk on the capital.",
    });
  } else if (ms.severity === "risk") {
    push({
      id: "tranches",
      area: "Tranches",
      severity: "risk",
      headline: `Milestone outside founder control: “${ms.worst}”`,
      detail:
        "A tranche may only depend on milestones the founders can actually influence. Market, macro-economic or third-party conditions must be removed or replaced by objective, founder-controllable targets, with full equity from closing.",
    });
  } else if (ms.severity === "watch" || tranches > 3) {
    push({
      id: "tranches",
      area: "Tranches",
      severity: "watch",
      headline:
        tranches > 3
          ? `${tranches} tranches — more than the customary maximum of three`
          : `Milestone looks demanding: “${ms.worst}”`,
      detail:
        tranches > 3
          ? `Only ${formatCHF(firstTranche)} is committed today. Consolidate into at most three tranches with realistic, founder-controllable milestones.`
          : "The milestone may be ambitious for the timeframe. Stress-test the plan and, if in doubt, soften the target or extend the deadline before signing.",
    });
  } else {
    push({
      id: "tranches",
      area: "Tranches",
      severity: "good",
      headline: `${tranches} tranche${tranches > 1 ? "s" : ""} with founder-controllable milestones`,
      detail:
        "Up to three tranches are acceptable as long as the milestones stay realistic and within the founders' control.",
    });
  }


  const weights: Record<"good" | "watch" | "risk", number> = { good: 0, watch: 1, risk: 1 };
  const riskPoints = flags.reduce(
    (sum, f) => sum + (f.severity === "risk" ? 2 : f.severity === "watch" ? 1 : 0),
    0,
  );
  void weights;
  const maxPoints = flags.length * 2;
  const score = Math.max(0, Math.round(100 - (riskPoints / maxPoints) * 100));

  const verdict =
    score >= 80
      ? "Founder-friendly — close to market standard"
      : score >= 60
        ? "Workable with targeted push-back"
        : score >= 40
          ? "Aggressive — renegotiate key terms"
          : "Investor-heavy — do not sign as drafted";

  return {
    postMoney,
    impliedInvestorEquity,
    equityDelta,
    founderAfter,
    founderDilution,
    fundingGap,
    fundingCoverage,
    firstTranche,
    prefMultiple,
    participating,
    investorExitProceeds,
    founderExitProceeds,
    otherExitProceeds,
    score,
    verdict,
    flags,
  };
}

// ---------------------------------------------------------------------------
// Status model, term-by-term assessment, counteroffer and exit calculator
// ---------------------------------------------------------------------------

export type Status = "fair" | "negotiate" | "unfavourable" | "high-risk";

export const STATUS_META: Record<Status, { label: string; icon: string }> = {
  fair: { label: "Fair / acceptable", icon: "🟢" },
  negotiate: { label: "Negotiate", icon: "🟡" },
  unfavourable: { label: "Unfavourable", icon: "🔴" },
  "high-risk": { label: "High risk", icon: "🚨" },
};

export type TermRow = {
  id: string;
  term: string;
  offer: string;
  benchmark: string;
  status: Status;
  why: string;
  recommended: string;
};

export function overallStatus(score: number): Status {
  if (score >= 80) return "fair";
  if (score >= 60) return "negotiate";
  if (score >= 40) return "unfavourable";
  return "high-risk";
}

export function isRedFlag(s: Status): boolean {
  return s === "unfavourable" || s === "high-risk";
}

function liqPrefLabel(t: TermSheet): string {
  return LIQ_PREF_OPTIONS.find((o) => o.value === t.liquidationPreference)!.label;
}

/** Nine-term assessment derived from the same rules used by `analyze`. */
export function termRows(t: TermSheet, a: Analysis): TermRow[] {
  const tranches = Math.max(0, Math.round(t.tranches));
  const rows: TermRow[] = [];


  // 1. Ticket size
  rows.push({
    id: "ticket",
    term: "Ticket size",
    offer: formatCHF(t.ticketSize),
    benchmark: `Covers the funding requirement of ${formatCHF(t.fundingRequirement)}`,
    status:
      a.fundingGap <= 0 ? "fair" : a.fundingCoverage < 60 ? "unfavourable" : "negotiate",
    why:
      a.fundingGap > 0
        ? `Ticket covers only ${formatPct(a.fundingCoverage, 0)} of the plan — a ${formatCHF(a.fundingGap)} gap remains.`
        : "The ticket fully funds the stated requirement.",
    recommended:
      a.fundingGap > 0
        ? `Raise the ticket to ${formatCHF(t.fundingRequirement)} or add a co-investor for ${formatCHF(a.fundingGap)}.`
        : "Accept as proposed.",
  });

  // 2. Pre-money valuation
  const preLow = 3_000_000;
  const preHigh = 6_000_000;
  const preStatus: Status =
    t.preMoney >= preLow ? "fair" : t.preMoney >= preLow * 0.75 ? "negotiate" : "unfavourable";
  rows.push({
    id: "premoney",
    term: "Pre-money valuation",
    offer: formatCHF(t.preMoney),
    benchmark: "CHF 3m – 6m (seed fair zone)",
    status: preStatus,
    why:
      preStatus === "fair"
        ? "Inside the seed fair zone, so the price of the round is defensible."
        : `Below the fair zone — every franc of the ticket costs more equity than it should.`,
    recommended:
      preStatus === "fair"
        ? "Hold the proposed valuation."
        : `Counter at ${formatCHF(preLow)}–${formatCHF(preHigh)} pre-money.`,
  });

  // 3. Post-money valuation
  rows.push({
    id: "postmoney",
    term: "Post-money valuation",
    offer: formatCHF(a.postMoney),
    benchmark: "Pre-money + ticket size",
    status: preStatus === "fair" ? "fair" : "negotiate",
    why: `${formatCHF(t.preMoney)} pre-money plus a ${formatCHF(t.ticketSize)} ticket sets the price for every share issued in this round.`,
    recommended: `A ${formatCHF(preLow)} pre-money floor puts post-money at ${formatCHF(preLow + t.ticketSize)} or better.`,
  });

  // 4. Investor equity
  const eqStatus: Status =
    t.investorEquity > 30
      ? "high-risk"
      : t.investorEquity > 25
        ? "unfavourable"
        : t.investorEquity > 22
          ? "negotiate"
          : "fair";
  rows.push({
    id: "equity",
    term: "Investor equity",
    offer: formatPct(t.investorEquity),
    benchmark: "15% – 22% at seed",
    status: eqStatus,
    why:
      eqStatus === "fair"
        ? `Inside the fair zone; the valuation implies ${formatPct(a.impliedInvestorEquity)}.`
        : `Above the seed norm of 15–22%${a.equityDelta > 0.5 ? `, and ${formatPct(a.equityDelta)} more than the ${formatPct(a.impliedInvestorEquity)} the valuation implies` : ""}. Founders fall to ${formatPct(a.founderAfter)}.`,
    recommended:
      eqStatus === "fair"
        ? "Accept as proposed."
        : `Counter at 20% — that is ${formatPct(t.investorEquity - 20)} of the cap table back to founders.`,
  });

  // 5. Liquidation preference
  const liqStatus: Status =
    a.prefMultiple >= 2 && a.participating
      ? "high-risk"
      : a.participating || a.prefMultiple >= 2
        ? "unfavourable"
        : "fair";
  rows.push({
    id: "liqpref",
    term: "Liquidation preference",
    offer: liqPrefLabel(t),
    benchmark: "1x non-participating",
    status: liqStatus,
    why:
      liqStatus === "fair"
        ? "Investor takes the greater of their money back or their pro-rata share — no double dip."
        : `Investor takes ${formatCHF(a.prefMultiple * t.ticketSize)} off the top${a.participating ? " and then still shares pro-rata in the rest" : ""}, before founders see anything.`,
    recommended: liqStatus === "fair" ? "Accept as proposed." : "1x non-participating.",
  });

  // 6. Vesting
  const vestStatus: Status =
    t.vestingYears > 4 && t.cliffYears > 1
      ? "unfavourable"
      : t.vestingYears > 4 || t.cliffYears > 1 || t.vestingYears < 3
        ? "negotiate"
        : "fair";
  rows.push({
    id: "vesting",
    term: "Vesting",
    offer: `${t.vestingYears} years / ${t.cliffYears}-year cliff`,
    benchmark: "4 years / 1-year cliff",
    status: vestStatus,
    why:
      vestStatus === "fair"
        ? "Standard founder vesting."
        : `Founders stay unvested longer than market${t.cliffYears > 1 ? ` and forfeit everything if they leave inside ${t.cliffYears} years` : ""}.`,
    recommended:
      vestStatus === "fair"
        ? "Accept, but add double-trigger acceleration on a change of control."
        : "4 years with a 1-year cliff, plus credit for time already served.",
  });

  // 7. Board / veto
  const seats = t.investorBoardSeat ? Math.max(1, Math.round(t.investorBoardSeats)) : 0;
  const vetoLabel = VETO_OPTIONS.find((o) => o.value === t.vetoRights)!.label;
  const boardStatus: Status =
    t.vetoRights === "day-to-day"
      ? "high-risk"
      : t.vetoRights === "broad" || seats >= 2
        ? "unfavourable"
        : "fair";
  rows.push({
    id: "board",
    term: "Board seat / veto rights",
    offer: `${seats === 0 ? "No board seat" : `${seats} board seat${seats > 1 ? "s" : ""}`} · veto: ${vetoLabel}`,
    benchmark: "One investor seat · veto limited to major decisions",
    status: boardStatus,
    why:
      boardStatus === "fair"
        ? "Founders keep board control and the investor only blocks major decisions."
        : `${seats >= 2 ? "Multiple seats for one seed investor concede board influence. " : ""}${t.vetoRights === "broad" ? "Broad veto rights let the investor block ordinary strategic moves such as hiring, budget or a pivot." : t.vetoRights === "day-to-day" ? "Veto over day-to-day operations makes the investor a shadow CEO." : ""}`,
    recommended:
      boardStatus === "fair"
        ? "Accept as proposed."
        : "One investor seat and a closed list of reserved matters (new shares, sale, debt, changes to share rights).",
  });

  // 8. Anti-dilution
  const adStatus: Status =
    t.antiDilution === "full-ratchet"
      ? "high-risk"
      : t.antiDilution === "other"
        ? "negotiate"
        : "fair";
  rows.push({
    id: "antidilution",
    term: "Anti-dilution",
    offer: ANTI_DILUTION_OPTIONS.find((o) => o.value === t.antiDilution)!.label,
    benchmark: "Broad-based weighted average",
    status: adStatus,
    why:
      adStatus === "fair"
        ? "Shares the pain of a down round fairly between investor and founders."
        : t.antiDilution === "full-ratchet"
          ? "Full ratchet re-prices the investor's entire stake to the lowest future price — one small down round can wipe out a large share of founder equity."
          : "Non-standard wording; the down-round outcome is unpredictable.",
    recommended: adStatus === "fair" ? "Accept as proposed." : "Broad-based weighted average.",
  });

  // 9. Tranches
  const ms = assessMilestones(t.milestones, tranches);
  const trancheStatus: Status =
    ms.severity === "risk"
      ? "unfavourable"
      : tranches > 3
        ? "negotiate"
        : tranches >= 1 && tranches <= 3
          ? "fair"
          : "fair";
  rows.push({
    id: "tranches",
    term: "Tranches / milestones",
    offer: `${tranches === 0 ? "No tranches" : `${tranches} tranche${tranches > 1 ? "s" : ""} · ${formatCHF(a.firstTranche)} at closing`}`,
    benchmark: "Max 3 with realistic, founder-controllable milestones",
    status: trancheStatus,
    why:
      tranches === 0
        ? "Full amount lands at closing — no milestone risk on the capital."
        : ms.severity === "risk"
          ? `Milestone outside founder control: “${ms.worst}”. This is not a valid release condition. Remove or replace it with an objective, founder-controllable target.`
          : ms.severity === "watch"
            ? `Looks demanding: “${ms.worst}”. Stress-test the timeline and confirm it is realistically achievable.`
            : `Up to 3 tranches are acceptable as long as milestones are realistic and founder-controllable.`,
    recommended:
      trancheStatus === "fair"
        ? "Accept as proposed (if milestones are controllable)."
        : "Maximum 3 tranches, objective founder-controllable milestones, and full equity from closing.",
  });


  return rows;
}

export type CounterRow = { term: string; offer: string; counter: string; effect?: string };

export function counteroffer(t: TermSheet, a: Analysis): CounterRow[] {
  const rows: CounterRow[] = [];
  const targetPre = Math.max(3_000_000, Math.min(6_000_000, t.preMoney));
  const targetEquity = Math.min(22, Math.max(15, t.investorEquity > 22 ? 20 : t.investorEquity));

  rows.push({
    term: "Pre-money valuation",
    offer: formatCHF(t.preMoney),
    counter: t.preMoney < 3_000_000 ? `${formatCHF(3_000_000)} – ${formatCHF(6_000_000)}` : formatCHF(targetPre),
    effect:
      t.preMoney < 3_000_000
        ? `At ${formatCHF(3_000_000)} pre-money the same ticket buys ${formatPct((t.ticketSize / (3_000_000 + t.ticketSize)) * 100)} instead of ${formatPct(a.impliedInvestorEquity)}.`
        : "Inside the fair zone.",
  });
  rows.push({
    term: "Investor equity",
    offer: formatPct(t.investorEquity),
    counter: `${formatPct(targetEquity, 0)} (fair zone 15–22%)`,
    effect:
      t.investorEquity > targetEquity
        ? `Returns ${formatPct(t.investorEquity - targetEquity)} of the cap table to founders — worth ${formatCHF(((t.investorEquity - targetEquity) / 100) * Math.max(0, t.exitValue))} at the modelled exit.`
        : "Already within the fair zone.",
  });
  rows.push({
    term: "Liquidation preference",
    offer: liqPrefLabel(t),
    counter: "1x non-participating",
    effect:
      a.prefMultiple > 1 || a.participating
        ? `Frees up ${formatCHF(Math.max(0, a.investorExitProceeds - Math.max(t.ticketSize, Math.max(0, t.exitValue) * (t.investorEquity / 100))))} of exit proceeds for the common shareholders.`
        : "Already market standard.",
  });
  rows.push({
    term: "Vesting",
    offer: `${t.vestingYears} years / ${t.cliffYears}-year cliff`,
    counter: "4 years / 1-year cliff",
    effect:
      t.vestingYears > 4 || t.cliffYears > 1
        ? `Founders fully vest ${Math.max(0, t.vestingYears - 4)} year(s) earlier and de-risk the cliff.`
        : "Already market standard.",
  });
  rows.push({
    term: "Board",
    offer: t.investorBoardSeat
      ? `${Math.max(1, Math.round(t.investorBoardSeats))} investor seat(s)`
      : "No investor seat",
    counter: "One investor seat",
    effect:
      t.investorBoardSeat && Math.round(t.investorBoardSeats) > 1
        ? "Keeps the founder majority on the board."
        : "Already market standard.",
  });
  rows.push({
    term: "Veto rights",
    offer: VETO_OPTIONS.find((o) => o.value === t.vetoRights)!.label,
    counter: "Limited to major decisions",
    effect:
      t.vetoRights === "broad" || t.vetoRights === "day-to-day"
        ? "Restores founder control over hiring, budget and strategy."
        : "Already market standard.",
  });
  rows.push({
    term: "Anti-dilution",
    offer: ANTI_DILUTION_OPTIONS.find((o) => o.value === t.antiDilution)!.label,
    counter: "Broad-based weighted average",
    effect:
      t.antiDilution === "full-ratchet"
        ? "Caps founder dilution in a down round instead of re-pricing the whole investor stake."
        : "Already market standard.",
  });
  const tranches = Math.max(0, Math.round(t.tranches));
  const ms = assessMilestones(t.milestones, tranches);
  rows.push({
    term: "Tranches",
    offer: `${tranches === 0 ? "No tranches" : `${tranches} tranche${tranches > 1 ? "s" : ""}`}`,
    counter:
      ms.severity === "risk"
        ? "Remove macro/3rd-party milestones; max 3 founder-controllable milestones"
        : tranches > 3
          ? "Maximum 3 realistic, founder-controllable milestones"
          : "Up to 3 realistic, founder-controllable milestones",
    effect:
      ms.severity === "risk"
        ? "Removes release conditions founders cannot satisfy."
        : tranches > 3
          ? `Moves ${formatCHF(t.ticketSize / 3 - a.firstTranche)} of capital forward to closing.`
          : "Acceptable if the milestones are founder-controllable.",
  });


  return rows;
}

export type ExitBreakdown = {
  exitValue: number;
  investment: number;
  investorEquityPct: number;
  prefLabel: string;
  prefEntitlement: number;
  prefPayment: number;
  remaining: number;
  participationPayment: number;
  investorTotal: number;
  commonTotal: number;
  founderShare: number;
  otherShare: number;
  investorPctOfExit: number;
  commonPctOfExit: number;
  tookPreference: boolean;
};

export function exitBreakdown(t: TermSheet, a: Analysis): ExitBreakdown | null {
  const exit = Math.max(0, t.exitValue);
  if (!exit) return null;

  const investorPct = t.investorEquity / 100;
  const prefEntitlement = a.prefMultiple * t.ticketSize;
  let prefPayment: number;
  let participationPayment: number;
  let tookPreference: boolean;

  if (a.participating) {
    prefPayment = Math.min(exit, prefEntitlement);
    participationPayment = Math.max(0, exit - prefPayment) * investorPct;
    tookPreference = true;
  } else {
    const asConverted = exit * investorPct;
    tookPreference = Math.min(exit, prefEntitlement) >= asConverted;
    prefPayment = tookPreference ? Math.min(exit, prefEntitlement) : 0;
    participationPayment = tookPreference ? 0 : asConverted;
  }

  const investorTotal = Math.min(exit, prefPayment + participationPayment);
  const commonTotal = Math.max(0, exit - investorTotal);
  const nonInvestorPct = Math.max(0.0001, 1 - investorPct);
  const founderShare = commonTotal * ((t.founderOwnership / 100) / nonInvestorPct);

  return {
    exitValue: exit,
    investment: t.ticketSize,
    investorEquityPct: t.investorEquity,
    prefLabel: liqPrefLabel(t),
    prefEntitlement,
    prefPayment,
    remaining: Math.max(0, exit - prefPayment),
    participationPayment,
    investorTotal,
    commonTotal,
    founderShare: Math.min(commonTotal, founderShare),
    otherShare: Math.max(0, commonTotal - Math.min(commonTotal, founderShare)),
    investorPctOfExit: (investorTotal / exit) * 100,
    commonPctOfExit: (commonTotal / exit) * 100,
    tookPreference,
  };
}
