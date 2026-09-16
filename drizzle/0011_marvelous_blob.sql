CREATE TABLE `company_payment_allocations` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`company_payment_id` integer NOT NULL,
	`purchase_id` integer NOT NULL,
	`amount` integer NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`company_payment_id`) REFERENCES `company_payments`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`purchase_id`) REFERENCES `purchases`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `company_payment_alloc_payment_idx` ON `company_payment_allocations` (`company_payment_id`);--> statement-breakpoint
CREATE INDEX `company_payment_alloc_purchase_idx` ON `company_payment_allocations` (`purchase_id`);