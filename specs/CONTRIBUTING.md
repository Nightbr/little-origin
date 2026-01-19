# Contributing to Little Origin

Thank you for your interest in contributing! This document provides guidelines and instructions for contributing to the project.

---

## Table of Contents

1. [Code of Conduct](#code-of-conduct)
2. [Getting Started](#getting-started)
3. [Development Process](#development-process)
4. [Coding Standards](#coding-standards)
5. [Pull Request Process](#pull-request-process)
6. [Issue Guidelines](#issue-guidelines)

---

## Code of Conduct

### Our Pledge

We are committed to providing a welcoming and inspiring community for all. Please be respectful and considerate in your interactions.

### Our Standards

**Positive behavior includes:**
- Using welcoming and inclusive language
- Being respectful of differing viewpoints
- Accepting constructive criticism gracefully
- Focusing on what's best for the community
- Showing empathy towards others

**Unacceptable behavior includes:**
- Harassment, trolling, or discriminatory comments
- Personal or political attacks
- Publishing others' private information
- Any conduct that would be inappropriate in a professional setting

### Enforcement

Instances of unacceptable behavior may be reported to the project maintainers. All complaints will be reviewed and investigated promptly and fairly.

---

## Getting Started

### Prerequisites

1. **Install mise** for runtime management:
```bash
curl https://mise.run | sh
eval "$(mise activate bash)"  # or zsh
```

2. **Fork and clone** the repository:
```bash
git clone https://github.com/YOUR_USERNAME/little-origin.git
cd little-origin
```

3. **Install dependencies**:
```bash
pnpm install
```

4. **Set up environment**:
```bash
cp .env.example .env
# Edit .env with your values
```

5. **Run database migrations**:
```bash
pnpm db:migrate
```

6. **Start development server**:
```bash
pnpm dev
```

### First Contribution

Look for issues tagged with:
- `good first issue` - Good for newcomers
- `help wanted` - Extra attention needed
- `documentation` - Documentation improvements

---

## Development Process

### 1. Create a Branch

```bash
# Update main
git checkout main
git pull origin main

# Create feature branch
git checkout -b feature/your-feature-name

# Or for bug fixes
git checkout -b fix/bug-description
```

### 2. Make Changes

- Write clear, concise code
- Follow the [Coding Standards](#coding-standards)
- Add tests for new features
- Update documentation as needed

### 3. Test Your Changes

```bash
# Run all tests
pnpm test

# Run linter
pnpm lint

# Check formatting
pnpm format -- --check

# Type check
pnpm typecheck

# Run all checks
pnpm lint && pnpm format -- --check && pnpm typecheck && pnpm test
```

### 4. Commit Your Changes

```bash
# Stage changes
git add .

# Commit with conventional commit message
git commit -m "feat(swipe): add undo animation"
```

**Commit Message Format:**
```
<type>(<scope>): <subject>

[optional body]

[optional footer]
```

**Types:**
- `feat` - New feature
- `fix` - Bug fix
- `docs` - Documentation only
- `style` - Code style (formatting, missing semicolons, etc.)
- `refactor` - Code refactoring
- `perf` - Performance improvement
- `test` - Adding or updating tests
- `chore` - Maintenance tasks

**Examples:**
```bash
git commit -m "feat(auth): add password reset functionality"
git commit -m "fix(swipe): resolve gesture detection on iOS"
git commit -m "docs(readme): update installation instructions"
git commit -m "refactor(name-service): simplify seeding logic"
```

### 5. Push and Create PR

```bash
# Push branch
git push origin feature/your-feature-name

# Create pull request on GitHub
```

---

## Coding Standards

### TypeScript

```typescript
// ✅ Good
export interface User {
  id: number;
  username: string;
  createdAt: Date;
}

export function createUser(data: RegisterUser): Promise<User> {
  // Implementation
}

// ❌ Bad
export interface user {  // Use PascalCase for types
  ID: number;           // Use camelCase for properties
  user_name: string;    // Use camelCase, not snake_case
  created_at: Date;
}

export function CreateUser(data: any): any {  // Use camelCase, avoid 'any'
  // Implementation
}
```

### React Components

```typescript
// ✅ Good - Functional component with proper typing
import { FC } from 'react';

interface SwipeCardProps {
  name: Name;
  onLike: () => void;
  onDislike: () => void;
}

export const SwipeCard: FC<SwipeCardProps> = ({ name, onLike, onDislike }) => {
  return (
    <div className="swipe-card">
      <h1>{name.name}</h1>
      <button onClick={onLike}>Like</button>
      <button onClick={onDislike}>Dislike</button>
    </div>
  );
};

// ❌ Bad - Missing types, unclear structure
export function SwipeCard(props) {
  return (
    <div>
      <h1>{props.name.name}</h1>
      <button onClick={props.onLike}>Like</button>
      <button onClick={props.onDislike}>Dislike</button>
    </div>
  );
}
```

### Naming Conventions

**Files:**
- Components: `PascalCase.tsx` (e.g., `SwipeCard.tsx`)
- Hooks: `camelCase.ts` (e.g., `useSwipe.ts`)
- Utilities: `camelCase.ts` (e.g., `validators.ts`)
- Types: `PascalCase.ts` or `camelCase.ts`

**Variables:**
- Constants: `UPPER_SNAKE_CASE` (e.g., `MAX_USERS`)
- Variables/Functions: `camelCase` (e.g., `userName`, `getUserById`)
- Classes/Types: `PascalCase` (e.g., `NameService`, `User`)

### Code Organization

```typescript
// ✅ Good - Organized imports
import { FC } from 'react';
import { useMutation, useQuery } from '@apollo/client';

import { Name, schemas } from '@little-origin/core';
import { Button } from '@components/ui/Button';
import { useSwipe } from '@hooks/useSwipe';

// Component code...

// ❌ Bad - Unorganized imports
import { useSwipe } from '@hooks/useSwipe';
import { Name } from '@little-origin/core';
import { FC } from 'react';
import { Button } from '@components/ui/Button';
```

### Comments

```typescript
// ✅ Good - Clear, necessary comments
/**
 * Generates names using AI based on preferences.
 * Falls back to static files if API key is missing.
 */
export async function generateNames(params: GenerateNamesParams) {
  // Validate input
  const validated = GenerateNamesSchema.parse(params);
  
  // Try AI generation first
  if (process.env.OPENROUTER_API_KEY) {
    return await generateWithAI(validated);
  }
  
  // Fallback to static files
  return getStaticNames(validated);
}

// ❌ Bad - Obvious or outdated comments
export async function generateNames(params: GenerateNamesParams) {
  // This function generates names
  const validated = GenerateNamesSchema.parse(params);
  
  // Check if we have an API key
  if (process.env.OPENROUTER_API_KEY) {
    // Call the AI
    return await generateWithAI(validated);
  }
  
  // Use static files instead
  return getStaticNames(validated);
}
```

### Error Handling

```typescript
// ✅ Good - Proper error handling
try {
  const user = await createUser(input);
  return user;
} catch (error) {
  if (error instanceof ZodError) {
    throw new ValidationError('Invalid input', error.errors);
  }
  
  logger.error('Failed to create user', { error, input });
  throw new InternalError('User creation failed');
}

// ❌ Bad - Silent failures or generic errors
try {
  const user = await createUser(input);
  return user;
} catch (error) {
  console.log(error);  // Don't use console.log in production
  throw new Error('Error');  // Too generic
}
```

---

## Pull Request Process

### Before Submitting

1. **Update your branch** with latest main:
```bash
git checkout main
git pull origin main
git checkout your-branch
git rebase main
```

2. **Run all checks**:
```bash
pnpm lint
pnpm format -- --check
pnpm typecheck
pnpm test
pnpm deps:check
```

3. **Update documentation** if needed:
   - README.md
   - Relevant documentation files
   - Code comments
   - CHANGELOG.md

4. **Test manually**:
   - Start the app: `pnpm dev`
   - Test your changes thoroughly
   - Test edge cases

### PR Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix (non-breaking change fixing an issue)
- [ ] New feature (non-breaking change adding functionality)
- [ ] Breaking change (fix or feature causing existing functionality to change)
- [ ] Documentation update

## Testing
- [ ] Tests pass locally
- [ ] Added new tests for new features
- [ ] Manual testing completed

## Checklist
- [ ] Code follows project style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex code
- [ ] Documentation updated
- [ ] No new warnings generated
- [ ] Dependent changes merged

## Screenshots (if applicable)
Add screenshots for UI changes

## Related Issues
Closes #123
```

### Review Process

1. **Automated checks** run via GitHub Actions
2. **Code review** by maintainers
3. **Feedback** addressed in new commits
4. **Approval** from at least one maintainer
5. **Merge** to main branch

### After Merge

- Delete your branch
- Pull latest main
- Update your fork

---

## Issue Guidelines

### Before Creating an Issue

1. **Search existing issues** to avoid duplicates
2. **Check documentation** for solutions
3. **Try latest version** to see if issue persists

### Bug Reports

**Use the bug report template:**

```markdown
**Describe the bug**
Clear description of what the bug is.

**To Reproduce**
Steps to reproduce:
1. Go to '...'
2. Click on '...'
3. See error

**Expected behavior**
What you expected to happen.

**Screenshots**
If applicable, add screenshots.

**Environment:**
 - OS: [e.g., macOS 14.0]
 - Browser: [e.g., Chrome 120]
 - Version: [e.g., 1.0.0]

**Additional context**
Any other relevant information.
```

### Feature Requests

**Use the feature request template:**

```markdown
**Is your feature request related to a problem?**
Clear description of the problem.

**Describe the solution you'd like**
Clear description of what you want to happen.

**Describe alternatives you've considered**
Alternative solutions or features considered.

**Additional context**
Any other context or screenshots.
```

---

## Development Tips

### Debugging

```bash
# Backend debugging
NODE_OPTIONS='--inspect' pnpm --filter @little-origin/api dev

# Frontend debugging
# Use React DevTools browser extension
# Check browser console for errors
```

### Database Changes

```bash
# After modifying schema.ts

# Generate migration
pnpm db:generate

# Review migration in apps/api/src/db/migrations/

# Apply migration
pnpm db:migrate

# Test in Drizzle Studio
pnpm db:studio
```

### Testing GraphQL

```bash
# Start API
pnpm --filter @little-origin/api dev

# Open GraphQL Playground
# Navigate to http://localhost:3000/graphql

# Run queries/mutations
```

### Common Commands

```bash
# Clean build artifacts
pnpm clean

# Clean and reinstall dependencies
rm -rf node_modules
pnpm install

# Fix dependency versions
pnpm deps:fix

# Remove unused dependencies
pnpm deps:unused

# Update dependencies
pnpm update --latest
```

---

## Project Structure

```
little-origin/
├── apps/
│   ├── web/        # Add new React components here
│   └── api/        # Add new API resolvers/services here
├── packages/
│   ├── core/       # Modify database schema here
│   ├── mastra-ai/  # Modify AI logic here
│   └── name-data/  # Add new country data here
└── docs/           # Update documentation here
```

---

## Questions?

- **General questions:** Open a [Discussion](https://github.com/Nightbr/little-origin/discussions)
- **Bug reports:** Open an [Issue](https://github.com/Nightbr/little-origin/issues)
- **Security issues:** Email security@your-domain.com

---

## Recognition

Contributors will be recognized in:
- README.md contributors section
- Release notes for significant contributions
- GitHub contributors page

---

## License

By contributing, you agree that your contributions will be licensed under the project's MIT License.

---

Thank you for contributing to Little Origin! 🎉