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

// Enable WAL mode for better concurrency
db.run("PRAGMA journal_mode = WAL;");
db.run("PRAGMA synchronous = NORMAL;");
