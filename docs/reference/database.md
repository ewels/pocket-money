# Database Schema

Pocket Money uses Cloudflare D1, a SQLite-based database.

## Entity Relationships

```mermaid
erDiagram
    families ||--o{ users : has
    families ||--o{ children : has
    families ||--|| settings : has
    families ||--o{ invite_codes : has

    children ||--o{ saving_targets : has
    children ||--o{ recurring_rules : has
    children ||--o{ transactions : has

    users ||--o{ transactions : creates
    users ||--o{ sessions : has
```

## Tables

### families

Core family unit that groups users and children.

| Column       | Type    | Description        |
| ------------ | ------- | ------------------ |
| `id`         | TEXT    | Primary key (UUID) |
| `name`       | TEXT    | Family name        |
| `created_at` | INTEGER | Unix timestamp     |

### users

Registered user accounts.

| Column          | Type    | Description                     |
| --------------- | ------- | ------------------------------- |
| `id`            | TEXT    | Primary key (UUID)              |
| `email`         | TEXT    | Unique email address            |
| `password_hash` | TEXT    | bcrypt hash                     |
| `name`          | TEXT    | Display name                    |
| `photo_url`     | TEXT    | External photo URL (nullable)   |
| `photo_data`    | TEXT    | Base64 encoded image (nullable) |
| `family_id`     | TEXT    | Foreign key → families          |
| `created_at`    | INTEGER | Unix timestamp                  |

### invite_codes

Codes for inviting users to join a family.

| Column       | Type    | Description                           |
| ------------ | ------- | ------------------------------------- |
| `id`         | TEXT    | Primary key (UUID)                    |
| `code`       | TEXT    | Unique 8-char alphanumeric code       |
| `family_id`  | TEXT    | Foreign key → families                |
| `created_by` | TEXT    | Foreign key → users                   |
| `expires_at` | INTEGER | Unix timestamp (7 days from creation) |
| `used_by`    | TEXT    | Foreign key → users (nullable)        |
| `used_at`    | INTEGER | Unix timestamp (nullable)             |
| `created_at` | INTEGER | Unix timestamp                        |

### settings

Per-family application settings.

| Column                | Type    | Default | Description                 |
| --------------------- | ------- | ------- | --------------------------- |
| `id`                  | INTEGER | Auto    | Primary key                 |
| `family_id`           | TEXT    |         | Foreign key → families      |
| `currency`            | TEXT    | 'EUR'   | Display currency code       |
| `pin_enabled`         | INTEGER | 0       | PIN protection enabled      |
| `pin_hash`            | TEXT    | NULL    | bcrypt hash of PIN          |
| `pin_timeout_minutes` | INTEGER | 1       | Minutes before PIN required |
| `webhook_url`         | TEXT    | NULL    | URL for event notifications |

### children

Child profiles.

| Column       | Type    | Description                     |
| ------------ | ------- | ------------------------------- |
| `id`         | TEXT    | Primary key (UUID)              |
| `name`       | TEXT    | Display name                    |
| `color`      | TEXT    | Profile color                   |
| `photo_url`  | TEXT    | External photo URL (nullable)   |
| `photo_data` | TEXT    | Base64 encoded image (nullable) |
| `family_id`  | TEXT    | Foreign key → families          |
| `sort_order` | INTEGER | Display order                   |
| `created_at` | INTEGER | Unix timestamp                  |

### saving_targets

Savings goals for children.

| Column          | Type    | Description            |
| --------------- | ------- | ---------------------- |
| `id`            | TEXT    | Primary key (UUID)     |
| `child_id`      | TEXT    | Foreign key → children |
| `name`          | TEXT    | Target name            |
| `target_amount` | REAL    | Goal amount            |
| `sort_order`    | INTEGER | Display order          |
| `created_at`    | INTEGER | Unix timestamp         |

### recurring_rules

Automatic payment rules.

| Column          | Type    | Description                    |
| --------------- | ------- | ------------------------------ |
| `id`            | TEXT    | Primary key (UUID)             |
| `child_id`      | TEXT    | Foreign key → children         |
| `amount`        | REAL    | Payment amount                 |
| `description`   | TEXT    | Optional description           |
| `interval_days` | INTEGER | Days between payments          |
| `next_run_at`   | INTEGER | Unix timestamp of next payment |
| `skip_next`     | INTEGER | Skip next payment flag (0/1)   |
| `active`        | INTEGER | Rule is active (0/1)           |
| `created_at`    | INTEGER | Unix timestamp                 |

