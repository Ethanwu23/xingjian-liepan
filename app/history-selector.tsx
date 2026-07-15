"use client";

import { useRouter } from "next/navigation";

type MonthOption = {
  value: string;
  label: string;
  favorite: boolean;
};

export function HistorySelector({ months, selected }: { months: MonthOption[]; selected: string }) {
  const router = useRouter();

  return (
    <label className="history-selector">
      <span>历史报告</span>
      <select
        aria-label="选择 CPI 历史月份"
        value={selected}
        onChange={(event) => router.push(`/?month=${encodeURIComponent(event.target.value)}#report`)}
      >
        {months.map((month) => (
          <option key={month.value} value={month.value}>
            {month.label}{month.favorite ? " ★" : ""}
          </option>
        ))}
      </select>
    </label>
  );
}
