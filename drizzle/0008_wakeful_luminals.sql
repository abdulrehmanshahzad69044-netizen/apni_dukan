PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_stock_batches` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`variant_id` integer NOT NULL,
	`purchase_id` integer,
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
INSERT INTO `__new_stock_batches`("id", "variant_id", "purchase_id", "purchase_price", "suggested_retail_price", "suggested_wholesale_price", "quantity_purchased", "remaining_quantity", "purchase_date", "created_at", "updated_at") SELECT "id", "variant_id", "purchase_id", "purchase_price", "suggested_retail_price", "suggested_wholesale_price", "quantity_purchased", "remaining_quantity", "purchase_date", "created_at", "updated_at" FROM `stock_batches`;--> statement-breakpoint
DROP TABLE `stock_batches`;--> statement-breakpoint
ALTER TABLE `__new_stock_batches` RENAME TO `stock_batches`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE INDEX `stock_batches_variant_idx` ON `stock_batches` (`variant_id`);--> statement-breakpoint
CREATE INDEX `stock_batches_fifo_idx` ON `stock_batches` (`variant_id`,`purchase_date`);--> statement-breakpoint
ALTER TABLE `variants` ADD `low_stock_threshold` integer;