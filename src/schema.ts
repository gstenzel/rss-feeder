import { sql } from "drizzle-orm";
import { index, int, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const blogs = sqliteTable(
	"blogs",
	{
		id: int().primaryKey({ autoIncrement: true }),
		name: text().notNull().unique(),
		url: text().notNull().unique(),
		siteUrl: text(),
		feedTitle: text(),
		etag: text(),
		lastModified: text(),
		lastCheckedAt: int({ mode: "timestamp" }),
		lastSuccessAt: int({ mode: "timestamp" }),
		lastError: text(),
		createdAt: int({ mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
		updatedAt: int({ mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
	},
	(table) => ({
		nameIdx: uniqueIndex("blogs_name_idx").on(table.name),
		urlIdx: uniqueIndex("blogs_url_idx").on(table.url),
	}),
);

export const articles = sqliteTable(
	"articles",
	{
		id: int().primaryKey({ autoIncrement: true }),
		blogId: int()
			.notNull()
			.references(() => blogs.id, {
				onDelete: "cascade",
			}),
		articleKey: text().notNull().unique(),
		guid: text(),
		title: text().notNull(),
		url: text(),
		author: text(),
		summary: text(),
		content: text(),
		publishedAt: int({ mode: "timestamp" }),
		discoveredAt: int({ mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
		readAt: int({ mode: "timestamp" }),
	},
	(table) => ({
		blogIdx: index("articles_blog_idx").on(table.blogId),
		readIdx: index("articles_read_idx").on(table.readAt),
		publishedIdx: index("articles_published_idx").on(table.publishedAt),
		blogPublishedIdx: index("articles_blog_published_idx").on(table.blogId, table.publishedAt),
	}),
);
