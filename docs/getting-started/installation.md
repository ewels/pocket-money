# Installation

This guide covers setting up Pocket Money for local development.

## Prerequisites

- Node.js 18+

## Clone and Install

```bash
git clone https://github.com/ewels/pocket-money.git
cd pocket-money
npm install
```

## Configure Environment

Create the local secrets file:

```bash
cp .dev.vars.example .dev.vars
```

Edit `.dev.vars` and set a secure random string for `SESSION_SECRET`:

```
SESSION_SECRET=your-secure-random-string-here
```

You can generate a secure secret with:

```bash
openssl rand -base64 32
```

## Set Up Database

Copy the wrangler config template:

```bash
cp wrangler.toml.example wrangler.toml
```

For local development, you can use a placeholder database ID. The local D1 emulator creates a SQLite database in `.wrangler/` automatically:

```toml
[[d1_databases]]
binding = "DB"
database_name = "pocket-money-db"
database_id = "local-dev-placeholder"
```

!!! tip "No Cloudflare Account Required"
    Local development uses Wrangler's built-in D1 emulator, which stores data in a local SQLite database. You don't need a Cloudflare account until you're ready to deploy.

## Run Migrations

Apply the database schema locally:

```bash
npm run db:migrate
```

This runs migrations against your local SQLite database (not Cloudflare).

## Start Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:5173`.

## Next Steps

Ready to deploy? See the [Deployment Guide](deployment.md) for instructions on setting up Cloudflare Pages and creating a production D1 database.
