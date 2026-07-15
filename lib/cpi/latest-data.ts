import snapshot from "./data/latest.json";
import history from "./data/history.json";
import type { CpiReport } from "./types";

export type CpiSnapshot = {
  schemaVersion: number;
  source: string;
  sourceUrl: string;
  releaseMonth: string;
  updatedAt: string;
  report: CpiReport;
  series: Record<string, unknown>;
};

export const cpiSnapshot = snapshot as CpiSnapshot;
export const cpiHistory = history as CpiSnapshot[];
export const cpiReport = cpiSnapshot.report;

export const cpiDataMetadata = {
  source: cpiSnapshot.source,
  sourceUrl: cpiSnapshot.sourceUrl,
  releaseMonth: cpiSnapshot.releaseMonth,
  updatedAt: cpiSnapshot.updatedAt,
};
