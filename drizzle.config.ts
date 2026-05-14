import { defineConfig } from "drizzle-kit";
import { getDbUrl } from "./src/utils";

export default defineConfig({
	out: "./src/drizzle",
	schema: "./src/schema.ts",
	dialect: "sqlite",
	dbCredentials: {
		url: getDbUrl(),
	},
});
