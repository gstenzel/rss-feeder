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

const SINCE_DURATION_PATTERN =
	/^(\d+(?:\.\d+)?)\s*(s|sec|secs|second|seconds|m|min|mins|minute|minutes|h|hr|hrs|hour|hours|d|day|days|w|week|weeks)$/i;

const UNIT_MS: Record<string, number> = {
	s: 1000,
	sec: 1000,
	secs: 1000,
	second: 1000,
	seconds: 1000,
	m: 60 * 1000,
	min: 60 * 1000,
	mins: 60 * 1000,
	minute: 60 * 1000,
	minutes: 60 * 1000,
	h: 60 * 60 * 1000,
	hr: 60 * 60 * 1000,
	hrs: 60 * 60 * 1000,
	hour: 60 * 60 * 1000,
	hours: 60 * 60 * 1000,
	d: 24 * 60 * 60 * 1000,
	day: 24 * 60 * 60 * 1000,
	days: 24 * 60 * 60 * 1000,
	w: 7 * 24 * 60 * 60 * 1000,
	week: 7 * 24 * 60 * 60 * 1000,
	weeks: 7 * 24 * 60 * 60 * 1000,
};

export function parseSinceDate(value: string, now = new Date()): Date {
	const trimmed = value.trim();
	const relativeMatch = trimmed.match(SINCE_DURATION_PATTERN);

	if (relativeMatch) {
		const [, amountValue, unitValue] = relativeMatch;
		const unitMilliseconds = unitValue ? UNIT_MS[unitValue.toLowerCase()] : undefined;
		const amount = amountValue ? Number.parseFloat(amountValue) : Number.NaN;
		const milliseconds = unitMilliseconds === undefined ? Number.NaN : amount * unitMilliseconds;
		if (amount > 0 && Number.isFinite(milliseconds)) {
			return new Date(now.getTime() - milliseconds);
		}
	}

	const date = new Date(trimmed);
	if (!Number.isNaN(date.getTime())) {
		return date;
	}

	throw new Error("Invalid date or relative duration for --since");
}
