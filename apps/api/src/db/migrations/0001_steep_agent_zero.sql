CREATE TABLE `app_settings` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`onboarding_completed` integer DEFAULT false NOT NULL,
	`updated_at` integer NOT NULL
);
