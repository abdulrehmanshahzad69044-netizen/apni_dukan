CREATE TABLE `bills` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`bill_number` text NOT NULL,
	`customer_id` integer,
	`bill_date` integer NOT NULL,
	`total_amount` integer NOT NULL,
	`paid_amount` integer DEFAULT 0 NOT NULL,
	`remaining_amount` integer DEFAULT 0 NOT NULL,
	`cogs` integer DEFAULT 0 NOT NULL,
	`status` text DEFAULT 'finalized' NOT NULL,
	`remarks` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `bills_bill_number_unique` ON `bills` (`bill_number`);--> statement-breakpoint
CREATE INDEX `bills_customer_idx` ON `bills` (`customer_id`);--> statement-breakpoint
CREATE INDEX `bills_date_idx` ON `bills` (`bill_date`);--> statement-breakpoint
CREATE INDEX `bills_status_idx` ON `bills` (`status`);--> statement-breakpoint
CREATE TABLE `bill_items` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`bill_id` integer NOT NULL,
	`variant_id` integer NOT NULL,
	`unit_id` integer NOT NULL,
	`quantity` integer NOT NULL,
	`unit_price` integer NOT NULL,
	`line_total` integer NOT NULL,
	`line_cogs` integer DEFAULT 0 NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`bill_id`) REFERENCES `bills`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`variant_id`) REFERENCES `variants`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`unit_id`) REFERENCES `units`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `bill_items_bill_idx` ON `bill_items` (`bill_id`);--> statement-breakpoint
CREATE INDEX `bill_items_variant_idx` ON `bill_items` (`variant_id`);--> statement-breakpoint
CREATE TABLE `bill_item_fifo` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`bill_item_id` integer NOT NULL,
	`batch_id` integer NOT NULL,
	`quantity_consumed` integer NOT NULL,
	`unit_cost` integer NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`bill_item_id`) REFERENCES `bill_items`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`batch_id`) REFERENCES `stock_batches`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `bill_item_fifo_item_idx` ON `bill_item_fifo` (`bill_item_id`);--> statement-breakpoint
CREATE INDEX `bill_item_fifo_batch_idx` ON `bill_item_fifo` (`batch_id`);--> statement-breakpoint
CREATE TABLE `payments` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`customer_id` integer NOT NULL,
	`bill_id` integer,
	`amount` integer NOT NULL,
	`payment_date` integer NOT NULL,
	`remarks` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`bill_id`) REFERENCES `bills`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `payments_customer_idx` ON `payments` (`customer_id`);--> statement-breakpoint
CREATE INDEX `payments_bill_idx` ON `payments` (`bill_id`);--> statement-breakpoint
CREATE INDEX `payments_date_idx` ON `payments` (`payment_date`);--> statement-breakpoint
CREATE TABLE `payment_allocations` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`payment_id` integer NOT NULL,
	`bill_id` integer NOT NULL,
	`amount` integer NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`payment_id`) REFERENCES `payments`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`bill_id`) REFERENCES `bills`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `payment_alloc_payment_idx` ON `payment_allocations` (`payment_id`);--> statement-breakpoint
CREATE INDEX `payment_alloc_bill_idx` ON `payment_allocations` (`bill_id`);