# uhabit

A habit tracking application built with SvelteKit.

## Group Members

| Name              | Email           | ID     |
| ----------------- | --------------- | ------ |
| Elliot Steffensen | ellste@kth.se   | 142612 |
| Geonna Dahore     | dahore@kth.se   | 187167 |
| Jintong Jiang     | jintongj@kth.se | 200160 |

## Tech Stack

### Frontend

- **[Svelte 5](https://svelte.dev/)** - Modern reactive UI framework
- **[SvelteKit 2](https://kit.svelte.dev/)** - Full-stack Svelte framework with routing and SSR
- **[Tailwind CSS 4](https://tailwindcss.com/)** - Utility-first CSS framework
- **[Skeleton UI](https://www.skeleton.dev/)** - Svelte component library

### Backend & Database

- **[Drizzle ORM](https://orm.drizzle.team/)** - TypeScript ORM for SQL databases
- **[libSQL](https://github.com/tursodatabase/libsql)** - SQLite-compatible database client
- **SQLite** - Database dialect

### Development Tools

- **[TypeScript](https://www.typescriptlang.org/)** - Type-safe JavaScript
- **[Vite](https://vitejs.dev/)** - Fast build tool and dev server
- **[Vitest](https://vitest.dev/)** - Unit testing framework
- **[Playwright](https://playwright.dev/)** - Browser testing
- **[Prettier](https://prettier.io/)** - Code formatter

### Deployment

- **[Cloudflare Workers](https://workers.cloudflare.com/)** - Serverless deployment platform

## Getting Started

This project supports both **npm** and **[Bun](https://bun.sh/)** as package managers.

### Install dependencies:

Using npm:

```sh
npm install
```

Using Bun:

```sh
bun install
```

### Start the development server:

Using npm:

```sh
npm run dev
```

Using Bun:

```sh
bun dev
```

## Development Workflow

This project follows a trunk-based development model with weekly development cycles.

### Branching Strategy

- **Main branch** (`main`): Always stable and deployable
- **Feature branches** (`feature/<name>`): Short-lived (max 1 week), focused on specific features or fixes

### Deployment

- **Staging**: Automatically deploys on every merge to `main`
- **Production**: Manual deployment via Git tags (e.g., `v1.0.3`)

### Best Practices

- Keep `main` always green (passing CI)
- Rebase feature branches frequently: `git rebase origin/main`
- Keep PRs small and focused
- Test thoroughly on staging before production release

## Documentation

- [Project Structure](docs/project-structure.md) - Overview of the codebase organization
- [Local Development Setup](docs/local-development-setup.md) - Code formatting and development tools
- [GitHub Actions Workflows](.github/WORKFLOWS.md) - CI/CD pipeline configuration

## Building

Create a production build:

Using npm:

```sh
npm run build
```

Using Bun:

```sh
bun build
```
