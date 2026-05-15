---
name: rss-watcher-cli
description: Use when managing RSS or JSON feeds, pulling feed updates, listing or filtering articles, marking articles read or unread, or starting the rss-watcher-cli MCP server via npx.
---

# rss-watcher-cli

## Overview

`rss-watcher-cli` is an RSS/JSON feed reader with a command-line interface and MCP server. Use it through `npx rss-watcher-cli ...`.

## Core Workflow

Use `--db <path>` when the task needs an explicit database file or isolation between runs.

Common commands:

```bash
npx rss-watcher-cli add https://example.com/feed.xml
npx rss-watcher-cli pull
npx rss-watcher-cli articles
npx rss-watcher-cli articles --all
npx rss-watcher-cli articles --blog "blog-name"
npx rss-watcher-cli articles --since 2025-01-01
npx rss-watcher-cli articles --since 24h
npx rss-watcher-cli articles --limit 10
npx rss-watcher-cli read 42
npx rss-watcher-cli unread 42
npx rss-watcher-cli read-all
npx rss-watcher-cli blogs
npx rss-watcher-cli remove https://example.com/feed.xml
```

For MCP clients, start the server with:

```bash
npx rss-watcher-cli mcp
```

## Article Filters

- `--all`: include read articles.
- `--blog <name>`: restrict results to one blog/feed name.
- `--since <date>`: restrict by publication date. Accepts ISO-style dates and relative durations such as `24h`, `2d`, or `1w` when supported by the active npx package version.
- `--limit <number>`: return only the first N articles after filtering and sorting when supported by the active npx package version.

When uncertain which options the current npx package exposes, check command help first:

```bash
npx rss-watcher-cli articles --help
```

## Captured Help Output

Output of `npx rss-watcher-cli --help`:

```text
rss-watcher-cli/1.0.6

Usage:
  $ rss-watcher-cli <command> [options]

Commands:
  add <url>             Add a new feed
  remove <name-or-url>  Remove a feed
  pull                  Pull updates for all feeds
  read <id>             Mark an article as read
  unread <id>           Mark an article as unread
  read-all              Mark all articles as read
  blogs                 List all blogs
  articles              List articles
  mcp                   Start the MCP server

For more info, run any command with the `--help` flag:
  $ rss-watcher-cli add --help
  $ rss-watcher-cli remove --help
  $ rss-watcher-cli pull --help
  $ rss-watcher-cli read --help
  $ rss-watcher-cli unread --help
  $ rss-watcher-cli read-all --help
  $ rss-watcher-cli blogs --help
  $ rss-watcher-cli articles --help
  $ rss-watcher-cli mcp --help

Options:
  --db <path>    Set a custom database path 
  -h, --help     Display this message 
  -v, --version  Display version number 
```

