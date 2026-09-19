ALTER TABLE `variants` ADD `pinned` integer DEFAULT false NOT NULL;--> statement-breakpoint
CREATE INDEX `variants_pinned_idx` ON `variants` (`pinned`);