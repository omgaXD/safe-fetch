# Contributing to @asouei/safe-fetch

Thanks for your interest in contributing! We welcome issues, discussions, and pull requests.

## Quick Start

1. **Fork the repository** on GitHub
2. **Clone your fork**:
   ```bash
   git clone https://github.com/<your-username>/safe-fetch.git
   cd safe-fetch
   ```
3. **Install dependencies**:
   ```bash
   pnpm install
   ```
4. **Run tests** to make sure everything works:
   ```bash
   pnpm test
   ```

## Development Workflow

### Code Style & Standards
- Use TypeScript and follow the existing code patterns
- Format code with Prettier (runs automatically on commit)
- Follow conventional naming: `camelCase` for functions/variables, `PascalCase` for types
- Keep functions focused and well-documented

### Testing Requirements
- All new features **must** include tests using [Vitest](https://vitest.dev/)
- Aim for high test coverage of new code paths
- Test both success and error scenarios
- Mock external dependencies appropriately

### Before Submitting
1. **Run the test suite**:
   ```bash
   pnpm test
   ```
2. **Check TypeScript compilation**:
   ```bash
   pnpm build
   ```
3. **Ensure code formatting**:
   ```bash
   pnpm format
   ```

## Submitting Changes

### Issues First
For significant changes, please [open an issue](../../issues/new) first to discuss:
- New features or breaking changes
- Performance improvements
- API modifications

### Pull Request Process
1. **Create a feature branch** from `main`:
   ```bash
   git checkout -b feature/your-feature-name
   ```
2. **Make atomic commits** with clear, descriptive messages:
   ```bash
   git commit -m "feat: add retry delay jitter support"
   ```
3. **Update documentation** if behavior changes:
   - README.md for user-facing changes
   - JSDoc comments for API changes
   - Add examples for new features
4. **Add yourself to CHANGELOG.md** under "Unreleased" if you want credit
5. **Push and create a pull request** with:
   - Clear title describing the change
   - Description of what changed and why
   - Reference any related issues

### CI Requirements
All pull requests must pass:
- ✅ TypeScript compilation (`pnpm build`)
- ✅ Test suite (`pnpm test`)
- ✅ Linting (`pnpm lint`)
- ✅ No conflicting dependencies

## Project Structure

```
src/
├── index.ts          # Main export and createSafeFetch
├── types.ts          # TypeScript definitions
├── errors.ts         # Error constructors and utilities  
├── utils.ts          # Helper functions
└── __tests__/        # Test files
```

## Common Contribution Areas

### Bug Fixes
- Check existing [issues](../../issues) first
- Include reproduction steps in your PR
- Add regression tests

### Feature Additions
- Discuss design in an issue first
- Keep features focused and composable
- Update TypeScript types accordingly
- Add comprehensive tests and docs

### Documentation
- Fix typos, improve clarity
- Add missing JSDoc comments
- Update README examples
- Improve error messages

## Getting Help

- **Questions?** Open a [discussion](../../discussions)
- **Bug reports?** Use our [issue template](../../issues/new)
- **Feature ideas?** Start with a [feature request](../../issues/new)

## Code of Conduct

We follow the [Contributor Covenant Code of Conduct](https://www.contributor-covenant.org/version/2/1/code_of_conduct/).

**TL;DR**: Be respectful, helpful, and constructive. We're all here to build something useful together.

---

**Thank you for contributing!** Every improvement, no matter how small, helps make `safe-fetch` better for everyone.