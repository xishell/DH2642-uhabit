# GitHub Actions Workflows

This repository uses GitHub Actions for CI/CD automation.

## Workflows

### 1. CI (Continuous Integration)

**File**: `.github/workflows/ci.yml`
**Triggers**:

- Pull requests to `main`
- Pushes to `main`
- Manual trigger (on any branch)

**What it does**:

- Runs Prettier format check
- Runs TypeScript type checking
- Runs test suite
- Builds the project

**Manual Trigger**: You can manually run CI on any branch:

1. Go to **Actions** tab in GitHub
2. Select **CI** workflow
3. Click **Run workflow** button
4. Select your branch from dropdown
5. Click **Run workflow** to start

### 2. Deploy to Staging

**File**: `.github/workflows/deploy-staging.yml`
**Triggers**: Pushes to `main` branch

**What it does**:

- Validates required variables are set
- Builds the project
- Deploys to Cloudflare Pages staging environment
- Comments deployment URL on associated PR

**Environment**: `staging`
**URL**: Configured via `STAGING_URL` variable

**Note**: Workflow will fail fast with clear error message if required variables (`STAGING_URL`, `STAGING_PROJECT_NAME`) are not configured.

### 3. Deploy to Production

**File**: `.github/workflows/deploy-production.yml`
**Triggers**: Git tags matching `v*.*.*` (e.g., `v1.0.0`)

**What it does**:

- Validates required variables are set
- Runs full test suite
- Builds the project
- Deploys to Cloudflare Pages production environment
- Creates a GitHub release with auto-generated release notes

**Environment**: `production`
**URL**: Configured via `PRODUCTION_URL` variable

**Note**: Workflow will fail fast with clear error message if required variables (`PRODUCTION_URL`, `PRODUCTION_PROJECT_NAME`) are not configured.

## Local Development Setup

**Important**: CI will fail if code is not properly formatted. Set up local formatting to avoid failed builds.

See [Local Development Setup Guide](../docs/local-development-setup.md) for:

- Editor integration (format on save)
- Manual formatting commands

## Setup Instructions

### 1. Configure Repository Secrets and Variables

#### Secrets

Go to **Settings → Secrets and variables → Actions → Secrets** and add:

| Secret Name             | Description                                        | How to get it                                                                                            |
| ----------------------- | -------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `CLOUDFLARE_API_TOKEN`  | Cloudflare API token with Pages deploy permissions | [Create token](https://dash.cloudflare.com/profile/api-tokens) with "Cloudflare Pages - Edit" permission |
| `CLOUDFLARE_ACCOUNT_ID` | Your Cloudflare account ID                         | Found in Cloudflare dashboard URL or account settings                                                    |

#### Variables

Go to **Settings → Secrets and variables → Actions → Variables** and add:

| Variable Name             | Description                                  | Example Value                      |
| ------------------------- | -------------------------------------------- | ---------------------------------- |
| `STAGING_URL`             | Staging environment URL                      | `https://staging.uhabit.pages.dev` |
| `PRODUCTION_URL`          | Production environment URL                   | `https://uhabit.pages.dev`         |
| `STAGING_PROJECT_NAME`    | Cloudflare Pages project name for staging    | `uhabit-staging`                   |
| `PRODUCTION_PROJECT_NAME` | Cloudflare Pages project name for production | `uhabit`                           |

### 2. Configure GitHub Environments

Create two environments in **Settings → Environments**:

#### Staging Environment

- **Name**: `staging`
- **Deployment branches**: Only `main`
- **URL**: Set via `STAGING_URL` variable

#### Production Environment

- **Name**: `production`
- **Deployment branches**: Only tags
- **Protection rules**: Require reviewers
- **URL**: Set via `PRODUCTION_URL` variable

### 3. Enable Workflow Permissions

Go to **Settings → Actions → General → Workflow permissions** and select:

- **Read and write permissions**
- **Allow GitHub Actions to create and approve pull requests**

## Usage

### Running CI on Pull Requests

CI runs automatically on every pull request. Ensure all checks pass before merging.

### Deploying to Staging

Merge a pull request to `main`:

```bash
git checkout main
git pull
git merge feature/my-feature
git push
```

The staging deployment will trigger automatically.

### Deploying to Production

Create and push a version tag:

```bash
git checkout main
git pull
git tag -a v1.0.0 -m "Release version 1.0.0"
git push origin v1.0.0
```

The production deployment will trigger automatically and create a GitHub release.

## Customization

### Change project names or URLs

Update the repository variables in **Settings → Secrets and variables → Actions → Variables**:

- `STAGING_PROJECT_NAME` - Cloudflare Pages project name for staging
- `PRODUCTION_PROJECT_NAME` - Cloudflare Pages project name for production
- `STAGING_URL` - Staging environment URL
- `PRODUCTION_URL` - Production environment URL

### Use npm instead of Bun

Replace `bun` commands with `npm`:

```yaml
- name: Setup Node.js
  uses: actions/setup-node@v4
  with:
    node-version: '20'

- name: Install dependencies
  run: npm ci
```

### Modify build output path

Update the deployment path in the `command`:

```yaml
command: pages deploy ./build --project-name=uhabit
```
