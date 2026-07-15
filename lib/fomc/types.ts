export type RatePathPoint = {
  period: string;
  current: number;
  previous: number;
};

export type DotDistribution = {
  period: string;
  values: Array<{ rate: number; count: number }>;
};

export type LanguageChange = {
  topic: string;
  previous: string;
  current: string;
  interpretation: string;
  tone: "hawkish" | "neutral" | "dovish";
};

export type FomcSnapshot = {
  meetingDate: string;
  meetingLabel: string;
  updatedAt: string;
  statementUrl: string;
  projectionUrl: string;
  previousStatementUrl: string;
  targetRange: { lower: number; upper: number };
  decision: string;
  headline: string;
  summary: string;
  vote: { for: number; against: number };
  ratePath: RatePathPoint[];
  dots: DotDistribution[];
  languageChanges: LanguageChange[];
  macro: Array<{ label: string; value: number; previous: number; unit: string }>;
};
