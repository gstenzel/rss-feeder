import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import pkg from "../package.json";
import { feedService } from "./service";
import { parseSinceDate } from "./utils";

const server = new McpServer({
	name: pkg.name,
	version: pkg.version,
});

server.registerTool(
	"add_feed",
	{
		description: "Add a new RSS or JSON feed",
		inputSchema: {
			url: z.string().url(),
			name: z.string().optional(),
		},
	},
	async ({ url, name }) => {
		const feed = await feedService.addFeed(url, name);
		return {
			content: [{ type: "text", text: `Added feed: ${feed.name} (${feed.title})` }],
		};
	},
);

server.registerTool(
	"remove_feed",
	{
		description: "Remove a feed by name or URL",
		inputSchema: {
			nameOrUrl: z.string(),
		},
	},
	async ({ nameOrUrl }) => {
		const feed = await feedService.removeFeed(nameOrUrl);
		return {
			content: [{ type: "text", text: `Removed feed: ${feed.name}` }],
		};
	},
);

server.registerTool(
	"pull_feeds",
	{
		description: "Pull updates for all feeds",
	},
	async () => {
		const results = await feedService.pullFeeds();
		return {
			content: [
				{
					type: "text",
					text: `Success: ${results.success}, Failed: ${results.failed}, New Articles: ${results.newArticles}`,
				},
			],
		};
	},
);

server.registerTool(
	"mark_read",
	{
		description: "Mark an article as read",
		inputSchema: {
			id: z.number(),
		},
	},
	async ({ id }) => {
		const article = await feedService.markRead(id);
		return {
			content: [{ type: "text", text: `Marked article ${article.id} as read` }],
		};
	},
);

server.registerTool(
	"mark_unread",
	{
		description: "Mark an article as unread",
		inputSchema: {
			id: z.number(),
		},
	},
	async ({ id }) => {
		const article = await feedService.markUnread(id);
		return {
			content: [{ type: "text", text: `Marked article ${article.id} as unread` }],
		};
	},
);

server.registerTool(
	"mark_all_read",
	{
		description: "Mark all articles as read",
	},
	async () => {
		const count = await feedService.markAllRead();
		return {
			content: [{ type: "text", text: `Marked ${count} articles as read` }],
		};
	},
);

server.registerTool(
	"list_blogs",
	{
		description: "List all blogs",
	},
	async () => {
		const blogs = await feedService.getBlogs();
		return {
			content: [{ type: "text", text: JSON.stringify(blogs, null, 2) }],
		};
	},
);

server.registerTool(
	"list_articles",
	{
		description: "List articles",
		inputSchema: {
			all: z.boolean().optional(),
			blogName: z.string().optional(),
			since: z.string().optional(),
			limit: z.number().int().positive().optional(),
		},
	},
	async ({ all, blogName, since, limit }) => {
		let sinceDate: Date | undefined;
		if (since) {
			sinceDate = parseSinceDate(since);
		}
		const articles = await feedService.getArticles({
			unreadOnly: !all,
			blogName: blogName,
			since: sinceDate,
			limit,
		});
		return {
			content: [{ type: "text", text: JSON.stringify(articles, null, 2) }],
		};
	},
);

export async function runMcp() {
	const transport = new StdioServerTransport();
	await server.connect(transport);
	return transport;
}
