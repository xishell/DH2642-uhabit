CREATE TABLE `stats_cache` (
	`id` text PRIMARY KEY NOT NULL,
	`userId` text NOT NULL,
	`scope` text NOT NULL,
	`dateKey` text NOT NULL,
	`data` text NOT NULL,
	`computedAt` integer NOT NULL,
	`validUntil` integer NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `stats_cache_user_scope_idx` ON `stats_cache` (`userId`,`scope`);--> statement-breakpoint
CREATE INDEX `stats_cache_valid_until_idx` ON `stats_cache` (`validUntil`);