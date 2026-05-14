import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";

export function getDbPath(customPath?: string): string {
	const dbPath = customPath || process.env.RSS_WATCHER_CLI_DB_PATH || "~/.rss-watcher-cli/db.sqlite";
	const resolvedDbPath = dbPath.replace("~", os.homedir());
	if (!fs.existsSync(resolvedDbPath)) {
		console.warn(`Database path ${resolvedDbPath} does not exist, creating it`);
		fs.mkdirSync(path.dirname(resolvedDbPath), { recursive: true });
		fs.writeFileSync(resolvedDbPath, "");
	}

	return resolvedDbPath;
}

export function getDbUrl(customPath?: string): string {
	const dbPath = getDbPath(customPath);
	return `file:${dbPath}`;
}
