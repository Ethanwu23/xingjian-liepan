import { getHistoricalReports } from "../../../../lib/cpi/report-store";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { reports, storageAvailable } = await getHistoricalReports();
  const month = new URL(request.url).searchParams.get("month");
  if (month) {
    const report = reports.find((item) => item.releaseMonth === month);
    return report
      ? Response.json({ report, storageAvailable })
      : Response.json({ error: "CPI report not found" }, { status: 404 });
  }
  return Response.json({ reports, storageAvailable });
}
