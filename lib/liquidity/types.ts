export type LiquidityTone = "supportive" | "neutral" | "drain" | "watch";

export type LiquidityMetric = {
  label: string;
  value: number;
  unit: "T" | "B" | "INDEX" | "%";
  change?: number;
  note: string;
  tone: LiquidityTone;
};

export type LiquiditySnapshot = {
  reportDate: string;
  updatedAt: string;
  headline: string;
  summary: string;
  sources: Array<{ label: string; url: string }>;
  metrics: LiquidityMetric[];
  flow: Array<{
    label: string;
    value: number;
    unit: "T" | "B";
    operator: "base" | "subtract" | "result";
    note: string;
  }>;
  balanceSheet: Array<{ label: string; value: number; unit: "T"; share: number; note: string }>;
  treasury: Array<{ label: string; value: number; unit: "B"; change?: number; note: string; tone: LiquidityTone }>;
  riskAppetite: Array<{
    label: string;
    value: number;
    previous: number;
    interpretation: string;
    tone: LiquidityTone;
  }>;
  signals: Array<{
    title: string;
    evidence: string;
    implication: string;
    tone: LiquidityTone;
  }>;
};
