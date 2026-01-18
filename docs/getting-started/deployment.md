# Deployment

This guide covers deploying Pocket Money to Cloudflare Pages.

## Prerequisites

Complete the [Installation](installation.md) steps first.

## Create Production Database

If you haven't already, copy the config template and create a database:

```bash
cp wrangler.toml.example wrangler.toml
wrangler d1 create pocket-money-db
```

Update `wrangler.toml` with the database ID from the command output.

## Set Production Secrets

```bash
wrangler secret put SESSION_SECRET
```

Enter a secure random string when prompted.

## Run Production Migrations

```bash
npm run db:migrate:prod
```

## Deploy

### Manual Deployment

```bash
npm run build
wrangler pages deploy .svelte-kit/cloudflare
```

Your app will be available at a `*.pages.dev` URL.

### Automatic Deployment with GitHub Actions

The repository includes a GitHub Actions workflow that automatically deploys to Cloudflare Pages when you push to the `main` branch. This ensures the deployed version always matches the code on GitHub.

#### Required Secrets

Set up the following secrets in your GitHub repository (**Settings** → **Secrets and variables** → **Actions**):

| Secret                   | Description                                                                                          |
| ------------------------ | ---------------------------------------------------------------------------------------------------- |
| `CLOUDFLARE_API_TOKEN`   | API token with **Cloudflare Pages: Edit** and **D1: Edit** permissions. See below for setup instructions. |
| `CLOUDFLARE_ACCOUNT_ID`  | Your Cloudflare account ID. Find it on any Cloudflare dashboard page in the right sidebar.          |

#### Creating the API Token

1. Go to [Cloudflare Dashboard → API Tokens](https://dash.cloudflare.com/profile/api-tokens)
2. Click **Create Token**
3. Click **Create Custom Token**
4. Give the token a name (e.g., "Pocket Money Deploy")
5. Add the following **Permissions**:
   - **Account** | **Cloudflare Pages** | **Edit**
   - **Account** | **D1** | **Edit** (required for database migrations)
6. Under **Account Resources**, select your account
7. Under **Zone Resources**, select "All zones" or your specific zone (if using a custom domain)
8. Click **Continue to summary** → **Create Token**
9. Copy the token immediately (it won't be shown again)

!!! warning "D1 Permission Required"
    The **D1 Edit** permission is required for the deployment workflow to run database migrations automatically. Without this permission, migrations will fail silently and new database schema changes won't be applied.


#### How It Works

1. On every push to `main`, the CI workflow runs (lint, type check, tests, build)
2. If all checks pass, the deploy workflow:
   - Builds the app
   - Runs any pending database migrations
   - Deploys to Cloudflare Pages
3. The deployment URL will be shown in the Actions log

## Set Up Recurring Payments

The app has an endpoint `/api/cron` that processes recurring payments. You need to call this endpoint daily for allowances to be deposited automatically.

### Option A: GitHub Actions (Recommended)

If you've forked this repo to GitHub, you can use the included GitHub Action:

1. Go to your repository on GitHub
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Name: `CRON_URL`
5. Value: `https://your-app.pages.dev/api/cron`
6. Click **Add secret**

The workflow runs daily at 6:00 AM UTC. You can also trigger it manually from the **Actions** tab.

### Option B: External Cron Service

Use a free service like [cron-job.org](https://cron-job.org) to call your endpoint daily:

```
GET https://your-app.pages.dev/api/cron
```

### Option C: Manual

Visit `/api/cron` in your browser when you want to process recurring payments.

## Custom Domain

To use a custom domain:

1. Go to Cloudflare Dashboard → Pages → your project
2. Click **Custom domains**
3. Add your domain and follow the DNS setup instructions

## Troubleshooting

### "Database not available" errors

Ensure your `wrangler.toml` has the correct database ID and the database has been created.

### Migrations fail

Check that you're running the correct migration command (local vs production). Run migrations with `--remote` flag for production:

```bash
wrangler d1 execute pocket-money-db --remote --file=./migrations/0001_initial.sql
```

### Login issues

Clear your browser cookies for the app domain and try again.
