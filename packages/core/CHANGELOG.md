# Changelog

All notable changes to **@asouei/safe-fetch** will be documented here.  
We follow [Semantic Versioning](https://semver.org/).

## [1.0.0] - 2025-09-05

### Changed
**First stable release of @asouei/safe-fetch**

- **Monorepo structure**: Moved to monorepo workspace for better ecosystem management
- **Build system**: Migrated from custom build to Vite for improved development experience
- **Test framework**: Updated from Jest to Vitest for better ESM support and performance
- **CI/CD**: Enhanced GitHub Actions workflow for monorepo compatibility

### Internal
- Refactored test suite structure for monorepo workspace
- Updated package.json exports for improved ESM/CJS dual compatibility
- Enhanced TypeScript configuration with stricter type checking
- Improved bundling configuration with Vite plugin ecosystem

### Documentation
- Updated README with monorepo context and ecosystem overview
- Enhanced examples with framework integration patterns
- Added cross-references to React Query adapter package
- Improved migration guides and troubleshooting sections

### Technical Details
- **No breaking changes**: All public APIs remain identical
- **No runtime changes**: Zero impact on library behavior or performance
- **Compatibility**: Maintains full backward compatibility with 0.1.x
- **Dependencies**: Still zero runtime dependencies

---

## [0.1.0] - 2025-09-01

### Added

#### Core Features
- **Safe result API**: Discriminated unions `{ ok: true | false }` eliminate try/catch
- **Normalized errors**: Consistent `NetworkError | TimeoutError | HttpError | ValidationError`
- **Dual timeout system**: Per-attempt (`timeoutMs`) + total operation (`totalTimeoutMs`)
- **Smart retries**: Exponential backoff with jitter, respects `Retry-After` headers
- **HTTP method shortcuts**: `get`, `post`, `put`, `patch`, `delete` convenience methods
- **Multiple parsing modes**: `json`, `text`, `blob`, `arrayBuffer`, `response`

#### Advanced Features
- **Request/response interceptors**: `onRequest`, `onResponse`, `onError` hooks
- **Validation integration**: Schema validation without exceptions (Zod-ready)
- **Error mapping**: Transform errors to domain-specific types
- **AbortController support**: Full request cancellation capabilities
- **Configurable instances**: Base URL, headers, query params, timeouts

#### Technical Excellence
- **Zero dependencies**: No external runtime dependencies
- **Tree-shakable**: ~3kb minified + gzipped
- **TypeScript-first**: Full type inference and safety
- **Side-effect free**: Pure functions, safe for SSR

#### Browser & Runtime Support
- **Node.js**: 18+ (uses built-in fetch)
- **Browsers**: All modern browsers (Chrome 63+, Firefox 57+, Safari 10.1+)
- **Edge runtimes**: Cloudflare Workers, Vercel Edge Runtime, Deno
- **SSR frameworks**: Next.js, Nuxt, SvelteKit, Remix

#### Error Handling
- **Network errors**: Connection failures, DNS resolution issues
- **Timeout errors**: Per-attempt and total operation timeouts
- **HTTP errors**: 4xx/5xx responses with status codes and response bodies
- **Validation errors**: Schema validation failures with detailed context

#### Retry Logic
- **Idempotent-only**: Only retries GET/HEAD by default (prevents side-effect duplication)
- **Exponential backoff**: Configurable base delay with jitter
- **Retry-After support**: Respects server rate-limiting headers
- **Custom retry logic**: `retryOn` callback for advanced scenarios

### Examples
```typescript
// Basic usage
const result = await safeFetch.get<User[]>('/api/users');
if (result.ok) {
  console.log(result.data); // User[]
} else {
  console.error(result.error.name); // 'NetworkError' | 'TimeoutError' | etc.
}

// Configured instance
const api = createSafeFetch({
  baseURL: 'https://api.example.com',
  timeoutMs: 5000,
  retries: { retries: 2, baseDelayMs: 300 }
});

// With validation
const result = await safeFetch.get('/user/123', {
  validate: (data) => UserSchema.safeParse(data).success 
    ? { success: true, data } 
    : { success: false, error: 'Invalid user data' }
});
```

---

## Migration Guide

### From other HTTP clients

#### From Axios
```typescript
// Before (Axios)
try {
  const { data } = await axios.get<User[]>('/users');
  setUsers(data);
} catch (error) {
  setError(parseAxiosError(error));
}

// After (safe-fetch)
const result = await safeFetch.get<User[]>('/users');
if (result.ok) {
  setUsers(result.data);
} else {
  setError(result.error.message);
}
```

#### From native fetch
```typescript
// Before (native fetch)
try {
  const response = await fetch('/users');
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  const users = await response.json();
  setUsers(users);
} catch (error) {
  setError(error.message);
}

// After (safe-fetch)
const result = await safeFetch.get<User[]>('/users');
if (result.ok) {
  setUsers(result.data);
} else {
  setError(result.error.message);
}
```

## Future Roadmap

### Planned Features
- **v1.1.0**: Performance optimizations, enhanced debugging tools
- **v1.2.0**: Built-in request deduplication, advanced caching helpers
- **v2.0.0**: Potential API refinements based on ecosystem feedback

### Ecosystem Integration
- **React Query adapter**: `@asouei/safe-fetch-react-query` available
- **SWR adapter**: Planned for Q2 2025
- **ESLint plugin**: Planned for H2 2025

For the complete ecosystem roadmap, see the [main repository CHANGELOG](../../CHANGELOG.md).