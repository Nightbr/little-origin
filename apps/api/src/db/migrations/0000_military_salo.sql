CREATE TABLE `matches` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name_id` integer NOT NULL,
	`user_count` integer NOT NULL,
	`matched_at` integer NOT NULL,
	FOREIGN KEY (`name_id`) REFERENCES `names`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `matches_name_id_unique` ON `matches` (`name_id`);--> statement-breakpoint
CREATE TABLE `names` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`gender` text NOT NULL,
	`origin_country` text NOT NULL,
	`source` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_names_country` ON `names` (`origin_country`);--> statement-breakpoint
CREATE UNIQUE INDEX `names_name_gender_unique` ON `names` (`name`,`gender`);--> statement-breakpoint
CREATE TABLE `preferences` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`country_origins` text NOT NULL,
	`gender_preference` text NOT NULL,
	`max_characters` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `reviews` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`name_id` integer NOT NULL,
	`is_liked` integer NOT NULL,
	`reviewed_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`name_id`) REFERENCES `names`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_reviews_user` ON `reviews` (`user_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `reviews_user_id_name_id_unique` ON `reviews` (`user_id`,`name_id`);--> statement-breakpoint
CREATE TABLE `users` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`username` text NOT NULL,
	`password_hash` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_username_unique` ON `users` (`username`);