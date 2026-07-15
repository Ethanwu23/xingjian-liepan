export type JobsMetric = {
  label: string;
  value: number;
  unit: string;
  previous?: number;
  note: string;
  tone: "strong" | "cooling" | "watch" | "balanced";
};

export type JobsSnapshot = {
  reportMonth: string;
  releaseDate: string;
  updatedAt: string;
  employmentSituationUrl: string;
  joltsUrl: string;
  headline: string;
  summary: string;
  metrics: JobsMetric[];
  payrollTrend: Array<{ month: string; value: number; status: "revised" | "preliminary" }>;
  industries: Array<{ name: string; value: number }>;
  unemployment: JobsMetric[];
  wages: JobsMetric[];
  rebalancing: Array<{ label: string; value: number; unit: string; note: string }>;
  signals: Array<{ title: string; evidence: string; implication: string; tone: "cooling" | "watch" | "balanced" }>;
};
