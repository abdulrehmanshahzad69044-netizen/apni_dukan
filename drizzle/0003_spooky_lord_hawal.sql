CREATE TABLE `unit_conversions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`from_unit_id` integer NOT NULL,
	`to_unit_id` integer NOT NULL,
	`factor` integer NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`from_unit_id`) REFERENCES `units`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`to_unit_id`) REFERENCES `units`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `unit_conversions_from_idx` ON `unit_conversions` (`from_unit_id`);--> statement-breakpoint
CREATE INDEX `unit_conversions_to_idx` ON `unit_conversions` (`to_unit_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `unit_conversions_pair_unique` ON `unit_conversions` (`from_unit_id`,`to_unit_id`);--> statement-breakpoint
CREATE TABLE `units` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`short_name` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	`deleted_at` integer
);
--> statement-breakpoint
CREATE INDEX `units_name_idx` ON `units` (`name`);