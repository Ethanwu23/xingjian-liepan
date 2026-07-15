import { getChatGPTUser } from "../../../chatgpt-auth";
import { addFavorite, getUserFavorites, removeFavorite } from "../../../../lib/cpi/report-store";

export const dynamic = "force-dynamic";

function validMonth(value: unknown): value is string {
  return typeof value === "string" && /^\d{4}-(0[1-9]|1[0-2])$/.test(value);
}

function isSameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  return !origin || origin === new URL(request.url).origin;
}

export async function GET() {
  const user = await getChatGPTUser();
  if (!user) return Response.json({ error: "Authentication required" }, { status: 401 });
  try {
    const reports = await getUserFavorites(user.email);
    return Response.json({ months: reports.map((report) => report.releaseMonth) });
  } catch {
    return Response.json({ error: "Favorites storage unavailable" }, { status: 503 });
  }
}

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return Response.json({ error: "Cross-site request blocked" }, { status: 403 });
  const user = await getChatGPTUser();
  if (!user) return Response.json({ error: "Authentication required" }, { status: 401 });
  const payload = (await request.json().catch(() => null)) as { month?: unknown } | null;
  if (!validMonth(payload?.month)) {
    return Response.json({ error: "A valid report month is required" }, { status: 400 });
  }
  try {
    await addFavorite(user.email, payload.month);
    return Response.json({ favorite: true }, { status: 201 });
  } catch (error) {
    const status = error instanceof Error && error.message === "CPI report not found" ? 404 : 503;
    const message = status === 404 ? "CPI report not found" : "Favorites storage unavailable";
    return Response.json({ error: message }, { status });
  }
}

export async function DELETE(request: Request) {
  if (!isSameOrigin(request)) return Response.json({ error: "Cross-site request blocked" }, { status: 403 });
  const user = await getChatGPTUser();
  if (!user) return Response.json({ error: "Authentication required" }, { status: 401 });
  const month = new URL(request.url).searchParams.get("month");
  if (!validMonth(month)) {
    return Response.json({ error: "A valid report month is required" }, { status: 400 });
  }
  try {
    await removeFavorite(user.email, month);
    return Response.json({ favorite: false });
  } catch {
    return Response.json({ error: "Favorites storage unavailable" }, { status: 503 });
  }
}
