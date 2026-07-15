import { sql } from "drizzle-orm";
import { integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const cpiReports = sqliteTable("cpi_reports", {
  month: text("month").primaryKey(),
  reportJson: text("report_json").notNull(),
  source: text("source").notNull(),
  sourceUrl: text("source_url").notNull(),
  updatedAt: text("updated_at").notNull(),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const userFavorites = sqliteTable(
  "user_favorites",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    userEmail: text("user_email").notNull(),
    reportMonth: text("report_month")
      .notNull()
      .references(() => cpiReports.month, { onDelete: "cascade" }),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    uniqueIndex("user_favorites_user_month_idx").on(table.userEmail, table.reportMonth),
  ],
);