### transactions

All money movements.

| Column              | Type    | Description                                  |
| ------------------- | ------- | -------------------------------------------- |
| `id`                | TEXT    | Primary key (UUID)                           |
| `child_id`          | TEXT    | Foreign key → children                       |
| `user_id`           | TEXT    | Foreign key → users (nullable for recurring) |
| `amount`            | REAL    | Positive=deposit, negative=withdrawal        |
| `description`       | TEXT    | Optional description                         |
| `is_recurring`      | INTEGER | Created by recurring rule (0/1)              |
| `recurring_rule_id` | TEXT    | Foreign key → recurring_rules (nullable)     |
| `created_at`        | INTEGER | Unix timestamp                               |

### sessions

User authentication sessions.

| Column            | Type    | Description               |
| ----------------- | ------- | ------------------------- |
| `id`              | TEXT    | Primary key (UUID)        |
| `user_id`         | TEXT    | Foreign key → users       |
| `pin_verified_at` | INTEGER | Unix timestamp (nullable) |
| `expires_at`      | INTEGER | Unix timestamp            |
| `created_at`      | INTEGER | Unix timestamp            |

## Migrations

Migrations are stored in `migrations/` and run in order:

| File                  | Description           |
| --------------------- | --------------------- |
| `0001_initial.sql`    | Core tables           |
| `0002_photo_data.sql` | Photo storage columns |
| `0003_families.sql`   | Family system tables  |
| `0004_webhooks.sql`   | Webhook URL setting   |

### Running Migrations

Local:

```bash
npm run db:migrate
```

Production:

```bash
wrangler d1 execute pocket-money-db --remote --file=./migrations/0001_initial.sql
wrangler d1 execute pocket-money-db --remote --file=./migrations/0002_photo_data.sql
wrangler d1 execute pocket-money-db --remote --file=./migrations/0003_families.sql
```

## Admin Operations

### Resetting a User's Password

If a user forgets their password and cannot use the in-app password change feature, you can reset it directly via Cloudflare D1.

#### Step 1: Generate a bcrypt hash

Passwords are hashed using bcrypt with 12 rounds. Generate a hash for the new password using one of these methods:

**Using Node.js:**

```bash
node -e "const bcrypt = require('bcryptjs'); bcrypt.hash('newpassword123', 12).then(console.log)"
```

**Using an online bcrypt generator:**

Use a tool like [bcrypt-generator.com](https://bcrypt-generator.com/) with 12 rounds.

!!! warning
    When using online tools, ensure you trust the site and consider that you're entering a password that will be used.

#### Step 2: Find the user's ID

Using the Cloudflare dashboard or wrangler CLI:

```bash
wrangler d1 execute pocket-money-db --remote --command "SELECT id, email, name FROM users WHERE email = 'user@example.com'"
```

#### Step 3: Update the password

Replace `USER_ID` with the user's ID and `BCRYPT_HASH` with the generated hash:

```bash
wrangler d1 execute pocket-money-db --remote --command "UPDATE users SET password_hash = '\$2a\$12\$...' WHERE id = 'USER_ID'"
```

!!! note
    The `$` characters in bcrypt hashes need to be escaped as `\$` when using the command line.

Alternatively, you can run the update directly from the [Cloudflare D1 console](https://dash.cloudflare.com/) in your browser, where escaping is not needed.

### Changing a User's Email

```bash
wrangler d1 execute pocket-money-db --remote --command "UPDATE users SET email = 'newemail@example.com' WHERE id = 'USER_ID'"
```

### Listing All Users

```bash
wrangler d1 execute pocket-money-db --remote --command "SELECT id, email, name, family_id FROM users"
```

### Listing All Families

```bash
wrangler d1 execute pocket-money-db --remote --command "SELECT f.id, f.name, COUNT(u.id) as member_count FROM families f LEFT JOIN users u ON u.family_id = f.id GROUP BY f.id"
```
