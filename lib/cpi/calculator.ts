export type Observation = { date: string; value: number };

export function percentChange(current: number, previous: number): number {
  if (!Number.isFinite(current) || !Number.isFinite(previous)) {
    throw new Error("CPI observation must be a finite number");
  }
  if (previous === 0) throw new Error("Previous CPI observation cannot be zero");
  return (current / previous - 1) * 100;
}

export function annualizedThreeMonth(current: number, threeMonthsAgo: number): number {
  if (!Number.isFinite(current) || !Number.isFinite(threeMonthsAgo)) {
    throw new Error("CPI observation must be a finite number");
  }
  if (current <= 0 || threeMonthsAgo <= 0) {
    throw new Error("CPI index values must be positive");
  }
  return ((current / threeMonthsAgo) ** 4 - 1) * 100;
}

export function calculateLatest(series: Observation[]) {
  if (series.length < 13) throw new Error("At least 13 monthly observations are required");
  const sorted = [...series].sort((a, b) => a.date.localeCompare(b.date));
  const dates = new Set(sorted.map((item) => item.date));
  if (dates.size !== sorted.length) throw new Error("Duplicate monthly observation detected");
  for (let index = 1; index < sorted.length; index += 1) {
    const previous = new Date(`${sorted[index - 1].date}-01T00:00:00Z`);
    const expected = new Date(Date.UTC(previous.getUTCFullYear(), previous.getUTCMonth() + 1, 1));
    const expectedLabel = `${expected.getUTCFullYear()}-${String(expected.getUTCMonth() + 1).padStart(2, "0")}`;
    if (sorted[index].date !== expectedLabel) throw new Error("Missing monthly observation detected");
  }

  const latest = sorted.at(-1)!;
  return {
    date: latest.date,
    mom: percentChange(latest.value, sorted.at(-2)!.value),
    yoy: percentChange(latest.value, sorted.at(-13)!.value),
    annualized3m: annualizedThreeMonth(latest.value, sorted.at(-4)!.value),
  };
}
