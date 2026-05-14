import { afterAll, beforeAll, expect, test } from "bun:test";
import * as fs from "node:fs";
import { spawnSync } from "bun";

const TEST_DB = "./test-e2e.sqlite";
const TEST_FRESH_DB = "./test-fresh.sqlite";

beforeAll(() => {
	// Push schema to the test DB
	const push = spawnSync(["bunx", "drizzle-kit", "push"], {
		env: { ...process.env, RSS_WATCHER_CLI_DB_PATH: TEST_DB },
	});
	if (push.exitCode !== 0) {
		console.error(push.stderr?.toString());
		throw new Error("Failed to push schema");
	}
});

afterAll(() => {
	if (fs.existsSync(TEST_DB)) {
		fs.unlinkSync(TEST_DB);
	}
	if (fs.existsSync(`${TEST_DB}-shm`)) {
		fs.unlinkSync(`${TEST_DB}-shm`);
	}
	if (fs.existsSync(`${TEST_DB}-wal`)) {
		fs.unlinkSync(`${TEST_DB}-wal`);
	}
	if (fs.existsSync(TEST_FRESH_DB)) {
		fs.unlinkSync(TEST_FRESH_DB);
	}
	if (fs.existsSync(`${TEST_FRESH_DB}-shm`)) {
		fs.unlinkSync(`${TEST_FRESH_DB}-shm`);
	}
	if (fs.existsSync(`${TEST_FRESH_DB}-wal`)) {
		fs.unlinkSync(`${TEST_FRESH_DB}-wal`);
	}
});

function runCli(args: string[]) {
	const result = spawnSync(["bun", "run", "src/index.ts", "--db", TEST_DB, ...args]);
	return {
		exitCode: result.exitCode,
		stdout: result.stdout?.toString() || "",
		stderr: result.stderr?.toString() || "",
	};
}

test("Add feed", () => {
	const result = runCli(["add", "http://feeds.rssboard.org/rssboard"]);
	expect(result.exitCode).toBe(0);
	expect(result.stdout).toContain("Added feed: ");
});

test("Pull feed updates", () => {
	const result = runCli(["pull"]);
	expect(result.exitCode).toBe(0);
	expect(result.stdout).toContain("Success: 1");
	expect(result.stdout).toContain("Failed: 0");
});

test("List articles", () => {
	const result = runCli(["articles"]);
	expect(result.exitCode).toBe(0);
	expect(result.stdout).not.toContain("No articles found");
});

test("Remove feed", () => {
	const result = runCli(["remove", "http://feeds.rssboard.org/rssboard"]);
	expect(result.exitCode).toBe(0);
	expect(result.stdout).toContain("Removed feed: ");
});

test("No arguments shows help", () => {
	const result = runCli([]);
	expect(result.exitCode).toBe(0);
	expect(result.stdout).toContain("Usage:");
	expect(result.stdout).toContain("Commands:");
	expect(result.stdout).toContain("rss-watcher-cli");
});

test("initializes a fresh database before running commands", () => {
	if (fs.existsSync(TEST_FRESH_DB)) {
		fs.unlinkSync(TEST_FRESH_DB);
	}

	const result = spawnSync(["bun", "run", "src/index.ts", "--db", TEST_FRESH_DB, "blogs"]);
	expect(result.exitCode).toBe(0);
	expect(result.stdout?.toString() || "").toContain("No blogs found");
});
