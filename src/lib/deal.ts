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

export function analyze(t: TermSheet): Analysis {
  const postMoney = t.preMoney + t.ticketSize;
  const impliedInvestorEquity = postMoney > 0 ? (t.ticketSize / postMoney) * 100 : 0;
  const equityDelta = t.investorEquity - impliedInvestorEquity;
  const founderAfter = t.founderOwnership * (1 - impliedInvestorEquity / 100);
  const founderDilution = t.founderOwnership - founderAfter;
  const fundingGap = t.fundingRequirement - t.ticketSize;
  const fundingCoverage =
    t.fundingRequirement > 0 ? (t.ticketSize / t.fundingRequirement) * 100 : 100;
  const tranches = Math.max(1, Math.round(t.tranches));
  const firstTranche = t.ticketSize / tranches;

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

  // Tranches
  if (tranches > 1) {
    push({
      id: "tranches",
      area: "Tranches",
      severity: tranches >= 3 ? "risk" : "watch",
      headline: `${tranches} tranches — only ${formatCHF(firstTranche)} is committed today`,
      detail:
        "Milestone tranches shift execution risk onto the founders while the investor keeps the option to walk. Insist on objective, founder-controllable milestones and full ownership of the equity from closing.",
    });
  } else {
    push({
      id: "tranches",
      area: "Tranches",
      severity: "good",
      headline: "Single tranche — full amount at closing",
      detail: "No milestone risk on the capital.",
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
