ALTER TABLE `users` MODIFY COLUMN `role` enum('user','admin','super_admin') NOT NULL DEFAULT 'user';--> statement-breakpoint
ALTER TABLE `users` ADD `password` varchar(255);--> statement-breakpoint
ALTER TABLE `users` ADD `isImmutable` boolean DEFAULT false NOT NULL;