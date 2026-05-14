# rss-feeder

A fast, TypeScript-native RSS/JSON feed reader with a built-in [MCP](https://modelcontextprotocol.io/) server. Built on [Bun](https://bun.sh/) and SQLite.

## Why rss-feeder over blogwatcher-cli?

|                          | rss-feeder                                                                           | blogwatcher-cli |
| ------------------------ | ------------------------------------------------------------------------------------ | --------------- |
| **Runtime**              | Bun (fast, single binary)                                                            | Go              |
| **MCP server**           | ✅ Built-in (`mcp` command)                                                          | ❌              |
| **AI-agent integration** | Tools for adding feeds, pulling articles, marking read/unread — all callable by LLMs | None            |
| **Transport**            | Streamable HTTP (Web Standards)                                                      | N/A             |
| **Feed formats**         | RSS & JSON Feed                                                                      | RSS             |
| **HTML sanitization**    | Strips tags & limits content length automatically                                    | Raw HTML        |

The headline feature is the **MCP server**: run `rss-feeder mcp` and any MCP-compatible client (Claude Desktop, Cursor, custom agents) can manage your feeds and read articles programmatically.

## Installation

```bash
bun install
```

## Usage

```
$ rss-feeder <command> [options]
```

### Managing feeds

```bash
# Add a feed
rss-feeder add https://example.com/feed.xml
rss-feeder add https://example.com/feed.xml --name "My Blog"

# Remove a feed by name or URL
rss-feeder remove "My Blog"
rss-feeder remove https://example.com/feed.xml

# List all tracked blogs
rss-feeder blogs
```

### Reading articles

```bash
# Pull new articles from all feeds
rss-feeder pull

# List unread articles
rss-feeder articles

# List all articles (including read)
rss-feeder articles --all

# Filter by blog name or date
rss-feeder articles --blog "My Blog"
rss-feeder articles --since 2025-01-01

# Mark articles as read/unread
rss-feeder read 42
rss-feeder unread 42
rss-feeder read-all
```

### MCP server

```bash
# Start the MCP server (default port 3000)
rss-feeder mcp

# Custom port
rss-feeder mcp --port 8080
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
