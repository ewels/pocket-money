<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="docs/assets/header.svg">
    <source media="(prefers-color-scheme: light)" srcset="docs/assets/header.svg">
    <img alt="Pocket Money" src="docs/assets/header.svg" width="500">
  </picture>
</p>

<p align="center">
  <em>A family-friendly pocket money tracker with saving goals and recurring allowances.<br>
  Designed for Cloudflare's free tier — no credit card required.</em>
</p>

<p align="center">
  <a href="https://ewels.github.io/pocket-money/">Documentation</a> •
  <a href="#-quick-start">Quick Start</a>
</p>

---

![Child Profile Screenshot](docs/assets/screenshots/child-profile-featured.png)

## ✨ Features

- **👨‍👩‍👧‍👦 Family Sharing** — Invite family members to share access to children's accounts
- **🎯 Saving Targets** — Visual progress tracking toward savings goals with time estimates
- **🔄 Recurring Payments** — Automatic allowance deposits on any schedule (daily, weekly, monthly)
- **📊 Balance History** — Beautiful charts showing balance over time
- **📝 Transaction History** — See who made each deposit or withdrawal
- **🔐 PIN Protection** — Optional security for shared devices
- **💱 Multi-Currency** — Support for 12 currencies
- **📱 Mobile-Friendly** — Progressive Web App that works great on phones

## 🚀 Quick Start

### Prerequisites

- [Node.js](https://nodejs.org/) 20+
- [Cloudflare account](https://dash.cloudflare.com/sign-up) (free, no credit card needed)

### Local Development

```bash
# Clone and install
git clone https://github.com/ewels/pocket-money.git
cd pocket-money
npm install

# Configure environment
cp .dev.vars.example .dev.vars
# Edit .dev.vars and set SESSION_SECRET to a random string

# Set up database
npm run db:migrate

# Start dev server
npm run dev
```

Then open [http://localhost:5173](http://localhost:5173) and register a new account.

### Production Deployment

See the [Installation Guide](https://ewels.github.io/pocket-money/getting-started/installation/) for full deployment instructions.

## 🛠️ Tech Stack

| Component | Technology                                                      |
| --------- | --------------------------------------------------------------- |
| Framework | [SvelteKit 5](https://svelte.dev/) with runes                   |
| Database  | [Cloudflare D1](https://developers.cloudflare.com/d1/) (SQLite) |
| Hosting   | [Cloudflare Pages](https://pages.cloudflare.com/)               |
| Styling   | [Tailwind CSS 4](https://tailwindcss.com/)                      |
| Charts    | [Chart.js](https://www.chartjs.org/)                            |

## 💰 100% Free Hosting

Pocket Money runs entirely on Cloudflare's free tier — **no credit card required** to deploy:

| Service   | Free Allowance                       |
| --------- | ------------------------------------ |
| **Pages** | Unlimited requests, 500 builds/month |
| **D1**    | 5M reads/day, 100K writes/day        |

More than enough for family use!

## 📖 Documentation

Full documentation is available at **[ewels.github.io/pocket-money](https://ewels.github.io/pocket-money/)**

- [Installation & Deployment](https://ewels.github.io/pocket-money/getting-started/installation/)
- [User Guide](https://ewels.github.io/pocket-money/guide/)

## 🤝 Contributing

Contributions are welcome! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for details.

## 📄 License

MIT License — free to use, modify, and distribute.
