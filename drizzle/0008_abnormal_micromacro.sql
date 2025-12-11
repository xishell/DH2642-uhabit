CREATE TABLE `goal` (
	`id` text PRIMARY KEY NOT NULL,
	`userId` text NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`startDate` integer NOT NULL,
	`endDate` integer NOT NULL,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `goal_user_id_idx` ON `goal` (`userId`);--> statement-breakpoint
CREATE INDEX `goal_user_dates_idx` ON `goal` (`userId`,`startDate`,`endDate`);--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_habit` (
	`id` text PRIMARY KEY NOT NULL,
	`userId` text NOT NULL,
	`title` text NOT NULL,
	`notes` text,
	`color` text,
	`frequency` text DEFAULT 'daily' NOT NULL,
	`measurement` text DEFAULT 'boolean' NOT NULL,
	`period` text,
	`targetAmount` integer,
	`unit` text,
	`categoryId` text,
	`goalId` text,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`categoryId`) REFERENCES `category`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`goalId`) REFERENCES `goal`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
INSERT INTO `__new_habit`("id", "userId", "title", "notes", "color", "frequency", "measurement", "period", "targetAmount", "unit", "categoryId", "goalId", "createdAt", "updatedAt") SELECT "id", "userId", "title", "notes", "color", "frequency", "measurement", "period", "targetAmount", "unit", "categoryId", "goalId", "createdAt", "updatedAt" FROM `habit`;--> statement-breakpoint
DROP TABLE `habit`;--> statement-breakpoint
ALTER TABLE `__new_habit` RENAME TO `habit`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE INDEX `habit_user_frequency_idx` ON `habit` (`userId`,`frequency`);