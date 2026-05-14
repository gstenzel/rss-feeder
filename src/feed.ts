import Parser from "rss-parser";

/** Maximum characters kept for any text field sourced from a feed. */
const MAX_TEXT_LENGTH = 5_000;

function sanitizeText(raw: string | null | undefined): string | null {
	if (!raw) return null;

	let text = raw.replace(
		/<(script|style|noscript|figure|figcaption|picture|svg|video|audio|iframe|object|embed|table|form)\b[^>]*>[\s\S]*?<\/\1>/gi,
		" ",
	);

	text = text.replace(/<[^>]*>/g, " ");

	text = text
		.replace(/&nbsp;/gi, " ")
		.replace(/&amp;/gi, "&")
		.replace(/&lt;/gi, "<")
		.replace(/&gt;/gi, ">")
		.replace(/&quot;/gi, '"')
		.replace(/&#39;/gi, "'")
		.replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
		.replace(/&#([0-9]+);/gi, (_, dec) => String.fromCodePoint(Number(dec)));

	text = text.replace(/\s+/g, " ").trim();

	if (text.length > MAX_TEXT_LENGTH) {
		text = text.slice(0, MAX_TEXT_LENGTH);
	}

	return text || null;
}

export interface ParsedFeed {
	title: string;
	siteUrl: string | null;
	items: ParsedArticle[];
}

export interface ParsedArticle {
	guid: string;
	title: string;
	url: string | null;
	author: string | null;
	summary: string | null;
	content: string | null;
	publishedAt: Date | null;
}

const parser = new Parser({
	customFields: {
		item: ["summary", "content:encoded"],
	},
});

export async function parseFeed(content: string): Promise<ParsedFeed> {
	// Try parsing as JSON Feed first if it starts with {
	if (content.trim().startsWith("{")) {
		try {
			const jsonFeed = JSON.parse(content);
			if (jsonFeed.version?.includes("https://jsonfeed.org/version/")) {
				return parseJsonFeed(jsonFeed as JsonFeed);
			}
		} catch (_e) {
			// Ignore JSON parse errors and fallback to RSS parser
		}
	}

	// Parse using rss-parser (handles RSS and Atom)
	const parsed = await parser.parseString(content);

	return {
		title: sanitizeText(parsed.title) || "Untitled Feed",
		siteUrl: parsed.link || null,
		items: (parsed.items || []).map((item) => {
			let publishedAt: Date | null = null;
			if (item.isoDate) {
				publishedAt = new Date(item.isoDate);
			} else if (item.pubDate) {
				publishedAt = new Date(item.pubDate);
			}

			// Ensure valid date
			if (publishedAt && Number.isNaN(publishedAt.getTime())) {
				publishedAt = null;
			}

			// Some feeds use 'id' instead of 'guid' for Atom
			const itemObj = item as { id?: string | number; author?: string | number };
			const guid = item.guid || itemObj.id?.toString() || item.link || "no-guid";
			const author = item.creator || itemObj.author?.toString() || null;

			return {
				guid,
				title: sanitizeText(item.title) || "Untitled Article",
				url: item.link || null,
				author: sanitizeText(author),
				summary: sanitizeText(item.summary || item.contentSnippet),
				content: sanitizeText(item["content:encoded"] || item.content),
				publishedAt,
			};
		}),
	};
}

interface JsonFeed {
	title?: string;
	home_page_url?: string;
	items?: JsonFeedItem[];
}

interface JsonFeedItem {
	id?: string | number;
	url?: string;
	title?: string;
	date_published?: string;
	author?: { name?: string };
	authors?: { name?: string }[];
	summary?: string;
	content_html?: string;
	content_text?: string;
}

function parseJsonFeed(feed: JsonFeed): ParsedFeed {
	const items = Array.isArray(feed.items) ? feed.items : [];

	return {
		title: sanitizeText(feed.title) || "Untitled JSON Feed",
		siteUrl: feed.home_page_url || null,
		items: items.map((item) => {
			let publishedAt: Date | null = null;
			if (item.date_published) {
				publishedAt = new Date(item.date_published);
			}

			if (publishedAt && Number.isNaN(publishedAt.getTime())) {
				publishedAt = null;
			}

			const author = item.author?.name || item.authors?.[0]?.name || null;

			return {
				guid: item.id?.toString() || item.url || "no-guid",
				title: sanitizeText(item.title) || "Untitled Article",
				url: item.url || null,
				author: sanitizeText(author),
				summary: sanitizeText(item.summary),
				content: sanitizeText(item.content_html || item.content_text),
				publishedAt,
			};
		}),
	};
}
