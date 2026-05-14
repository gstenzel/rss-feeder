CREATE TABLE `articles` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`blogId` integer NOT NULL,
	`articleKey` text NOT NULL,
	`guid` text,
	`title` text NOT NULL,
	`url` text,
	`author` text,
	`summary` text,
	`content` text,
	`publishedAt` integer,
	`discoveredAt` integer DEFAULT (unixepoch()) NOT NULL,
	`readAt` integer,
	FOREIGN KEY (`blogId`) REFERENCES `blogs`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `articles_articleKey_unique` ON `articles` (`articleKey`);--> statement-breakpoint
CREATE INDEX `articles_blog_idx` ON `articles` (`blogId`);--> statement-breakpoint
CREATE INDEX `articles_read_idx` ON `articles` (`readAt`);--> statement-breakpoint
CREATE INDEX `articles_published_idx` ON `articles` (`publishedAt`);--> statement-breakpoint
CREATE INDEX `articles_blog_published_idx` ON `articles` (`blogId`,`publishedAt`);--> statement-breakpoint
CREATE TABLE `blogs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`url` text NOT NULL,
	`siteUrl` text,
	`feedTitle` text,
	`etag` text,
	`lastModified` text,
	`lastCheckedAt` integer,
	`lastSuccessAt` integer,
	`lastError` text,
	`createdAt` integer DEFAULT (unixepoch()) NOT NULL,
	`updatedAt` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `blogs_name_unique` ON `blogs` (`name`);--> statement-breakpoint
CREATE UNIQUE INDEX `blogs_url_unique` ON `blogs` (`url`);--> statement-breakpoint
CREATE UNIQUE INDEX `blogs_name_idx` ON `blogs` (`name`);--> statement-breakpoint
CREATE UNIQUE INDEX `blogs_url_idx` ON `blogs` (`url`);