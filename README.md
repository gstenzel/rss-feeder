# rss-watcher-cli

A fast, TypeScript-native RSS/JSON feed reader with a built-in [MCP](https://modelcontextprotocol.io/) server. Built on [Bun](https://bun.sh/) and SQLite.

## Why rss-watcher-cli over blogwatcher-cli?

|                          | rss-watcher-cli                                                                      | blogwatcher-cli |
| ------------------------ | ------------------------------------------------------------------------------------ | --------------- |
| **Runtime**              | Bun (fast, single binary)                                                            | Go              |
| **MCP server**           | ✅ Built-in (`mcp` command)                                                          | ❌              |
| **AI-agent integration** | Tools for adding feeds, pulling articles, marking read/unread — all callable by LLMs | None            |
| **Transport**            | stdio                                                                                | N/A             |
| **Feed formats**         | RSS & JSON Feed                                                                      | RSS             |
| **HTML sanitization**    | Strips tags & limits content length automatically                                    | Raw HTML        |

The headline feature is the **MCP server**: run `rss-watcher-cli mcp` and any MCP-compatible client (Claude Desktop, Cursor, custom agents) can manage your feeds and read articles programmatically.

## Installation

```bash
bun install
```

## Usage

```
$ rss-watcher-cli <command> [options]
```

### Managing feeds

```bash
# Add a feed
rss-watcher-cli add https://example.com/feed.xml
rss-watcher-cli add https://example.com/feed.xml --name "My Blog"

# Remove a feed by name or URL
rss-watcher-cli remove "My Blog"
rss-watcher-cli remove https://example.com/feed.xml

# List all tracked blogs
rss-watcher-cli blogs
```

### Reading articles

```bash
# Pull new articles from all feeds
rss-watcher-cli pull

# List unread articles
rss-watcher-cli articles

# List all articles (including read)
rss-watcher-cli articles --all

# Filter by blog name or date
rss-watcher-cli articles --blog "My Blog"
rss-watcher-cli articles --since 2025-01-01
rss-watcher-cli articles --since 24h
rss-watcher-cli articles --limit 10

# Mark articles as read/unread
rss-watcher-cli read 42
rss-watcher-cli unread 42
rss-watcher-cli read-all
```

### MCP server

```bash
# Start the MCP server over stdio
rss-watcher-cli mcp
```

The MCP server exposes these tools to AI agents:

| Tool            | Description                           |
| --------------- | ------------------------------------- |
| `add_feed`      | Add a new RSS or JSON feed            |
| `remove_feed`   | Remove a feed by name or URL          |
| `pull_feeds`    | Pull updates for all feeds            |
| `list_blogs`    | List all tracked blogs                |
| `list_articles` | List articles (with optional filters) |
| `mark_read`     | Mark an article as read               |
| `mark_unread`   | Mark an article as unread             |
| `mark_all_read` | Mark all articles as read             |

### Global options

```
--db <path>    Set a custom database path
-h, --help     Display help
-v, --version  Display version number
```

## Development

```bash
# Run the CLI
bun run cli

# Start the MCP server
bun run mcp

# Lint, format, and type-check
bun run check

# Generate database migrations
bun run db:generate
```
