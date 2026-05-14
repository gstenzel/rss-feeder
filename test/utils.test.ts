import { afterEach, expect, test } from "bun:test";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { getDbPath } from "../src/utils";

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
