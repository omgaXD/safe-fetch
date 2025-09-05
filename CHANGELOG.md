# Changelog

All notable changes to the **@asouei/safe-fetch** ecosystem will be documented here.  
We follow [Semantic Versioning](https://semver.org/).

## [September 2025] - Monorepo & React Query Adapter

### @asouei/safe-fetch@1.0.0
**First stable release**
**Minor release - No breaking changes**

#### Changed
- **Monorepo structure**: Moved to monorepo workspace for better ecosystem management
- **Build system**: Updated to Vite + Vitest for improved development experience
- **CI/CD**: Enhanced GitHub Actions workflow for multiple packages

#### Internal
- Refactored test suite for monorepo compatibility
- Updated package.json exports for better ESM/CJS compatibility
- Improved TypeScript configuration across packages

#### Documentation
- Updated README with monorepo structure
- Added ecosystem overview with package comparison table
- Enhanced examples for framework integrations

### @asouei/safe-fetch-react-query@0.1.0
**New package - Experimental release**

#### Added
- **Core adapter functions:**
  - `createQueryFn(api)` - Factory for React Query compatible query functions
  - `createMutationFn(api)` - Factory for React Query compatible mutation functions
  - `rqDefaults()` - Returns `{ retry: false }` for optimal safe-fetch integration
  - `unwrap(promise)` - Utility to convert safe results to throws

- **Features:**
  - Seamless integration between safe-fetch and TanStack React Query v5.x
  - Preserves safe-fetch's typed error system in React Query error states
  - Zero additional dependencies beyond peer requirements
  - Full TypeScript support with type inference

- **Documentation:**
  - Complete README with usage examples and best practices
  - Troubleshooting guide for common TypeScript discriminated union issues
  - Migration examples from direct safe-fetch usage

---

## [September 2025] - Foundation Release

### @asouei/safe-fetch@0.1.0
**Initial release**

#### Added
- **Core safe result API**: `{ ok: true | false }` discriminated unions
- **Normalized error types**: `NetworkError | TimeoutError | HttpError | ValidationError`
- **Smart timeout system**: Per-attempt (`timeoutMs`) + total operation (`totalTimeoutMs`)
- **Intelligent retries**: Exponential backoff with jitter, `Retry-After` header support
- **Request/response interceptors**: `onRequest`, `onResponse`, `onError` hooks
- **Validation integration**: Zod-ready validation without exceptions
- **Zero dependencies**: Tree-shakable, ~3kb bundle size

#### Features
- HTTP method shortcuts: `get`, `post`, `put`, `patch`, `delete`
- Multiple parsing options: `json`, `text`, `blob`, `arrayBuffer`, `response`
- AbortController support for request cancellation
- Automatic JSON handling with graceful fallbacks
- Configurable base URLs, headers, and query parameters
- Error mapping for domain-specific error transformation

#### Browser & Runtime Support
- Node.js 18+ (built-in fetch)
- All modern browsers (Chrome 63+, Firefox 57+, Safari 10.1+)
- Cloudflare Workers, Vercel Edge Runtime
- SSR frameworks: Next.js, Nuxt, SvelteKit

---

## Future Roadmap

### Planned Releases

#### @asouei/safe-fetch@1.2.0
- Performance optimizations for high-frequency requests
- Enhanced error context and stack traces
- Optional request/response logging utilities

#### @asouei/safe-fetch-react-query@1.0.0
- Stable API after community feedback
- Custom hooks: `useSafeQuery`, `useSafeMutation`
- React Query DevTools integration

#### New Packages (TBD)
- **@asouei/safe-fetch-swr** - SWR integration adapter
- **@asouei/eslint-plugin-safe-fetch** - ESLint rules for safe result patterns
- **@asouei/safe-fetch-openapi** - OpenAPI schema integration

### Community & Ecosystem
- Framework examples repository (Next.js, Remix, Cloudflare Workers)
- VS Code extension for safe-fetch snippets
- Integration guides for popular libraries (Apollo, Relay, etc.)

---

## Contributing

We welcome contributions to any package in the ecosystem! Please see our [Contributing Guide](CONTRIBUTING.md) for details on:

- Development setup for monorepo
- Package-specific contribution guidelines
- Release process and versioning strategy
- Testing requirements across packages

## Migration Guides

### From @asouei/safe-fetch@1.0.x to 1.1.x
**No breaking changes** - this is a pure infrastructure update:
- All APIs remain identical
- Zero code changes required
- Package exports enhanced for better compatibility

### From Direct safe-fetch to React Query Adapter
See [@asouei/safe-fetch-react-query README](packages/react-query/README.md#migration-from-direct-safe-fetch) for detailed migration examples.