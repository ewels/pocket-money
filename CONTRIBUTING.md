# Contributing to Pocket Money

Thanks for your interest in contributing to Pocket Money! We welcome contributions of all kinds — bug reports, feature requests, documentation improvements, and code contributions.

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) 20+
- [Cloudflare account](https://dash.cloudflare.com/sign-up) (free, no credit card needed)

### Development Setup

1. **Clone the repository**

   ```bash
   git clone https://github.com/ewels/pocket-money.git
   cd pocket-money
   npm install
   ```

2. **Configure environment**

   ```bash
   cp .dev.vars.example .dev.vars
   # Edit .dev.vars and set SESSION_SECRET to a random string
   ```

3. **Set up the database**

   ```bash
   npm run db:migrate
   ```

4. **Start the dev server**

   ```bash
   npm run dev
   ```

5. Open [http://localhost:5173](http://localhost:5173) and register a new account.

## Making Changes

### Code Style

The project uses automated tools to maintain consistent code style:

- **Prettier** for formatting
- **ESLint** for linting
- **TypeScript** for type checking

Git hooks run automatically after `npm install` to check your code before commits and pushes.

```bash
npm run format      # Auto-fix formatting
npm run lint        # Check for linting issues
npm run check       # Run type checking
```

### Running Tests

Tests use [Vitest](https://vitest.dev/):

```bash
npm run test        # Watch mode (re-runs on changes)
npm run test:run    # Run once
```

### Pull Requests

1. Fork the repository
2. Create a feature branch (`git checkout -b my-feature`)
3. Make your changes
4. Run `npm run lint` and `npm run test:run`
5. Commit your changes
6. Push to your fork and submit a pull request

CI will automatically run linting, type checking, tests, and build on your PR.

## Updating Screenshots

The documentation includes screenshots that need updating after UI changes.

1. Reset the local database:

   ```bash
   rm -rf .wrangler
   npm run db:migrate
   ```

2. Start the dev server: `npm run dev`

3. In another terminal: `npm run screenshots`

The script at `scripts/capture-screenshots.ts` automates capturing all screens. If the UI changes significantly, you may need to update the script selectors.

## Project Structure

| Path                  | Description                            |
| --------------------- | -------------------------------------- |
| `src/routes/`         | SvelteKit pages and API routes         |
| `src/lib/components/` | Reusable Svelte components             |
| `src/lib/server/`     | Server-side utilities (auth, database) |
| `migrations/`         | Database migrations                    |
| `docs/`               | Documentation site                     |

## Questions?

Feel free to [open an issue](https://github.com/ewels/pocket-money/issues) if you have questions or run into problems.

## License

By contributing, you agree that your contributions will be licensed under the [MIT License](LICENSE).
