import { afterAll, beforeAll, expect, test } from "bun:test";
import * as fs from "node:fs";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { spawnSync } from "bun";

const TEST_DB = "./test-mcp.sqlite";
const MCP_SOURCE = "./src/mcp.ts";

function removeTestDb() {
	for (const path of [TEST_DB, `${TEST_DB}-shm`, `${TEST_DB}-wal`]) {
		if (fs.existsSync(path)) {
			fs.unlinkSync(path);
		}
	}
}

test("MCP server uses stdio without console logging", () => {
	const source = fs.readFileSync(MCP_SOURCE, "utf8");

	expect(source).toContain('from "@modelcontextprotocol/sdk/server/stdio.js"');
	expect(source).not.toContain("node:http");
	expect(source).not.toContain("streamableHttp");
	expect(source).not.toContain("console.");
});

beforeAll(async () => {
	removeTestDb();

	// Push schema to the test DB
	const push = spawnSync(["bunx", "drizzle-kit", "push"], {
		env: { ...process.env, RSS_WATCHER_CLI_DB_PATH: TEST_DB },
	});
	if (push.exitCode !== 0) {
		console.error(push.stderr?.toString());
		throw new Error("Failed to push schema");
	}

	// Set db path for the server we're going to run in the same process
	process.env.RSS_WATCHER_CLI_DB_PATH = TEST_DB;
});

afterAll(() => {
	removeTestDb();
});

test("MCP stdio server: add and list feed", async () => {
	const transport = new StdioClientTransport({
		command: "bun",
		args: ["run", "src/index.ts", "mcp"],
		env: { ...process.env, RSS_WATCHER_CLI_DB_PATH: TEST_DB },
		stderr: "pipe",
	});
	const client = new Client({ name: "test-client", version: "1.0.0" }, { capabilities: {} });

	await client.connect(transport);

	// Add feed
	const addResult = await client.callTool({
		name: "add_feed",
		arguments: { url: "http://feeds.rssboard.org/rssboard" },
	});

	const addContent = addResult.content as Array<{ type: string; text: string }>;
	expect(addContent[0]?.type).toBe("text");
	expect(addContent[0]?.text).toContain("Added feed:");

	// List blogs
	const listResult = await client.callTool({
		name: "list_blogs",
		arguments: {},
	});

	const listContent = listResult.content as Array<{ type: string; text: string }>;
	expect(listContent[0]?.type).toBe("text");
	const listText = listContent[0]?.text;
	if (listText === undefined) {
		throw new Error("No content in list_blogs result");
	}
	const blogs = JSON.parse(listText);
	expect(blogs.length).toBe(1);
	expect(blogs[0].url).toBe("http://feeds.rssboard.org/rssboard");

	// Remove feed
	await client.callTool({
		name: "remove_feed",
		arguments: { nameOrUrl: "http://feeds.rssboard.org/rssboard" },
	});

	await client.close();
	expect(transport.stderr).not.toBeNull();
});
