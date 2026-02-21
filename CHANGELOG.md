# Changelog

## [v1.2.0](https://github.com/ewels/pocket-money/releases/tag/v1.2.0) - 2026-02-21

### New Features

- **Advance payments**: Children can now receive pocket money early with an "Advance" button on their profile. The advance amount is recorded as a deduction against future payments.
- **Balance History chart modes**: The chart now has two display modes:
  - _Events mode_ (default): Shows the last N transactions (5 / 15 / 50 / All), making it easy to see recent activity regardless of time span.
  - _Time mode_: Shows balance over a fixed time window (1W / 1M / 6M / All).

### Improvements

- Straight lines with data point markers in the balance history chart for clearer trend reading.
- Footer added to all pages, with a link to the documentation site in the nav bar.
- Children management moved into the Settings page for a cleaner layout.
- Settings page layout and styling refined.
- Simplified children list display in settings.

### Fixes

- `db:migrate` now runs all migration files, not just the first one.

---

## [v1.1.2](https://github.com/ewels/pocket-money/releases/tag/v1.1.2) - 2026-01-18

### Documentation and Repository Improvements

- Redesign README with header image and improved styling
- Emphasize free tier deployment (no credit card required)
- Fix documentation URLs to use correct GitHub Pages path
- Rewrite CONTRIBUTING.md to be more welcoming
- Fix broken webhook documentation link in settings page
- Add MIT license file

---

## [v1.1.0](https://github.com/ewels/pocket-money/releases/tag/v1.1.0) - 2026-01-18

### Features

- **Recurring payments improvements**: Add day selection for daily/weekly/monthly payments, ability to edit existing payments, and a new deductions system replacing skip-next functionality
- **Upcoming payments display**: Child pages now show upcoming scheduled payments
- **Time-to-target estimates**: Saving goals now show estimated completion dates based on recurring income
- **Enhanced saving targets**: Stacking, reordering, rich fields, and inline target creation
- **User-specific PIN protection**: PIN settings moved from family-level to per-user
- **Balance history date ranges**: Quick selector buttons for chart date ranges
- **Profile management**: Add email and password change to profile page
- **Webhook support**: Event notifications with HMAC-SHA256 signature verification
- **Image management**: Option to delete uploaded images without replacing

### Improvements

- App icon added to navigation with iOS-friendly icon
- Social share card for link previews
- Simplified saving target layout with inline progress info
- Format SEK and other zero-decimal currencies without decimals

### Bug Fixes

- Fix saving targets mobile overflow styling
- Fix saving target reorder persistence
- Fix logout not working due to redirect in hooks

### DevOps

- GitHub Actions workflow for Cloudflare deployment
- Automatic database migrations in deploy workflow

### Documentation

- Updated screenshots for new features
- Admin operations documentation for password reset
- Deployment docs updated with D1 API token permissions

---

## [v1.0.1](https://github.com/ewels/pocket-money/releases/tag/v1.0.1) - 2026-01-18

### Testing & CI

- Added Vitest for unit testing (28 tests covering currencies, auth, and database utilities)
- Added GitHub Actions CI workflow (lint, typecheck, test, build)
- Added Husky pre-commit hook (Prettier + ESLint on staged files)
- Added Husky pre-push hook (full CI suite runs locally before push)

### Code Quality

- Added Prettier for consistent code formatting
- Added ESLint with TypeScript and Svelte 5 support
- Formatted entire codebase with Prettier

### Documentation

- Updated CLAUDE.md and CONTRIBUTING.md with testing and CI info

---

## [v1.0.0](https://github.com/ewels/pocket-money/releases/tag/v1.0.0) - 2026-01-17

Initial release of Pocket Money - a family pocket money tracking PWA built with SvelteKit and Cloudflare.

### Features

- **Family System** - Invite family members to share access to children's accounts
- **Multi-Child Support** - Track pocket money for multiple children with individual profiles
- **Saving Targets** - Visual progress tracking toward savings goals
- **Recurring Payments** - Automatic allowance deposits (daily, weekly, bi-weekly, monthly)
- **Transaction History** - See who made each deposit or withdrawal
- **PIN Protection** - Optional security for shared devices
- **Multi-Currency** - Support for 12 currencies (EUR, GBP, USD, SEK, NOK, DKK, CHF, AUD, CAD, JPY, PLN, CZK)
- **Mobile-Friendly** - Progressive Web App works great on phones
