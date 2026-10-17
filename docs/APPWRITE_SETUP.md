# Appwrite Setup

## Official CLI

Install and authenticate with the latest Appwrite CLI.

```bash
npm install -g appwrite-cli
appwrite login
appwrite init project
```

Do not hand-author the initial `appwrite.config.json`; let Appwrite CLI create it.

## Resource initialization

Use the official CLI for resources it supports:

```bash
appwrite init functions
appwrite init tables
appwrite init buckets
appwrite init teams
appwrite init topics
appwrite init sites
```

For Functions, select **Go**.

For databases/resources that require a different official provisioning path, use the current Appwrite Console or official Appwrite Terraform provider rather than inventing config syntax.

## Environments

Keep separate configs:

```text
appwrite.config.dev.json
appwrite.config.staging.json
appwrite.config.prod.json
```

Never commit production API keys.

The CLI supports `--config-file` and `APPWRITE_CONFIG_FILE`.

## TablesDB

After creating the database/table schema in the Console/CLI, commit the generated resource definitions and use:

```bash
appwrite push tables
```

## Functions

Create Appwrite Functions with the official scaffold; StoryGalore requires Go wherever Appwrite supports Go:

```bash
appwrite init functions
```

Then use:

```bash
appwrite push functions
```

## Sites

Use the official Appwrite CLI/Sites integration for the single Astro web application. The Astro application uses `@astrojs/node` for SSR; Appwrite Sites uses `framework: astro` and `adapter: ssr`.

Expected Appwrite Site configuration:

```text
install: pnpm install --frozen-lockfile
build: pnpm --filter @storygalore/web build
output: ./dist
framework: astro
adapter: ssr
build runtime: node-22
```

The canonical Site root is `apps/web`. Public, Creator Studio and Admin are routes in this same Astro application.

## Type generation

After schema stabilization:

```bash
appwrite types ./packages/appwrite-client/src/generated
```

Use generated types instead of hand-maintaining Appwrite resource types.

## Terraform

Use the official Appwrite Terraform provider only for resources where it provides a clear advantage, especially advanced infrastructure/resource types not represented cleanly by the CLI workflow.

Do not introduce a second IaC system for everything just because it exists.
