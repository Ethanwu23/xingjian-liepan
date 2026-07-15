import test from "node:test";
import assert from "node:assert/strict";
import { annualizedThreeMonth, calculateLatest, percentChange } from "../lib/cpi/calculator.ts";

test("percentChange calculates monthly change", () => {
  assert.ok(Math.abs(percentChange(101, 100) - 1) < 0.000001);
});

test("annualizedThreeMonth annualizes a three-month index move", () => {
  assert.ok(Math.abs(annualizedThreeMonth(101, 100) - 4.060401) < 0.000001);
});

test("calculateLatest returns mom, yoy and 3m annualized metrics", () => {
  const series = Array.from({ length: 13 }, (_, index) => ({
    date: `${2025 + Math.floor(index / 12)}-${String(index % 12 + 1).padStart(2, "0")}`,
    value: 100 + index,
  }));
  const result = calculateLatest(series);
  assert.equal(result.date, "2026-01");
  assert.ok(result.mom > 0);
  assert.ok(Math.abs(result.yoy - 12) < 0.000001);
  assert.ok(result.annualized3m > 0);
});

test("calculateLatest rejects duplicate months", () => {
  const series = Array.from({ length: 13 }, (_, index) => ({
    date: `${2025 + Math.floor(index / 12)}-${String(index % 12 + 1).padStart(2, "0")}`,
    value: 100 + index,
  }));
  series[12].date = series[11].date;
  assert.throws(() => calculateLatest(series), /Duplicate/);
});

test("calculateLatest rejects missing months", () => {
  const series = Array.from({ length: 13 }, (_, index) => ({
    date: `${2025 + Math.floor(index / 12)}-${String(index % 12 + 1).padStart(2, "0")}`,
    value: 100 + index,
  }));
  series[6].date = "2024-12";
  assert.throws(() => calculateLatest(series), /Missing/);
});
