ALTER TABLE `variants` ADD `is_quick_item` integer DEFAULT false NOT NULL;--> statement-breakpoint
CREATE INDEX `variants_quick_item_idx` ON `variants` (`is_quick_item`);