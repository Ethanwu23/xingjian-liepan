import { getD1 } from "../../db";
import { cpiHistory, type CpiSnapshot } from "./latest-data";

type HistoryResult = {
  reports: CpiSnapshot[];
  storageAvailable: boolean;
};

export type DatabaseDashboard = {
  reports: Array<{
    month: string;
    title: string;
    source: string;
    updatedAt: string;
    createdAt: string;
  }>;
  favorites: Array<{
    month: string;
    title: string;
    createdAt: string;
  }>;
  totalFavorites: number;
};

let initialized = false;

async function ensureStorage(db: D1Database) {
  if (initialized) return;
  await db.batch([
    db.prepare(`CREATE TABLE IF NOT EXISTS cpi_reports (
      month TEXT PRIMARY KEY NOT NULL,
      report_json TEXT NOT NULL,
      source TEXT NOT NULL,
      source_url TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`),
    db.prepare(`CREATE TABLE IF NOT EXISTS user_favorites (
      id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
      user_email TEXT NOT NULL,
      report_month TEXT NOT NULL REFERENCES cpi_reports(month) ON DELETE CASCADE,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`),
    db.prepare(
      "CREATE UNIQUE INDEX IF NOT EXISTS user_favorites_user_month_idx ON user_favorites (user_email, report_month)",
    ),
  ]);
  initialized = true;
}

async function syncBundledReports(db: D1Database) {
  await ensureStorage(db);
  const statements = cpiHistory.map((snapshot) =>
    db
      .prepare(`INSERT INTO cpi_reports (month, report_json, source, source_url, updated_at)
        VALUES (?, ?, ?, ?, ?)
        ON CONFLICT(month) DO UPDATE SET
          report_json = excluded.report_json,
          source = excluded.source,
          source_url = excluded.source_url,
          updated_at = excluded.updated_at`)
      .bind(
        snapshot.releaseMonth,
        JSON.stringify(snapshot),
        snapshot.source,
        snapshot.sourceUrl,
        snapshot.updatedAt,
      ),
  );
  if (statements.length) await db.batch(statements);
}

function parseSnapshot(value: unknown): CpiSnapshot | null {
  if (typeof value !== "string") return null;
  try {
    return JSON.parse(value) as CpiSnapshot;
  } catch {
    return null;
  }
}

export async function getHistoricalReports(): Promise<HistoryResult> {
  try {
    const db = await getD1();
    await syncBundledReports(db);
    const result = await db
      .prepare("SELECT report_json FROM cpi_reports ORDER BY month DESC")
      .all<{ report_json: string }>();
    const reports = result.results
      .map((row) => parseSnapshot(row.report_json))
      .filter((report): report is CpiSnapshot => report !== null);
    const fallback = [...cpiHistory].sort((a, b) => b.releaseMonth.localeCompare(a.releaseMonth));
    return { reports: reports.length ? reports : fallback, storageAvailable: true };
  } catch {
    return { reports: [...cpiHistory].sort((a, b) => b.releaseMonth.localeCompare(a.releaseMonth)), storageAvailable: false };
  }
}

export async function getUserFavorites(email: string): Promise<CpiSnapshot[]> {
  const db = await getD1();
  await syncBundledReports(db);
  const result = await db
    .prepare(`SELECT reports.report_json
      FROM user_favorites favorites
      JOIN cpi_reports reports ON reports.month = favorites.report_month
      WHERE favorites.user_email = ?
      ORDER BY favorites.created_at DESC`)
    .bind(email)
    .all<{ report_json: string }>();
  return result.results
    .map((row) => parseSnapshot(row.report_json))
    .filter((report): report is CpiSnapshot => report !== null);
}

export async function addFavorite(email: string, month: string) {
  const db = await getD1();
  await syncBundledReports(db);
  const report = await db.prepare("SELECT month FROM cpi_reports WHERE month = ?").bind(month).first();
  if (!report) throw new Error("CPI report not found");
  await db
    .prepare("INSERT OR IGNORE INTO user_favorites (user_email, report_month) VALUES (?, ?)")
    .bind(email, month)
    .run();
}

export async function removeFavorite(email: string, month: string) {
  const db = await getD1();
  await ensureStorage(db);
  await db
    .prepare("DELETE FROM user_favorites WHERE user_email = ? AND report_month = ?")
    .bind(email, month)
    .run();
}

export async function getDatabaseDashboard(email: string): Promise<DatabaseDashboard> {
  const db = await getD1();
  await syncBundledReports(db);
  const [reportRows, favoriteRows, favoriteCount] = await Promise.all([
    db.prepare(`SELECT month, report_json, source, updated_at, created_at
      FROM cpi_reports ORDER BY month DESC`).all<{
        month: string;
        report_json: string;
        source: string;
        updated_at: string;
        created_at: string;
      }>(),
    db.prepare(`SELECT reports.month, reports.report_json, favorites.created_at
      FROM user_favorites favorites
      JOIN cpi_reports reports ON reports.month = favorites.report_month
      WHERE favorites.user_email = ?
      ORDER BY favorites.created_at DESC`).bind(email).all<{
        month: string;
        report_json: string;
        created_at: string;
      }>(),
    db.prepare("SELECT COUNT(*) AS count FROM user_favorites").first<{ count: number }>(),
  ]);

  return {
    reports: reportRows.results.map((row) => ({
      month: row.month,
      title: parseSnapshot(row.report_json)?.report.headline ?? "报告内容无法解析",
      source: row.source,
      updatedAt: row.updated_at,
      createdAt: row.created_at,
    })),
    favorites: favoriteRows.results.map((row) => ({
      month: row.month,
      title: parseSnapshot(row.report_json)?.report.headline ?? "报告内容无法解析",
      createdAt: row.created_at,
    })),
    totalFavorites: Number(favoriteCount?.count ?? 0),
  };
}
