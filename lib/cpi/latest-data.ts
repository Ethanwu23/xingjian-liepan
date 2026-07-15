import snapshot from "./data/latest.json";
import type { CpiReport } from "./types";

export const cpiReport = snapshot.report as CpiReport;

export const cpiDataMetadata = {
  source: snapshot.source,
  sourceUrl: snapshot.sourceUrl,
  releaseMonth: snapshot.releaseMonth,
  updatedAt: snapshot.updatedAt,
};
