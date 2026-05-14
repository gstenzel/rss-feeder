import * as crypto from "node:crypto";

const DEFAULT_TIMEOUT_MS = 15000;
const MAX_REDIRECTS = 5;
const MAX_RESPONSE_SIZE = 10 * 1024 * 1024; // 10MB

export async function fetchWithLimits(
	url: string,
	options: {
		etag?: string | null;
		lastModified?: string | null;
		timeoutMs?: number;
		maxRedirects?: number;
	} = {},
): Promise<{
	content: string | null;
	status: number;
	etag: string | null;
	lastModified: string | null;
}> {
	let currentUrl = url;
	let redirects = 0;
	const maxRedirects = options.maxRedirects ?? MAX_REDIRECTS;
	const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;

	while (true) {
		const headers = new Headers();
		headers.set("User-Agent", "rss-feeder/1.0");

		if (options.etag) {
			headers.set("If-None-Match", options.etag);
		}
		if (options.lastModified) {
			headers.set("If-Modified-Since", options.lastModified);
		}

		const controller = new AbortController();
		const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

		try {
			const response = await fetch(currentUrl, {
				headers,
				redirect: "manual",
				signal: controller.signal,
			});
			clearTimeout(timeoutId);

			if (response.status === 301 || response.status === 302 || response.status === 307 || response.status === 308) {
				const location = response.headers.get("location");
				if (!location) {
					throw new Error("Redirect without location header");
				}
				redirects++;
				if (redirects > maxRedirects) {
					throw new Error(`Too many redirects (${maxRedirects})`);
				}
				currentUrl = new URL(location, currentUrl).toString();
				continue;
			}

			if (response.status === 304) {
				return {
					content: null,
					status: response.status,
					etag: response.headers.get("etag"),
					lastModified: response.headers.get("last-modified"),
				};
			}

			if (!response.ok) {
				throw new Error(`HTTP ${response.status} ${response.statusText}`);
			}

			// Read response body with size limit
			const contentLengthHeader = response.headers.get("content-length");
			if (contentLengthHeader) {
				const size = Number.parseInt(contentLengthHeader, 10);
				if (size > MAX_RESPONSE_SIZE) {
					throw new Error(`Response size (${size} bytes) exceeds limit (${MAX_RESPONSE_SIZE} bytes)`);
				}
			}

			const buffer = await response.arrayBuffer();
			if (buffer.byteLength > MAX_RESPONSE_SIZE) {
				throw new Error(`Response size (${buffer.byteLength} bytes) exceeds limit (${MAX_RESPONSE_SIZE} bytes)`);
			}

			const content = new TextDecoder().decode(buffer);
			return {
				content,
				status: response.status,
				etag: response.headers.get("etag"),
				lastModified: response.headers.get("last-modified"),
			};
		} catch (error) {
			clearTimeout(timeoutId);
			throw error;
		}
	}
}

export function generateStableHash(feedUrl: string, itemUrl: string, itemGuid: string): string {
	const content = `${feedUrl}|${itemUrl}|${itemGuid}`;
	return crypto.createHash("sha256").update(content).digest("hex");
}
