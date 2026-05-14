import { afterEach, expect, test } from "bun:test";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { getDbPath, parseLimit, parseSinceDate } from "../src/utils";

const dbPath = path.join(os.tmpdir(), `rss-watcher-cli-${process.pid}.sqlite`);

afterEach(() => {
	delete process.env.RSS_WATCHER_CLI_DB_PATH;
	if (fs.existsSync(dbPath)) {
		fs.unlinkSync(dbPath);
	}
});

test("uses RSS_WATCHER_CLI_DB_PATH for the database path", () => {
	process.env.RSS_WATCHER_CLI_DB_PATH = dbPath;

	expect(getDbPath()).toBe(dbPath);
});

test("parseSinceDate accepts ISO date strings", () => {
	expect(parseSinceDate("2025-01-01T12:30:00.000Z").toISOString()).toBe("2025-01-01T12:30:00.000Z");
});

test("parseSinceDate accepts relative hour durations", () => {
	const now = new Date("2025-01-02T12:00:00.000Z");

	expect(parseSinceDate("24h", now).toISOString()).toBe("2025-01-01T12:00:00.000Z");
});

test("parseSinceDate accepts relative day durations with whitespace", () => {
	const now = new Date("2025-01-15T00:00:00.000Z");

	expect(parseSinceDate(" 2 d ", now).toISOString()).toBe("2025-01-13T00:00:00.000Z");
});

test("parseSinceDate rejects invalid relative durations", () => {
	expect(() => parseSinceDate("soon")).toThrow("Invalid date or relative duration for --since");
});

test("parseLimit accepts positive integers", () => {
	expect(parseLimit("10")).toBe(10);
});

test("parseLimit rejects zero and non-integers", () => {
	expect(() => parseLimit("0")).toThrow("Invalid value for --limit");
	expect(() => parseLimit("1.5")).toThrow("Invalid value for --limit");
});
