CREATE TABLE `stock_adjustments` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`variant_id` integer NOT NULL,
	`quantity` integer NOT NULL,
	`unit_cost` integer NOT NULL,
	`adjustment_type` text NOT NULL,
	`reason` text,
	`adjustment_date` integer NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`variant_id`) REFERENCES `variants`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `stock_adjustments_variant_idx` ON `stock_adjustments` (`variant_id`);--> statement-breakpoint
CREATE INDEX `stock_adjustments_type_idx` ON `stock_adjustments` (`adjustment_type`);--> statement-breakpoint
CREATE INDEX `stock_adjustments_date_idx` ON `stock_adjustments` (`adjustment_date`);