import { and, eq, gte, isNull, or } from "drizzle-orm";
import { db } from "./db";
import { parseFeed } from "./feed";
import { fetchWithLimits, generateStableHash } from "./fetch";
import { articles, blogs } from "./schema";

export class FeedService {
	/**
	 * Adds a new feed by URL.
	 */
	async addFeed(url: string, nameOverride?: string) {
		// Validate URL
		try {
			const parsedUrl = new URL(url);
			if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
				throw new Error("URL must use http or https");
			}

			// Check if already exists
			const existing = await db
				.select()
				.from(blogs)
				.where(or(eq(blogs.url, url), nameOverride ? eq(blogs.name, nameOverride) : undefined))
				.limit(1)
				.get();

			if (existing) {
				if (existing.url === url) {
					throw new Error(`Feed URL already exists: ${existing.name}`);
				}
				throw new Error(`Feed name already exists: ${nameOverride}`);
			}

			// Fetch and parse to get the title
			const { content } = await fetchWithLimits(url);
			if (!content) {
				throw new Error("No content returned from URL");
			}

			const parsed = await parseFeed(content);

			let name = nameOverride;
			if (!name) {
				// Derive name from feed title first, then domain fallback
				if (parsed.title && parsed.title !== "Untitled Feed") {
					name = parsed.title
						.toLowerCase()
						.replace(/[^a-z0-9_-]/g, "-")
						.replace(/-+/g, "-")
						.replace(/^-|-$/g, "");
				} else {
					name = parsedUrl.hostname.replace(/^www\./, "");
				}

				// Ensure uniqueness
				let uniqueName = name;
				let counter = 1;
				while (true) {
					const check = await db.select({ id: blogs.id }).from(blogs).where(eq(blogs.name, uniqueName)).get();
					if (!check) break;
					uniqueName = `${name}-${counter++}`;
				}
				name = uniqueName;
			}

			// Insert into DB
			await db.insert(blogs).values({
				name: name,
				url: url,
				siteUrl: parsed.siteUrl,
				feedTitle: parsed.title,
			});

			return { name, url, title: parsed.title };
		} catch (error) {
			if (error instanceof Error && error.message.includes("Invalid URL")) {
				throw error;
			}
			if (error instanceof Error) {
				throw error;
			}
			throw new Error(`Invalid URL: ${url}`);
		}
	}

	/**
	 * Removes a feed by name or URL.
	 */
	async removeFeed(nameOrUrl: string) {
		const result = await db
			.delete(blogs)
			.where(or(eq(blogs.name, nameOrUrl), eq(blogs.url, nameOrUrl)))
			.returning();

		const feed = result[0];
		if (!feed) {
			throw new Error(`Feed not found: ${nameOrUrl}`);
		}

		return feed;
	}

	/**
	 * Pulls updates for all feeds.
	 */
	async pullFeeds() {
		const allBlogs = await db.select().from(blogs).all();
		const results = { success: 0, failed: 0, newArticles: 0 };

		for (const blog of allBlogs) {
			try {
				const { content, status, etag, lastModified } = await fetchWithLimits(blog.url, {
					etag: blog.etag,
					lastModified: blog.lastModified,
				});

				const now = new Date();

				if (status === 304 || !content) {
					// Not modified
					await db
						.update(blogs)
						.set({
							lastCheckedAt: now,
							lastSuccessAt: now,
							lastError: null,
						})
						.where(eq(blogs.id, blog.id));
					results.success++;
					continue;
				}

				const parsed = await parseFeed(content);

				// Process articles
				for (const item of parsed.items) {
					const articleKey = generateStableHash(blog.url, item.url || "", item.guid);

					// Check if article exists
					const existingArticle = await db
						.select({ id: articles.id })
						.from(articles)
						.where(eq(articles.articleKey, articleKey))
						.get();

					if (!existingArticle) {
						await db.insert(articles).values({
							blogId: blog.id,
							articleKey,
							guid: item.guid,
							title: item.title,
							url: item.url,
							author: item.author,
							summary: item.summary,
							content: item.content,
							publishedAt: item.publishedAt,
						});
						results.newArticles++;
					}
				}

				await db
					.update(blogs)
					.set({
						etag,
						lastModified,
						feedTitle: parsed.title,
						siteUrl: parsed.siteUrl,
						lastCheckedAt: now,
						lastSuccessAt: now,
						lastError: null,
					})
					.where(eq(blogs.id, blog.id));
				results.success++;
			} catch (error) {
				await db
					.update(blogs)
					.set({
						lastCheckedAt: new Date(),
						lastError: error instanceof Error ? error.message : String(error),
					})
					.where(eq(blogs.id, blog.id));
				results.failed++;
			}
		}

		return results;
	}

	/**
	 * List all blogs.
	 */
	async getBlogs() {
		return db.select().from(blogs).all();
	}

	/**
	 * List articles with filters.
	 */
	async getArticles(options: { unreadOnly?: boolean; blogName?: string; since?: Date } = {}) {
		const conditions = [];

		if (options.unreadOnly) {
			conditions.push(isNull(articles.readAt));
		}

		if (options.blogName) {
			const blog = await db.select({ id: blogs.id }).from(blogs).where(eq(blogs.name, options.blogName)).get();
			if (!blog) {
				throw new Error(`Blog not found: ${options.blogName}`);
			}
			conditions.push(eq(articles.blogId, blog.id));
		}

		if (options.since) {
			conditions.push(gte(articles.publishedAt, options.since));
		}

		const query = db
			.select({
				id: articles.id,
				title: articles.title,
				url: articles.url,
				author: articles.author,
				publishedAt: articles.publishedAt,
				blogName: blogs.name,
				readAt: articles.readAt,
				summary: articles.summary,
			})
			.from(articles)
			.leftJoin(blogs, eq(articles.blogId, blogs.id));

		if (conditions.length > 0) {
			query.where(and(...conditions));
		}

		// Order by publishedAt descending, nulls last usually, or fallback to discoveredAt
		// In sqlite, we can just order by publishedAt DESC
		const result = await query.all();

		// Sort manually for robust fallback handling if publishedAt is null
		return result.sort((a, b) => {
			const dateA = a.publishedAt ? a.publishedAt.getTime() : 0;
			const dateB = b.publishedAt ? b.publishedAt.getTime() : 0;
			return dateB - dateA;
		});
	}

	/**
	 * Mark an article as read.
	 */
	async markRead(id: number) {
		const result = await db.update(articles).set({ readAt: new Date() }).where(eq(articles.id, id)).returning();

		const article = result[0];
		if (!article) {
			throw new Error(`Article not found: ${id}`);
		}
		return article;
	}

	/**
	 * Mark an article as unread.
	 */
	async markUnread(id: number) {
		const result = await db.update(articles).set({ readAt: null }).where(eq(articles.id, id)).returning();

		const article = result[0];
		if (!article) {
			throw new Error(`Article not found: ${id}`);
		}
		return article;
	}

	/**
	 * Mark all articles as read.
	 */
	async markAllRead() {
		const result = await db
			.update(articles)
			.set({ readAt: new Date() })
			.where(isNull(articles.readAt))
			.returning({ id: articles.id });

		return result.length;
	}
}

export const feedService = new FeedService();
