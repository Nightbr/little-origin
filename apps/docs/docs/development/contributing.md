---
sidebar_position: 3
---

# Contributing

We love contributions! Little Origin is a community-driven project, and we welcome help in many forms.

## Ways to Contribute

### Code Contributions

- **Bug Fixes** - Help us squash bugs
- **New Features** - Add functionality you'd like to see
- **Performance** - Make things faster
- **Documentation** - Improve docs and comments
- **Tests** - Increase test coverage

### Non-Code Contributions

- **Bug Reports** - Report issues you encounter
- **Feature Requests** - Suggest improvements
- **Design** - UI/UX improvements
- **Name Data** - Add names from new countries
- **Translation** - Help with internationalization
- **Community** - Help other users, answer questions

## Getting Started

### 1. Set Up Development Environment

Follow the [Development Setup](/docs/development/setup) guide to get your local environment ready.

### 2. Find an Issue

Look for issues tagged:
- **`good first issue`** - Great for newcomers
- **`help wanted`** - Community contributions welcome
- **`enhancement`** - Feature requests

### 3. Claim an Issue

Comment on the issue that you'd like to work on it. This prevents duplicate work.

### 4. Create a Branch

```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/your-bug-fix
```

Branch naming conventions:
- `feature/` - New features
- `fix/` - Bug fixes
- `docs/` - Documentation changes
- `refactor/` - Code refactoring
- `test/` - Test additions/changes

## Development Workflow

### 1. Make Changes

- Follow the existing code style
- Add tests for new functionality
- Update documentation as needed
- Keep changes small and focused

### 2. Test Your Changes

```bash
# Run tests
pnpm test

# Type check
pnpm typecheck

# Lint
pnpm lint

# Format
pnpm format
```

### 3. Commit Your Changes

Use clear, descriptive commit messages:

```
feat: add name search by popularity

fix: resolve race condition in match detection

docs: improve deployment guide

refactor: simplify auth middleware
```

Commit message format:
- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation
- `refactor:` - Code refactoring
- `test:` - Test changes
- `chore:` - Maintenance tasks

### 4. Push and Create Pull Request

```bash
git push origin feature/your-feature-name
```

Then create a pull request on GitHub.

## Pull Request Guidelines

### PR Description

Include:

- **What** - Brief description of changes
- **Why** - Reason for the change
- **How** - Approach taken
- **Testing** - How you tested it
- **Screenshots** - For UI changes

### PR Checklist

- [ ] Tests pass locally
- [ ] Code follows style guidelines
- [ ] Documentation updated
- [ ] Commit messages follow conventions
- [ ] PR description is clear
- [ ] No merge conflicts

### Review Process

1. **Automated Checks** - CI runs tests and linting
2. **Code Review** - Maintainers review your changes
3. **Feedback** - Address any review comments
4. **Approval** - Maintain approve your PR
5. **Merge** - Squashed and merged to main branch

## Code Style

### General Guidelines

- **Tabs** for indentation (width 2)
- **Single quotes** for strings
- **Semicolons** required
- **Trailing commas** for multi-line

### TypeScript

- **Type annotations** on function parameters and returns
- **Interfaces** for object shapes
- **Enums** for fixed sets of values
- **No `any`** - Use proper types

### React

- **Functional components** with hooks
- **Props interfaces** defined
- **Memoization** for expensive computations
- **Cleanup** in useEffect hooks

### GraphQL

- **Descriptive names** for queries/mutations
- **Fragments** for reusable selections
- **Type generation** from schema
- **Error handling** in resolvers

## Testing

### Writing Tests

- **Unit tests** for pure functions
- **Integration tests** for API endpoints
- **Component tests** for React components
- **E2E tests** for critical user flows

### Test Structure

```typescript
describe('FeatureName', () => {
  describe('when condition', () => {
    it('should do something', () => {
      // Arrange
      const input = {...};

      // Act
      const result = functionUnderTest(input);

      // Assert
      expect(result).toBe(expected);
    });
  });
});
```

