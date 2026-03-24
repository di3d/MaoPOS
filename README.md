# MaoPOS

A modern point-of-sale system built for PC shops and retail stores. Manage products, customers, sales, quotations, and PC builds from a single dashboard.

## Features

- **Dashboard** — Overview of products, customers, sales, low stock alerts, and quick actions
- **New Sale** — POS interface with product search, cart, discounts, and cash/card/transfer payment
- **Quotations** — Create and manage customer quotes, convert to sales
- **PC Builder** — Build custom PC configurations from your inventory
- **Products** — Full product catalog with categories, SKUs, cost/sell pricing, and stock tracking
- **Customers** — Customer database with contact info and purchase history
- **Sales History** — Browse past transactions with printable invoices
- **Reports** — Sales analytics with date filtering and charts
- **Stock Take** — Inventory auditing and stock adjustment
- **Settings** — Business info, currency, tax rate, receipt footer, and low stock thresholds
- **Dark Mode** — Toggle between light and dark themes

## Tech Stack

- **Framework**: [SvelteKit](https://svelte.dev/docs/kit) with TypeScript
- **UI Components**: [shadcn-svelte](https://www.shadcn-svelte.com/) (Tailwind CSS v4 + Bits UI)
- **Database**: SQLite via [better-sqlite3](https://github.com/WiseLibs/better-sqlite3)
- **ORM**: [Drizzle ORM](https://orm.drizzle.team/)
- **Icons**: [Lucide](https://lucide.dev/)
- **Font**: [Space Grotesk](https://fonts.google.com/specimen/Space+Grotesk)

## Getting Started

### Prerequisites

- Node.js 18+
- npm

### Install

```sh
git clone https://github.com/di3d/MaoPOS.git
cd MaoPOS
npm install
```

### Develop

```sh
npm run dev
```

The database is auto-created and seeded on first run (SQLite file at `data/maopos.db`).

### Build

```sh
npm run build
npm run start
```

## Deployment (Railway)

This project uses `@sveltejs/adapter-node` and is ready for Railway:

1. Connect your GitHub repo in Railway
2. Set the build command: `npm run build`
3. Set the start command: `npm run start`
4. Railway will auto-detect the port from the `PORT` environment variable

The SQLite database is stored at `./data/maopos.db` — for persistence on Railway, attach a volume mounted at `/app/data`.

## Database Commands

```sh
npm run db:generate   # Generate migration files from schema changes
npm run db:migrate    # Apply migrations
npm run db:push       # Push schema directly (dev only)
```

## License

MIT
