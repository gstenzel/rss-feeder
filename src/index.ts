import { cac } from "cac";
import pkg from "../package.json";
import { runMcp } from "./mcp";
import { feedService } from "./service";

const cli = cac(pkg.name);

cli.option("--db <path>", "Set a custom database path");

cli
	.command("add <url>", "Add a new feed")
	.option("--name <name>", "Override the default name")
	.action(async (url: string, options: { name?: string }) => {
		try {
			const feed = await feedService.addFeed(url, options.name);
			console.log(`Added feed: ${feed.name} (${feed.title})`);
		} catch (error) {
			console.error(`Error adding feed: ${error instanceof Error ? error.message : String(error)}`);
			process.exit(1);
		}
	});

cli.command("remove <name-or-url>", "Remove a feed").action(async (nameOrUrl: string) => {
	try {
		const feed = await feedService.removeFeed(nameOrUrl);
		console.log(`Removed feed: ${feed.name}`);
	} catch (error) {
		console.error(`Error removing feed: ${error instanceof Error ? error.message : String(error)}`);
		process.exit(1);
	}
});

cli.command("pull", "Pull updates for all feeds").action(async () => {
	console.log("Pulling feeds...");
	try {
		const results = await feedService.pullFeeds();
		console.log(`Success: ${results.success}, Failed: ${results.failed}, New Articles: ${results.newArticles}`);
	} catch (error) {
		console.error(`Error pulling feeds: ${error instanceof Error ? error.message : String(error)}`);
		process.exit(1);
	}
});

cli.command("read <id>", "Mark an article as read").action(async (id: string) => {
	try {
		const articleId = Number.parseInt(id, 10);
		if (Number.isNaN(articleId)) throw new Error("Invalid ID");
		const article = await feedService.markRead(articleId);
		console.log(`Marked article ${article.id} as read`);
	} catch (error) {
		console.error(`Error marking article as read: ${error instanceof Error ? error.message : String(error)}`);
		process.exit(1);
	}
});

cli.command("unread <id>", "Mark an article as unread").action(async (id: string) => {
	try {
		const articleId = Number.parseInt(id, 10);
		if (Number.isNaN(articleId)) throw new Error("Invalid ID");
		const article = await feedService.markUnread(articleId);
		console.log(`Marked article ${article.id} as unread`);
	} catch (error) {
		console.error(`Error marking article as unread: ${error instanceof Error ? error.message : String(error)}`);
		process.exit(1);
	}
});

cli.command("read-all", "Mark all articles as read").action(async () => {
	try {
		const count = await feedService.markAllRead();
		console.log(`Marked ${count} articles as read`);
	} catch (error) {
		console.error(`Error marking all as read: ${error instanceof Error ? error.message : String(error)}`);
		process.exit(1);
	}
});

cli.command("blogs", "List all blogs").action(async () => {
	try {
		const blogs = await feedService.getBlogs();
		if (blogs.length === 0) {
			console.log("No blogs found");
			return;
		}
		console.table(
			blogs.map((b) => ({
				ID: b.id,
				Name: b.name,
				Title: b.feedTitle,
				URL: b.url,
				Last_Success: b.lastSuccessAt ? b.lastSuccessAt.toLocaleString() : "Never",
				Error: b.lastError || "-",
			})),
		);
	} catch (error) {
		console.error(`Error listing blogs: ${error instanceof Error ? error.message : String(error)}`);
		process.exit(1);
	}
});

cli
	.command("articles", "List articles")
	.option("--all", "Show all articles, including read ones")
	.option("--blog <name>", "Filter by blog name")
	.option("--since <date>", "Filter by published date (ISO string)")
	.action(async (options: { all?: boolean; blog?: string; since?: string }) => {
		try {
			let sinceDate: Date | undefined;
			if (options.since) {
				sinceDate = new Date(options.since);
				if (Number.isNaN(sinceDate.getTime())) {
					throw new Error("Invalid date for --since");
				}
			}

			const articles = await feedService.getArticles({
				unreadOnly: !options.all,
				blogName: options.blog,
				since: sinceDate,
			});

			if (articles.length === 0) {
				console.log("No articles found");
				return;
			}

			console.table(
				articles.map((a) => ({
					ID: a.id,
					Blog: a.blogName,
					Title: a.title,
					Published: a.publishedAt ? a.publishedAt.toLocaleString() : "-",
					Read: a.readAt ? "Yes" : "No",
				})),
			);
		} catch (error) {
			console.error(`Error listing articles: ${error instanceof Error ? error.message : String(error)}`);
			process.exit(1);
		}
	});

cli
	.command("mcp", "Start the MCP server")
	.option("-p, --port <port>", "Port to run the MCP server on")
	.action(async (options: { port?: number | string }) => {
		try {
			const port = options.port ? Number(options.port) : 3000;
			await runMcp(port);
		} catch (error) {
			console.error(`Error starting MCP server: ${error instanceof Error ? error.message : String(error)}`);
			process.exit(1);
		}
	});

cli.help();
cli.version(pkg.version);

cli.parse();
if (!cli.matchedCommand && !cli.options.help && !cli.options.version) {
	cli.outputHelp();
}
