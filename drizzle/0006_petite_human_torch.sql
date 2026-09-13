CREATE TABLE `purchases` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`purchase_number` text NOT NULL,
	`company_id` integer NOT NULL,
	`purchase_date` integer NOT NULL,
	`total_amount` integer NOT NULL,
	`paid_amount` integer DEFAULT 0 NOT NULL,
	`remarks` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `purchases_purchase_number_unique` ON `purchases` (`purchase_number`);--> statement-breakpoint
CREATE INDEX `purchases_company_idx` ON `purchases` (`company_id`);--> statement-breakpoint
CREATE INDEX `purchases_date_idx` ON `purchases` (`purchase_date`);--> statement-breakpoint
CREATE TABLE `stock_batches` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`variant_id` integer NOT NULL,
	`purchase_id` integer NOT NULL,
	`purchase_price` integer NOT NULL,
	`suggested_retail_price` integer,
	`suggested_wholesale_price` integer,
	`quantity_purchased` integer NOT NULL,
	`remaining_quantity` integer NOT NULL,
	`purchase_date` integer NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`variant_id`) REFERENCES `variants`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`purchase_id`) REFERENCES `purchases`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `stock_batches_variant_idx` ON `stock_batches` (`variant_id`);--> statement-breakpoint
CREATE INDEX `stock_batches_fifo_idx` ON `stock_batches` (`variant_id`,`purchase_date`);--> statement-breakpoint
CREATE TABLE `stock_ledger` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`batch_id` integer NOT NULL,
	`variant_id` integer NOT NULL,
	`quantity_change` integer NOT NULL,
	`unit_cost` integer NOT NULL,
	`movement_type` text NOT NULL,
	`reference_type` text,
	`reference_id` integer,
	`notes` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`batch_id`) REFERENCES `stock_batches`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`variant_id`) REFERENCES `variants`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `stock_ledger_batch_idx` ON `stock_ledger` (`batch_id`);--> statement-breakpoint
CREATE INDEX `stock_ledger_variant_idx` ON `stock_ledger` (`variant_id`);--> statement-breakpoint
CREATE INDEX `stock_ledger_ref_idx` ON `stock_ledger` (`reference_type`,`reference_id`);--> statement-breakpoint
CREATE INDEX `stock_ledger_type_idx` ON `stock_ledger` (`movement_type`);--> statement-breakpoint
CREATE INDEX `stock_ledger_created_idx` ON `stock_ledger` (`created_at`);