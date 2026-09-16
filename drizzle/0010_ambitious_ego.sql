CREATE TABLE `expenses` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`amount` integer NOT NULL,
	`date` integer NOT NULL,
	`remarks` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `expenses_date_idx` ON `expenses` (`date`);--> statement-breakpoint
CREATE INDEX `expenses_name_idx` ON `expenses` (`name`);--> statement-breakpoint
CREATE TABLE `company_payments` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`company_id` integer NOT NULL,
	`purchase_id` integer,
	`amount` integer NOT NULL,
	`date` integer NOT NULL,
	`remarks` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`purchase_id`) REFERENCES `purchases`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `company_payments_company_idx` ON `company_payments` (`company_id`);--> statement-breakpoint
CREATE INDEX `company_payments_date_idx` ON `company_payments` (`date`);