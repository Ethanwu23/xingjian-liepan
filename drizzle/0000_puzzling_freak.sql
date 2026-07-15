CREATE TABLE `cpi_reports` (
	`month` text PRIMARY KEY NOT NULL,
	`report_json` text NOT NULL,
	`source` text NOT NULL,
	`source_url` text NOT NULL,
	`updated_at` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE `user_favorites` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_email` text NOT NULL,
	`report_month` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`report_month`) REFERENCES `cpi_reports`(`month`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `user_favorites_user_month_idx` ON `user_favorites` (`user_email`,`report_month`);