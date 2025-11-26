# Local Development Setup

## Code Formatting

This project uses **Prettier** for code formatting. Code must be properly formatted before pushing to pass CI checks.

## Setup Options

### Option 1: Editor Integration

Configure your editor to format on save.

#### VS Code

Install the **Prettier extension** and add to `.vscode/settings.json`:

```json
{
	"editor.formatOnSave": true,
	"editor.defaultFormatter": "esbenp.prettier-vscode"
}
```

#### WebStorm / IntelliJ

1. Go to **Settings → Languages & Frameworks → JavaScript → Prettier**
2. Check **"On save"**
3. Set Prettier package to `node_modules/prettier`

#### Vim / Neovim

Use a plugin like `prettier.nvim` or configure with your LSP setup.

### Option 2: Manual Formatting

Run before committing:

```bash
bun run format
```

Check formatting without fixing:

```bash
bun run lint
```

## CI Checks

The CI pipeline runs the following checks on every PR:

- Prettier format check (`bun run lint`)
- TypeScript type check (`bun run check`)
- Tests (`bun run test`)
- Build verification (`bun run build`)

**If formatting check fails**, run `bun run format` locally and push again.

## Best Practices

1. **Always format before committing** - Use pre-commit hooks or editor integration
2. **Run `bun run check` before pushing** - Catch type errors early
3. **Run `bun run test` before pushing** - Ensure tests pass
4. **Keep commits atomic** - One logical change per commit
5. **Write descriptive commit messages** - Follow conventional commits format
