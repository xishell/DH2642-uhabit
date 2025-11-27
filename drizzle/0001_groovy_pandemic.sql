CREATE TABLE `habit` (
	`id` text PRIMARY KEY NOT NULL,
	`userId` text NOT NULL,
	`title` text NOT NULL,
	`notes` text,
	`color` text,
	`frequency` text DEFAULT 'daily' NOT NULL,
	`measurement` text DEFAULT 'boolean' NOT NULL,
	`period` text,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `habit_completion` (
	`id` text PRIMARY KEY NOT NULL,
	`habitId` text NOT NULL,
	`userId` text NOT NULL,
	`completedAt` integer NOT NULL,
	`measurement` integer,
	`notes` text,
	`createdAt` integer NOT NULL,
	FOREIGN KEY (`habitId`) REFERENCES `habit`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `habit_completion_user_date_idx` ON `habit_completion` (`userId`,`completedAt`);--> statement-breakpoint
CREATE INDEX `habit_completion_habit_date_idx` ON `habit_completion` (`habitId`,`completedAt`);--> statement-breakpoint
CREATE UNIQUE INDEX `habit_completion_unique` ON `habit_completion` (`habitId`,`completedAt`);