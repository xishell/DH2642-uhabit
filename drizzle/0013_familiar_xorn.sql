CREATE TABLE `holiday_cache` (
	`id` text PRIMARY KEY NOT NULL,
	`countryCode` text NOT NULL,
	`year` integer NOT NULL,
	`holidays` text NOT NULL,
	`fetchedAt` integer NOT NULL,
	`expiresAt` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `holiday_cache_country_year_idx` ON `holiday_cache` (`countryCode`,`year`);--> statement-breakpoint
CREATE TABLE `notification` (
	`id` text PRIMARY KEY NOT NULL,
	`userId` text NOT NULL,
	`type` text NOT NULL,
	`habitId` text,
	`goalId` text,
	`title` text NOT NULL,
	`body` text NOT NULL,
	`metadata` text,
	`read` integer DEFAULT false NOT NULL,
	`dismissed` integer DEFAULT false NOT NULL,
	`createdAt` integer NOT NULL,
	`expiresAt` integer,
	FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`habitId`) REFERENCES `habit`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`goalId`) REFERENCES `goal`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `notification_user_idx` ON `notification` (`userId`);--> statement-breakpoint
CREATE INDEX `notification_user_unread_idx` ON `notification` (`userId`,`read`);--> statement-breakpoint
CREATE INDEX `notification_type_idx` ON `notification` (`type`);--> statement-breakpoint
CREATE INDEX `notification_created_at_idx` ON `notification` (`createdAt`);--> statement-breakpoint
CREATE TABLE `push_subscription` (
	`id` text PRIMARY KEY NOT NULL,
	`userId` text NOT NULL,
	`endpoint` text NOT NULL,
	`keys` text NOT NULL,
	`userAgent` text,
	`createdAt` integer NOT NULL,
	`lastUsedAt` integer,
	FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `push_subscription_endpoint_unique` ON `push_subscription` (`endpoint`);--> statement-breakpoint
CREATE INDEX `push_subscription_user_idx` ON `push_subscription` (`userId`);--> statement-breakpoint
CREATE INDEX `push_subscription_endpoint_idx` ON `push_subscription` (`endpoint`);