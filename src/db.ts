import { drizzle } from "drizzle-orm/libsql";
import { getDbUrl } from "./utils";

const args = process.argv;
let customDbPath: string | undefined;
const dbArgIndex = args.indexOf("--db");
if (dbArgIndex !== -1 && args[dbArgIndex + 1]) {
	customDbPath = args[dbArgIndex + 1];
}

const dbUrl = getDbUrl(customDbPath);

export const db = drizzle(dbUrl);

async function initializeDatabase() {
	await db.run("PRAGMA foreign_keys = ON;");
	await db.run("PRAGMA journal_mode = WAL;");
	await db.run("PRAGMA synchronous = NORMAL;");

	await db.run(`
		CREATE TABLE IF NOT EXISTS blogs (
			id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
			name text NOT NULL,
			url text NOT NULL,
			siteUrl text,
			feedTitle text,
			etag text,
			lastModified text,
			lastCheckedAt integer,
			lastSuccessAt integer,
			lastError text,
			createdAt integer DEFAULT (unixepoch()) NOT NULL,
			updatedAt integer DEFAULT (unixepoch()) NOT NULL
		);
	`);
	await db.run("CREATE UNIQUE INDEX IF NOT EXISTS blogs_name_unique ON blogs (name);");
	await db.run("CREATE UNIQUE INDEX IF NOT EXISTS blogs_url_unique ON blogs (url);");
	await db.run("CREATE UNIQUE INDEX IF NOT EXISTS blogs_name_idx ON blogs (name);");
	await db.run("CREATE UNIQUE INDEX IF NOT EXISTS blogs_url_idx ON blogs (url);");

	await db.run(`
		CREATE TABLE IF NOT EXISTS articles (
			id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
			blogId integer NOT NULL,
			articleKey text NOT NULL,
			guid text,
			title text NOT NULL,
			url text,
			author text,
			summary text,
			content text,
			publishedAt integer,
			discoveredAt integer DEFAULT (unixepoch()) NOT NULL,
			readAt integer,
			FOREIGN KEY (blogId) REFERENCES blogs(id) ON UPDATE no action ON DELETE cascade
		);
	`);
	await db.run("CREATE UNIQUE INDEX IF NOT EXISTS articles_articleKey_unique ON articles (articleKey);");
	await db.run("CREATE INDEX IF NOT EXISTS articles_blog_idx ON articles (blogId);");
	await db.run("CREATE INDEX IF NOT EXISTS articles_read_idx ON articles (readAt);");
	await db.run("CREATE INDEX IF NOT EXISTS articles_published_idx ON articles (publishedAt);");
	await db.run("CREATE INDEX IF NOT EXISTS articles_blog_published_idx ON articles (blogId, publishedAt);");
}

await initializeDatabase();
