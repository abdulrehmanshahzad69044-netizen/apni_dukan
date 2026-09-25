ALTER TABLE `variants` ADD `price_volatile` integer DEFAULT false NOT NULL;--> statement-breakpoint
CREATE INDEX `variants_volatile_idx` ON `variants` (`price_volatile`);