### Coverage

Aim for:
- **Core logic** - 90%+ coverage
- **UI components** - 70%+ coverage
- **Utilities** - 100% coverage

## Documentation

### Code Comments

- **Why**, not **what** - Explain reasoning, not obvious code
- **JSDoc** for public APIs
- **TODO** notes for future work
- **FIXME** for known issues

### User Documentation

- **Updates needed** - When changing features
- **Screenshots** - For UI changes
- **Examples** - Clear usage examples
- **Migration guides** - For breaking changes

## Name Data Contributions

### Adding New Countries

To add name data from a new country:

1. **Find official data source** (government statistics)
2. **Format as JSON** - Match existing structure
3. **Create PR** - Include in `packages/name-data/src/data/`
4. **Update loader** - Add to name data index

### Data Requirements

- **Official source** - Government statistics preferred
- **Multiple years** - At least 5 years of data
- **Metadata** - Gender, year, rank/count
- **Legal to use** - Public domain or permissive license

## Design Contributions

### UI/UX Improvements

1. **Discuss first** - Open an issue to discuss
2. **Mockups** - Provide visual designs
3. **Consistent** - Follow existing design system
4. **Responsive** - Mobile-friendly required
5. **Accessible** - WCAG AA compliance

### Design System

Follow the Little Origin branding:
- **Colors** - Sage Green, Warm Clay, Charcoal
- **Typography** - Nunito (headings), Lato (body)
- **Spacing** - Consistent spacing scale
- **Rounded corners** - Soft, friendly shapes

## Community Guidelines

### Be Respectful

- **Welcoming** - New contributors welcome
- **Constructive** - Helpful feedback
- **Inclusive** - Respect all backgrounds
- **Patient** - Teaching and learning

### Communication

- **GitHub issues** - For bugs and features
- **PR comments** - For code discussion
- **Discussions** - For general questions
- **Code of Conduct** - Applies everywhere

### Getting Help

- **Read docs** - Check existing documentation
- **Search issues** - May already be answered
- **Ask nicely** - Community volunteers time
- **Be patient** - Response times vary

## Recognition

Contributors are recognized in:

- ** CONTRIBUTORS.md** - Listed by contribution
- **Release notes** - Notable contributions mentioned
- **Community** - Active members become maintainers

## Release Process

### Versioning

- **Semantic versioning** - Major.Minor.Patch
- **Changelog** - Document all changes
- **Migration guides** - For breaking changes

### Release Checklist

1. All tests pass
2. Documentation updated
3. Changelog written
4. Version bumped
5. Tagged and released

## Becoming a Maintainer

Active contributors can become maintainers:

- **Consistent contributions** - Regular PRs merged
- **Code quality** - High-quality submissions
- **Community helpful** - Help review PRs
- **Trust** - Earned through participation

Maintainers have:
- Write access to repository
- Ability to merge PRs
- Input on project direction
- Moderation privileges

## Resources

### Documentation

- **[Development Setup](/docs/development/setup)** - Local development
- **[Architecture](/docs/development/architecture)** - Codebase structure

### External Resources

- **React Docs** - https://react.dev
- **GraphQL Docs** - https://graphql.org/learn
- **Drizzle Docs** - https://orm.drizzle.team
- **Framer Motion** - https://www.framer.com/motion

## License

By contributing, you agree that your contributions will be licensed under the **MIT License**.

## Questions?

- **GitHub Issues** - For bugs and features
- **GitHub Discussions** - For questions
- **Email** - For security issues (see SECURITY.md)

Thank you for contributing to Little Origin! Every contribution helps make the project better, whether it's code, documentation, or helping others in the community.

## Next Steps

- **[Find an issue](https://github.com/Nightbr/little-origin/issues)** - Start contributing
- **[Set up dev environment](/docs/development/setup)** - Get your tools ready
- **[Read architecture docs](/docs/development/architecture)** - Understand the codebase
