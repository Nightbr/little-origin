# Plan: Documentation App with Docusaurus

## Summary

Add a new `apps/docs` app to the monorepo using **Docusaurus** to create a published documentation site with:
- Custom one-page homepage (React component)
- Markdown-based documentation pages (new user-friendly docs, /specs remain as technical reference)
- Automatic deployment to GitHub Pages via GitHub Actions

**Why Docusaurus:**
- Purpose-built for docs with custom homepage support
- Excellent monorepo support (works seamlessly with Turborepo/pnpm)
- Built-in MDX, code highlighting, search, and versioning
- You already have experience with it
- Strong GitHub Pages deployment workflow

## Implementation Steps

### 1. Create Docusaurus App Structure

Create `apps/docs/` with the following structure:

```
apps/docs/
├── docusaurus.config.ts     # Main configuration
├── package.json             # Scripts and dependencies
├── tsconfig.json            # TypeScript config
├── sidebars.ts              # Documentation navigation
├── docs/                    # Markdown/MDX content
│   ├── intro.md            # Quick overview
│   ├── deployment.md       # Docker compose deployment guide
│   ├── features/           # Feature documentation
│   │   ├── swiping.md
│   │   ├── matching.md
│   │   └── collaboration.md
│   ├── architecture/       # Technical docs
│   │   ├── structure.md
│   │   ├── database.md
│   │   └── graphql.md
│   └── development/        # Developer docs
│       ├── setup.md
│       ├── testing.md
│       └── contributing.md
├── src/                    # Custom React components
│   ├── pages/
│   │   └── index.tsx       # Custom homepage (one-pager)
│   ├── components/
│   │   ├── HomepageHeader.tsx
│   │   ├── HomepageFeatures.tsx
│   │   └── DemoGif.tsx     # Show the app in action
│   ├── css/
│   │   └── custom.css      # Brand customization
│   └── theme/              # Swizzled theme components (optional)
└── static/                 # Images, screenshots, assets
```

### 2. Configure Docusaurus

**docusaurus.config.ts** - Key settings:
- Site title, description, URL (will be GitHub Pages URL)
- Preset: `@docusaurus/preset-classic`
- Theme customization (custom CSS, favicon)
- Navbar: links to GitHub repo, main app (if deployed)
- Webpack aliases for monorepo package imports
- Plugins: future content if needed

**Custom CSS** (src/css/custom.css):
- Match Little Origin branding (colors from web app)
- Custom typography
- Landing page specific styles

### 3. Create Custom Homepage

**src/pages/index.tsx** - One-page React homepage with:
- Hero section with app description and CTA
- Feature highlights (swipe interface, real-time matching, etc.)
- Quick start preview
- Links to main documentation sections
- Screenshots/Demo GIF of the app in action

Use `Layout` from `@theme/Layout` for wrapper, then full custom content.

### 4. Create User-Friendly Documentation

Create new documentation from scratch, focusing on user-friendliness:

**Getting Started** (create new):
- `docs/intro.md` - Brief project overview and what Little Origin is
- `docs/deployment.md` - Docker compose deployment guide
- `docs/configuration.md` - Basic configuration options

**Features** (create new):
- `docs/features/swiping.md` - How the swipe interface works
- `docs/features/matching.md` - Understanding real-time matches
- `docs/features/collaboration.md` - How partners collaborate
- `docs/features/names.md` - Name data and filtering options

**Development** (create new):
- `docs/development/setup.md` - Local development setup
- `docs/development/architecture.md` - High-level architecture overview
- `docs/development/contributing.md` - Contribution guidelines

> Note: Existing `/specs/` files remain as technical reference and will NOT be migrated.

### 5. Configure Navigation

**sidebars.ts** - Organize docs into categories:
- Getting Started (intro, deployment, configuration)
- Features (swiping, matching, collaboration, names)
- Development (setup, architecture, contributing)

### 6. Monorepo Integration

**package.json** scripts:
```json
{
  "name": "@little-origin/docs",
  "scripts": {
    "dev": "docusaurus start",
    "build": "docusaurus build",
    "serve": "docusaurus serve",
    "lint": "biome check .",
    "format": "biome format .",
    "typecheck": "tsc --noEmit"
  }
}
```

**Update turbo.json** - Add docs app to build pipeline (already configured for `build/**` outputs)

**Update biome.json** - Add ignore patterns for `apps/docs/build` and `apps/docs/.docusaurus`

**No changes needed to pnpm-workspace.yaml** - Already includes `apps/*`

### 7. GitHub Actions Deployment

Create `.github/workflows/deploy-docs.yml`:

```yaml
name: Deploy Documentation

on:
  push:
    branches: [main]
    paths:
      - 'apps/docs/**'
      - 'specs/**'
      - '.github/workflows/deploy-docs.yml'

permissions:
  contents: read
  pages: write
  id-token: write

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v4
        with:
          version: 10

      - uses: actions/setup-node@v4
        with:
          node-version: 24
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install

      - name: Build docs
        run: pnpm --filter @little-origin/docs build

      - name: Deploy to GitHub Pages
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./apps/docs/build
          force_orphan: true
```

### 8. Configure GitHub Pages Settings

In repository Settings > Pages:
- Source: GitHub Actions
- This is the modern approach (recommended by GitHub)

## Critical Files to Modify

1. **Create** `apps/docs/docusaurus.config.ts` - Main Docusaurus config
2. **Create** `apps/docs/package.json` - Docs app package definition
3. **Create** `apps/docs/src/pages/index.tsx` - Custom homepage
4. **Create** `.github/workflows/deploy-docs.yml` - Deployment workflow
5. **Update** `biome.json` - Add ignore patterns for docs build artifacts
6. **Update** `turbo.json` - Ensure docs app is included in build task (verify)

## Testing & Verification

1. **Local development:**
   ```bash
   pnpm --filter @little-origin/docs dev
   ```
   Should start dev server on http://localhost:3000

2. **Build verification:**
   ```bash
   pnpm --filter @little-origin/docs build
   ```
   Should create `apps/docs/build/` directory

3. **Preview production build:**
   ```bash
   pnpm --filter @little-origin/docs serve
   ```

4. **Test GitHub Actions workflow:**
   - Push changes to main branch
   - Check Actions tab for workflow run
   - Verify GitHub Pages deployment succeeds

5. **Final verification:**
   - Visit GitHub Pages URL
   - Check custom homepage renders correctly
   - Navigate all documentation sections
   - Verify search works
   - Check mobile responsiveness

## Advantages of This Approach

✓ **Monorepo-native** - Fits seamlessly with existing Turborepo setup
✓ **Familiar tooling** - You already know Docusaurus
✓ **Customizable** - React homepage + markdown docs
✓ **Auto-deployment** - GitHub Pages via Actions
✓ **Feature-rich** - Search, i18n support, versioning built-in
✓ **Fast** - Static site, instant page loads
✓ **Type-safe** - Can import shared packages if needed
