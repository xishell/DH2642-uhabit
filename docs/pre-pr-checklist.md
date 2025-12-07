# Pre-PR Checklist

This checklist ensures code quality and consistency before creating a pull request.

## Quick Checklist

Use this quick checklist before submitting your PR:

- [ ] Code is formatted with Prettier
- [ ] No linting errors
- [ ] All tests pass
- [ ] Build succeeds without errors
- [ ] Branch is up to date with `main`
- [ ] Commit messages are clear and descriptive
- [ ] No console.log or debug code left in
- [ ] Documentation updated (if needed)
- [ ] Tested in Cloudflare dev mode (if backend changes)

## Detailed Steps

### 1. Code Quality

#### Format Code with Prettier

```bash
bun run format
```

This auto-formats all files according to project standards. Make sure to commit any formatting changes.

#### Check for Linting Issues

```bash
bun run lint
```

This checks formatting without making changes. Fix any reported issues before proceeding.

**Common Issues:**

- Missing semicolons or inconsistent quotes
- Incorrect indentation
- Files not matching `.prettierrc` rules

### 2. TypeScript Type Checking

```bash
bun run check
```

This runs SvelteKit sync and svelte-check to verify:

- No TypeScript errors
- Svelte component types are correct
- No missing imports or type definitions

**Fix errors before proceeding.**

### 3. Run Tests

#### Unit Tests

```bash
bun run test
```

Runs all tests once (CI mode). All relevant tests must pass.

#### Watch Mode (Development)

```bash
bun run test:unit
```

Runs tests in watch mode for active development.

**If tests fail:**

1. Review the failure messages
2. Fix the broken functionality or update the test
3. Re-run tests until all pass
4. Never commit failing tests

### 4. Build Verification

#### Production Build

```bash
bun run build
```

This creates a production build and verifies:

- No build errors
- All imports resolve correctly
- Vite can bundle the application
- Cloudflare adapter runs successfully

**Common build errors:**

- Missing dependencies
- Import paths incorrect
- TypeScript errors not caught by `check`
- Cloudflare-specific issues

#### Test Build in Cloudflare Mode

If your changes involve backend, database, or auth:

```bash
bun run dev:cf
```

Then manually test:

- API endpoints work (`/api/auth/*`, `/api/user/*`)
- Database queries execute
- Authentication flows complete
- No runtime errors in console

### 5. Git Hygiene

#### Update Your Branch

```bash
# Fetch latest changes
git fetch origin

# Rebase on main
git rebase origin/main
```

**If conflicts occur:**

1. Resolve conflicts in your editor
2. `git add <resolved-files>`
3. `git rebase --continue`
4. Re-run tests after resolving conflicts

#### Review Your Changes

```bash
# See what files changed
git status

# Review all changes
git diff main

# Review staged changes
git diff --staged
```

**Check for:**

- No unintended changes
- No leftover debug code (console.log, debugger)
- No commented-out code
- No temporary test files

#### Commit Message Quality

Good commit messages follow this format:

```
<type>: <short summary>

<optional detailed description>

<optional footer>
```

**Types:**

- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `style:` Formatting, missing semicolons, etc.
- `refactor:` Code restructuring (no functional changes)
- `test:` Adding or updating tests
- `chore:` Maintenance tasks, dependency updates

**Examples:**

```bash
# Good
git commit -m "feat: add user profile editing functionality"

# Good with description
git commit -m "fix: resolve session persistence issue

Previously, sessions were not persisting across page refreshes
due to incorrect cookie configuration in hooks.server.ts.
Updated cookie settings to use secure flags."

# Bad
git commit -m "fixed stuff"
git commit -m "wip"
git commit -m "changes"
```

### 6. Database Changes

If you modified database schema or added migrations:

#### Generate and Verify Migrations

```bash
# After updating schema.ts, generate migration
bun run db:generate

# Review the generated SQL
cat drizzle/XXXX_*.sql

# Test migration locally
bun run db:migrate

# Verify migrations applied
bun run db:status
```

