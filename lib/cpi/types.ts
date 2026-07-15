export type Metric = {
  label: string;
  value: number;
  note: string;
};

export type ComponentMetric = {
  name: string;
  mom: number;
  yoy?: number;
  annualized3m?: number;
};

export type CpiReport = {
  releaseMonth: string;
  headline: string;
  summary: string;
  confidence: number;
  metrics: Metric[];
  components: ComponentMetric[];
  signals: Array<{ title: string; evidence: string; level: "cooling" | "watch"; tag: string }>;
  focus: Array<{ name: string; value: number; meaning: string }>;
  assets: Array<{ name: string; bias: string; reason: string }>;
};
