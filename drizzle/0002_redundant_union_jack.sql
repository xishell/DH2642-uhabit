CREATE TABLE `category` (
	`id` text PRIMARY KEY NOT NULL,
	`userId` text NOT NULL,
	`name` text NOT NULL,
	`color` text,
	`createdAt` integer NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
ALTER TABLE `habit` ADD `targetAmount` integer;--> statement-breakpoint
ALTER TABLE `habit` ADD `unit` text;--> statement-breakpoint
ALTER TABLE `habit` ADD `categoryId` text REFERENCES category(id);--> statement-breakpoint
ALTER TABLE `habit` ADD `goalId` text;