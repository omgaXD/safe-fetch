# @asouei/safe-fetch

[![npm version](https://img.shields.io/npm/v/@asouei/safe-fetch.svg)](https://www.npmjs.com/package/@asouei/safe-fetch)
[![CI](https://github.com/asouei/safe-fetch/actions/workflows/ci.yml/badge.svg?branch=master)](https://github.com/asouei/safe-fetch/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Open in CodeSandbox](https://img.shields.io/badge/Open%20in-CodeSandbox-black?logo=codesandbox)](https://codesandbox.io/p/sandbox/fkw3z5)

*English version | [Русская версия](README.ru.md)*

> **Never write `try/catch` for HTTP requests again.** Zero-deps • No throws • Total timeout • Retry-After support

Tiny, typed wrapper around `fetch` that returns safe results, handles timeouts intelligently, and retries with exponential backoff.

```typescript
import { safeFetch } from '@asouei/safe-fetch';

const result = await safeFetch.get<{ users: User[] }>('/api/users');
if (result.ok) {
  // TypeScript knows result.data is { users: User[] }
  console.log(result.data.users);
} else {
  // All errors are normalized - no more guessing what went wrong
  console.error(result.error.name); // 'NetworkError' | 'TimeoutError' | 'HttpError' | 'ValidationError'
}
```

## What You Get

- **No throws:** Never write `try/catch` — always get a safe result
- **Typed errors:** `NetworkError | TimeoutError | HttpError | ValidationError`
- **Dual timeouts:** `timeoutMs` per attempt + `totalTimeoutMs` for entire operation
- **Smarter retries:** Only idempotent methods by default + `Retry-After` support
- **Zod-ready validation:** Schema validation without exceptions
- **Zero deps & ~3kb:** Bundle-friendly, tree-shakable, side-effects free

| Feature | `@asouei/safe-fetch` | `axios` | `ky` | native `fetch` |
|---------|---------------------|---------|------|---------------|
| **Bundle size** | ~3kb | ~13kb* | ~11kb* | 0kb |
| **Dependencies** | 0 | 0* | 0* | 0 |
| **Safe results (no throws)** | ✅ | ❌ | ❌ | ❌ |
| **Discriminated union types** | ✅ | ❌ | ❌ | ❌ |
| **Per-attempt + total timeouts** | ✅ | Per-request only | Per-request only | Manual |
| **Smart retries (idempotent-only)** | ✅ | ✅ (throws) | ✅ (throws) | Manual |
| **Retry-After header support** | ✅ | ❌ | ❌ | Manual |
| **Request/Response interceptors** | ✅ | ✅ | ✅ | Manual |
| **Validation hooks (Zod-ready)** | ✅ | ❌ | ❌ | Manual |
| **TypeScript-first design** | ✅ | Partial | ✅ | ✅ |

*Bundle size ~gzip; depends on version, environment and bundler settings.  
**Axios/Ky throw exceptions on non-2xx by default; no built-in total operation timeout.

## Installation

```bash
npm install @asouei/safe-fetch
```

### Import styles

**ESM**
```typescript
import { safeFetch, createSafeFetch } from '@asouei/safe-fetch';
```

**CommonJS**
```javascript
const { safeFetch, createSafeFetch } = require('@asouei/safe-fetch');
// CommonJS supported via exports.require field
```

**CDN (esm.run)**
```html
<script type="module">
  import { safeFetch } from "https://esm.run/@asouei/safe-fetch";
  const res = await safeFetch.get('/api/ping');
</script>
```

## Quick Demo

```typescript
type Todo = { id: number; title: string; completed: boolean };

const api = createSafeFetch({
  baseURL: 'https://jsonplaceholder.typicode.com',
  timeoutMs: 3000,
  totalTimeoutMs: 7000,
  retries: { retries: 2 },
});

const list = await api.get<Todo[]>('/todos', { query: { _limit: 3 } });
if (list.ok) console.log('todos:', list.data.map(t => t.title));

const create = await api.post<Todo>('/todos', { title: 'Learn safe-fetch', completed: false });
if (!create.ok) console.warn('create failed:', create.error);
```

## JSON Parsing & Error Handling

> **JSON parsing behavior:**
> - `204/205` status codes → `null`
> - If `Content-Type` doesn't contain `json` → `null`
> - Invalid JSON doesn't throw exception, returns `null`

**Error types you may encounter:** `NetworkError`, `TimeoutError`, `HttpError`, `ValidationError`.  
All errors are serializable (plain objects), easy to log and monitor.

**Timeout behavior:**
- `timeoutMs` — per attempt timeout
- `totalTimeoutMs` — total operation timeout (includes all retries)

**Tree-shakable, side-effects free** - only imports what you use.

### Safe by Default
No more `try/catch` blocks. Every request returns a discriminated union:
```typescript
type SafeResult<T> = 
  | { ok: true; data: T; response: Response }
  | { ok: false; error: NormalizedError; response?: Response }
```

### Normalized Error Types
All errors are consistently typed and structured:
```typescript
// Network issues, connection failures
type NetworkError = { name: 'NetworkError'; message: string; cause?: unknown }

// Request timeouts (per-attempt or total)
type TimeoutError = { name: 'TimeoutError'; message: string; timeoutMs: number }

// HTTP 4xx/5xx responses
type HttpError = { name: 'HttpError'; message: string; status: number; body?: unknown }

// Schema validation failures  
type ValidationError = { name: 'ValidationError'; message: string; cause?: unknown }
```

### Intelligent Timeouts
Two-tier timeout system for maximum control:
```typescript
const api = createSafeFetch({
  timeoutMs: 5000,        // 5s per attempt
  totalTimeoutMs: 30000   // 30s total (all retries)
});
```

### Smart Retries
Only retries safe operations by default:
- ✅ `GET`, `HEAD` - automatically retried on 5xx, network errors
- ❌ `POST`, `PUT`, `PATCH` - never retried by default (prevents duplication)
- 🎛️ Custom `retryOn` callback for full control

```typescript
const result = await safeFetch.get('/api/flaky-endpoint', {
  retries: {
    retries: 3,
    baseDelayMs: 300,     // Exponential backoff starting at 300ms
    retryOn: ({ response, error }) => {
      // Custom retry logic
      return error?.name === 'NetworkError' || response?.status === 429;
    }
  }
});
```

### Respects Rate Limits
Automatically handles `429 Too Many Requests` with `Retry-After` header:
```typescript
// Server returns: 429 Too Many Requests, Retry-After: 60
// safe-fetch waits exactly 60 seconds before retry
const result = await safeFetch.get('/api/rate-limited', {
  retries: { retries: 3 }
});
```

## Migrate from Axios

**Axios (throws exceptions)**
```typescript
try {
  const { data } = await axios.get<User[]>('/users');
  render(data);
} catch (e) {
  toast(parseAxiosError(e));
}
```

**safe-fetch (no throws)**
```typescript
const res = await safeFetch.get<User[]>('/users');
if (res.ok) render(res.data);
else toast(`${res.error.name}: ${res.error.message}`);
```

## Usage Examples

### Basic Requests

```typescript
import { safeFetch } from '@asouei/safe-fetch';

// GET request with type safety
const users = await safeFetch.get<User[]>('/api/users');
if (users.ok) {
  users.data.forEach(user => console.log(user.name));
}

// POST with JSON body (auto-sets Content-Type)
const newUser = await safeFetch.post('/api/users', {
  name: 'Alice',
  email: 'alice@example.com'
});

// Handle different error types
if (!newUser.ok) {
  switch (newUser.error.name) {
    case 'HttpError':
      // Use type assertion since we know the type from discriminated union
      const httpError = newUser.error as { status: number; message: string };
      console.log(`HTTP ${httpError.status}: ${httpError.message}`);
      break;
    case 'NetworkError':
      console.log('Network connection failed');
      break;
    case 'TimeoutError':
      const timeoutError = newUser.error as { timeoutMs: number };
      console.log(`Request timed out after ${timeoutError.timeoutMs}ms`);
      break;
    case 'ValidationError':
      console.log('Response validation failed');
      break;
  }
}
```

### Configured Instance

```typescript
import { createSafeFetch } from '@asouei/safe-fetch';

const api = createSafeFetch({
  baseURL: 'https://api.example.com',
  headers: { 
    'Authorization': 'Bearer token',
    'User-Agent': 'MyApp/1.0'
  },
  timeoutMs: 8000,
  totalTimeoutMs: 30000,
  retries: { 
    retries: 2,
    baseDelayMs: 500 
  }
});

// All requests use the base configuration
const result = await api.get('/users'); // GET https://api.example.com/users
```

### Response Validation with Zod

Perfect integration with schema validation libraries:

```typescript
import { z } from 'zod';

const UserSchema = z.object({
  id: z.number(),
  name: z.string(),
  email: z.string().email()
});

const validateWith = <T>(schema: z.ZodSchema<T>) => (raw: unknown) => {
  const r = schema.safeParse(raw);
  return r.success 
    ? { success: true as const, data: r.data } 
    : { success: false as const, error: r.error };
};

const result = await safeFetch.get('/api/user/123', {
  validate: validateWith(UserSchema)
});

if (result.ok) {
  // result.data is fully typed as z.infer<typeof UserSchema>
  console.log(result.data.email); // TypeScript knows this is a valid email
}
```

### Request/Response Interceptors

```typescript
const api = createSafeFetch({
  interceptors: {
    onRequest: (url, init) => {
      // Add auth token
      const headers = new Headers(init.headers);
      headers.set('Authorization', `Bearer ${getToken()}`);
      init.headers = headers;
      
      console.log(`→ ${init.method} ${url}`);
    },
    
    onResponse: (response) => {
      console.log(`← ${response.status} ${response.url}`);
      
      // Handle global auth errors
      if (response.status === 401) {
        redirectToLogin();
      }
    },
    
    onError: (error) => {
      // Send errors to monitoring service
      analytics.track('http_error', {
        error_name: error.name,
        message: error.message
      });
    }
  }
});
```

### Error Mapping

Transform errors into domain-specific types:

```typescript
const api = createSafeFetch({
  errorMap: (error) => {
    if (error.name === 'HttpError' && error.status === 404) {
      return {
        name: 'NotFoundError',
        message: 'Resource not found',
        status: 404
      } as any; // Type assertion needed for extending domain errors
    }
    
    if (error.name === 'HttpError' && error.status === 401) {
      return {
        name: 'AuthError', 
        message: 'Authentication required',
        status: 401
      } as any;
    }
    
    return error;
  }
});
```

### File Uploads & Different Content Types

```typescript
// JSON (automatic Content-Type)
await safeFetch.post('/api/users', { name: 'John' });

// Form data
const formData = new FormData();
formData.append('file', fileInput.files[0]);
formData.append('description', 'Profile picture');
await safeFetch.post('/api/upload', formData);

// Raw text
await safeFetch.post('/api/webhook', 'plain text', {
  headers: { 'Content-Type': 'text/plain' }
});

// Get different response types
const csv = await safeFetch.get('/api/export.csv', { parseAs: 'text' });
const blob = await safeFetch.get('/api/image.jpg', { parseAs: 'blob' });
const raw = await safeFetch.get('/api/stream', { parseAs: 'response' });
```

### AbortController Support

```typescript
const controller = new AbortController();

const promise = safeFetch.get('/api/long-request', {
  signal: controller.signal,
  timeoutMs: 10000
});

// Cancel after 5 seconds
setTimeout(() => controller.abort(), 5000);

const result = await promise;
if (!result.ok && result.error.name === 'NetworkError') {
  console.log('Request was cancelled');
}
```

## Utility Helpers

### Unwrap for Exception-Based Code

```typescript
import type { SafeResult } from '@asouei/safe-fetch';

export const unwrap = async <T>(promise: Promise<SafeResult<T>>): Promise<T> => {
  const result = await promise;
  if (!result.ok) throw result.error;
  return result.data;
};

// Use when you want traditional exception handling
try {
  const users = await unwrap(safeFetch.get<User[]>('/api/users'));
  console.log(users); // User[] - no need to check result.ok
} catch (error) {
  console.error(error); // NormalizedError with consistent structure
}
```

### Type Guards for Error Handling

```typescript
export const isHttpError = (e: unknown): e is { name: 'HttpError'; status: number; statusText: string } =>
  !!e && typeof e === 'object' && (e as any).name === 'HttpError' && typeof (e as any).status === 'number';

export const isNetworkError = (e: unknown): e is { name: 'NetworkError'; message: string } =>
  !!e && typeof e === 'object' && (e as any).name === 'NetworkError';

// Usage
const result = await safeFetch.get('/api/data');
if (!result.ok) {
  if (isHttpError(result.error)) {
    console.log(`HTTP ${result.error.status}: ${result.error.statusText}`);
  } else if (isNetworkError(result.error)) {
    console.log('Network connection failed');
  }
}
```

## Limitations (by design)

- No built-in caching/request deduplication (use SWR/TanStack Query)
- No automatic request/response transformations (keeps behavior predictable)
- Won't retry non-idempotent methods (POST/PUT/PATCH) without explicit `retryOn`

## Who Is It For?

- Teams tired of inconsistent `try/catch` blocks and implicit error handling
- Projects with strict SLA requirements needing total timeouts and proper retries
- TypeScript codebases requiring precise error type definitions
- Developers who want fetch's simplicity with production-ready reliability

## Playground

Try safe-fetch online with ready-to-run examples:  
**CodeSandbox:** [Open Interactive Demo](https://codesandbox.io/p/sandbox/fkw3z5)

## Roadmap

- ✅ `Retry-After` (seconds/date) and exponential backoff with jitter
- ✅ Total operation timeout (`totalTimeoutMs`)
- ⏳ React Query/SWR adapter generators (`unwrap*` helpers)
- ⏳ ESLint plugin for `{ ok }` pattern invariants
- ⏳ Framework examples: Next.js, Cloudflare Workers, Remix

## Browser & Runtime Support

- **Node.js**: 18+ (uses built-in `fetch`)
- **Bun**: 1.1+ (with `fetch` support)
- **Browsers**: All modern browsers (Chrome 63+, Firefox 57+, Safari 10.1+)
- **SSR**: Next.js, Nuxt, SvelteKit compatible

### Edge/Workers

Works in Cloudflare Workers and Vercel Edge Runtime (uses global `fetch`):

```typescript
// Cloudflare Worker
const isHttpError = (e: unknown): e is { name: 'HttpError'; status: number } =>
  !!e && typeof e === 'object' && (e as any).name === 'HttpError' && typeof (e as any).status === 'number';

export default {
  async fetch() {
    const res = await safeFetch.get<{ ok: boolean }>('https://api.example.com/ping');
    
    if (res.ok) {
      return new Response(JSON.stringify(res.data), { 
        headers: { 'content-type': 'application/json' } 
      });
    }
    
    const status = isHttpError(res.error) ? res.error.status : 500;
    return new Response(res.error.message, { status });
  }
};
```

## Recipes

### Auth refresh (401 → refresh → retry once)

```typescript
const api = createSafeFetch({
  interceptors: {
    onResponse: async (res) => {
      if (res.status === 401) await refreshToken();
    }
  }
});

const res = await api.get('/me', {
  retries: {
    retries: 1,
    retryOn: ({ response }) => response?.status === 401
  }
});
```

### GraphQL helper

```typescript
type GQL<T> = { data?: T; errors?: any[] };

const gql = <T>(query: string, variables?: any) =>
  safeFetch.post<GQL<T>>('/graphql', { query, variables }, { 
    validate: v =>
      v && !v.errors 
        ? { success: true, data: v.data as T }
        : { success: false, error: v?.errors }
  });

// Usage
const result = await gql<User>('query { user(id: "123") { name email } }');
```

### React Query / SWR Integration

```typescript
// React Query
import { useQuery } from '@tanstack/react-query';
import { safeFetch } from '@asouei/safe-fetch';

export function useUsers() {
  return useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const r = await safeFetch.get<User[]>('/api/users');
      if (!r.ok) throw r.error; // RQ expects exceptions for error states
      return r.data;
    },
    retry: false, // rely on safe-fetch internal retries
  });
}

// SWR
import useSWR from 'swr';

const fetcher = async (url: string) => {
  const r = await safeFetch.get(url);
  if (!r.ok) throw r.error;
  return r.data;
};

export function UserProfile({ id }: { id: string }) {
  const { data, error } = useSWR(`/api/users/${id}`, fetcher);
  if (error) return <div>Error: {error.message}</div>;
  if (!data) return <div>Loading...</div>;
  return <div>Hello, {data.name}!</div>;
}
```

### Security & Credentials

```typescript
const api = createSafeFetch({
  baseURL: 'https://api.example.com',
  credentials: 'include', // Cookie-based authentication
  timeoutMs: 5000,
  totalTimeoutMs: 20000,
  headers: {
    'X-Requested-With': 'XMLHttpRequest'
  }
});

// The library doesn't change CORS/cookie policy; behavior identical to fetch
```

```typescript
// app/users/page.tsx
import { safeFetch } from '@asouei/safe-fetch';

export default async function Page() {
  const res = await safeFetch.get<User[]>('https://api.example.com/users');
  if (!res.ok) return <pre>Error: {res.error.name}</pre>;
  return <ul>{res.data.map(u => <li key={u.id}>{u.name}</li>)}</ul>;
}
```

## API Reference

### `createSafeFetch(config?)`

**Configuration Options:**

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `baseURL` | `string` | - | Base URL for all requests |
| `headers` | `Record<string, string>` | `{}` | Default headers |
| `query` | `Record<string, any>` | `{}` | Default query parameters |
| `timeoutMs` | `number` | `0` | Per-attempt timeout in milliseconds |
| `totalTimeoutMs` | `number` | `0` | Total timeout for all retry attempts |
| `retries` | `RetryStrategy` | `false` | Retry configuration |
| `parseAs` | `ParseAs` | `'json'` | Default response parsing method |
| `errorMap` | `ErrorMapper` | - | Transform errors before returning |
| `interceptors` | `Interceptors` | - | Request/response/error hooks |

### Method Signatures

```typescript
// Basic request
safeFetch<T>(url: string, options?: SafeFetchRequest<T>): Promise<SafeResult<T>>

// HTTP method shortcuts
safeFetch.get<T>(url: string, options?: SafeFetchRequest<T>): Promise<SafeResult<T>>
safeFetch.post<T>(url: string, body?: unknown, options?: SafeFetchRequest<T>): Promise<SafeResult<T>>
safeFetch.put<T>(url: string, body?: unknown, options?: SafeFetchRequest<T>): Promise<SafeResult<T>>
safeFetch.patch<T>(url: string, body?: unknown, options?: SafeFetchRequest<T>): Promise<SafeResult<T>>
safeFetch.delete<T>(url: string, options?: SafeFetchRequest<T>): Promise<SafeResult<T>>
```

### Validation Function

```typescript
validate: (raw: unknown) => { success: true, data: T } | { success: false, error: any }
```

## Why Not Axios/Ky?

### vs Axios
- **No exceptions:** No "magic" global error handling — explicit `{ ok }` checking
- **Smaller bundle:** ~3kb vs ~13kb*
- **Modern platform:** Native fetch, no abstraction layers
- **Better for TypeScript:** Discriminated unions instead of catching any errors
- **Total timeout:** `totalTimeoutMs` for entire operation, not just single request

### vs Ky
- **Safe results:** Predictable control flow (no throws)
- **Safer retries:** Won't retry POST by default to prevent side-effect duplication
- **Retry-After support:** Respects server rate-limiting headers
- **Validation hooks:** Zod integration without exceptions

### vs Native Fetch
- **Normalized errors:** Consistent `Network/Timeout/Http/Validation` structure
- **Retries + backoff + jitter:** No need to reinvent the wheel
- **Dual timeouts:** Per-attempt and total operation timeouts
- **Conveniences:** Method shortcuts, auto JSON handling, interceptors

## FAQ

**Why not throw exceptions?**
Explicit control flow through `{ ok }` is easier to read, type, and test than try/catch around every operation.

**Can I still throw exceptions if needed?**
Yes - use the `unwrap(result)` helper from the Utilities section.

**Why don't POST/PUT/PATCH retry by default?**
To prevent duplicating side effects. Enable retries for non-idempotent methods explicitly via `retryOn` callback.

**Does this work with React Query/SWR?**
Perfectly! Just wrap your safeFetch calls or use the `unwrap` helper.

## Contributing

Contributions are welcome! Please read our [Contributing Guide](CONTRIBUTING.md) for details.

**Development Setup:**
```bash
git clone https://github.com/asouei/safe-fetch.git
cd safe-fetch
pnpm install
pnpm test
pnpm build
```

**Versioning:** We follow [Semantic Versioning](https://semver.org/). See [CHANGELOG.md](CHANGELOG.md) for release history.

**Support policy:** Minimum environment — Node 18+, modern browsers (ES2017+). We follow Node.js LTS cycles.

## License

MIT © [Aleksandr Mikhailishin](https://github.com/asouei)

---

**Made with ❤️ for developers who value predictable, type-safe HTTP clients.**