Ensure migration files are committed and named correctly.

#### Document Schema Changes

Update `src/lib/server/db/schema.ts` with clear comments for new fields or tables.

See [migrations.md](./migrations.md) for detailed migration workflow.

### 7. Documentation

#### Update Documentation If Needed

Check if these need updating:

- [ ] `README.md` - Changed setup process or added features?
- [ ] `docs/project-structure.md` - Added new files or directories?
- [ ] `docs/authentication.md` - Changed auth flow or added new auth features?
- [ ] `docs/cloudflare-setup.md` - Changed Cloudflare configuration?

#### Add Code Comments

For complex logic, ensure:

- Functions have descriptive names or comments
- Non-obvious business logic is explained
- TODOs are tracked (or removed if done)

### 8. Clean Up

#### Remove Debug Code

Search for and remove:

```bash
# Search for console.log
rg "console\.log" src/

# Search for debugger statements
rg "debugger" src/

# Search for TODO comments (decide if they should stay)
rg "TODO|FIXME" src/
```

#### Remove Commented Code

Unless there's a specific reason (like showing alternative approaches), remove commented-out code.

#### Check File Sizes

Large files slow down the repository:

```bash
# Check for large files
find . -type f -size +100k ! -path "./node_modules/*" ! -path "./.git/*"
```

If you added large files:

- Are they necessary?
- Should they be in `.gitignore`?
- Can they be optimized?

### 9. Final Verification

#### Full Clean Build

```bash
bun install

# Build from scratch
bun run build

# Run tests
bun test
```

#### Test in Dev Mode

```bash
# Test standard mode
bun dev
# Visit http://localhost:5173 and test your changes

# Test Cloudflare mode
bun run dev:cf
# Visit http://localhost:8788 and test with full features
```

### 10. Create Pull Request

Once all checks pass:

1. **Push your branch:**

   ```bash
   git push origin feature/your-feature-name
   ```

2. **Create PR on GitHub**
   - Use a descriptive title
   - Reference any related issues
   - Provide context for reviewers
   - Add screenshots for UI changes

3. **PR Description Template:**

   ```markdown
   ## Description

   Brief description of what this PR does.

   ## Changes

   - Added X feature
   - Fixed Y bug
   - Updated Z documentation

   ## Testing

   - [ ] Unit tests pass
   - [ ] Manual testing completed
   - [ ] Tested in Cloudflare mode (if applicable)

   ## Screenshots (if applicable)

   [Add screenshots here]

   ## Related Issues

   Closes #123
   ```

## Common Issues & Solutions

### "Merge conflicts with main"

**Solution:**

```bash
git fetch origin
git rebase origin/main
# Resolve conflicts
git add .
git rebase --continue
```

### "Prettier formatting doesn't match CI"

**Solution:**

```bash
# Use exact Prettier version from package.json
rm -rf node_modules
bun install
bun run format
git add .
git commit -m "chore: fix formatting"
```

## Quick Command Reference

```bash
# Format all code
bun run format

# Check formatting
bun run lint

# Type check
bun run check

# Run tests
bun test

# Build
bun run build

# Test in Cloudflare mode
bun run dev:cf

# Update branch
git fetch origin && git rebase origin/main

# Create PR (after pushing)
# Use GitHub UI or gh CLI:
gh pr create --title "feat: your feature" --body "Description"
```

## Automation

Consider adding a pre-commit hook to automate checks:

Create `.git/hooks/pre-commit`:

```bash
#!/bin/bash

echo "Running pre-commit checks..."

# Format code
echo "Formatting code..."
bun run format

# Type check
echo "Type checking..."
bun run check || exit 1

# Run tests
echo "Running tests..."
bun test || exit 1

echo "All checks passed!"
```

Make it executable:

```bash
chmod +x .git/hooks/pre-commit
```

## Resources

- [SvelteKit Documentation](https://kit.svelte.dev/)
- [Better Auth Docs](https://www.better-auth.com/docs)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [Project Documentation](../README.md)
