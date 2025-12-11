ALTER TABLE `user` ADD `firstName` text;--> statement-breakpoint
ALTER TABLE `user` ADD `lastName` text;--> statement-breakpoint
ALTER TABLE `user` ADD `username` text;--> statement-breakpoint
CREATE UNIQUE INDEX `user_username_unique` ON `user` (`username`);--> statement-breakpoint

-- Migrate existing data: split name into firstName/lastName
UPDATE `user` SET
  `firstName` = CASE
    WHEN instr(`name`, ' ') > 0 THEN substr(`name`, 1, instr(`name`, ' ') - 1)
    ELSE `name`
  END,
  `lastName` = CASE
    WHEN instr(`name`, ' ') > 0 THEN substr(`name`, instr(`name`, ' ') + 1)
    ELSE NULL
  END
WHERE `firstName` IS NULL;