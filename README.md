# @asouei/safe-fetch

[![npm version](https://img.shields.io/npm/v/@asouei/safe-fetch.svg)](https://www.npmjs.com/package/@asouei/safe-fetch)
[![CI](https://github.com/asouei/safe-fetch/actions/workflows/ci.yml/badge.svg?branch=master)](https://github.com/asouei/safe-fetch/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![npm downloads](https://img.shields.io/npm/dm/@asouei/safe-fetch)](https://www.npmjs.com/package/@asouei/safe-fetch)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)](https://www.typescriptlang.org/)
[![Bundle Size](https://img.shields.io/bundlephobia/minzip/@asouei/safe-fetch)](https://bundlephobia.com/package/@asouei/safe-fetch)
[![Zero Dependencies](https://img.shields.io/badge/dependencies-0-green.svg)](package.json)
[![Open in CodeSandbox](https://img.shields.io/badge/Open%20in-CodeSandbox-black?logo=codesandbox)](https://codesandbox.io/p/sandbox/fkw3z5)
[![Awesome](https://awesome.re/badge-flat2.svg)](https://github.com/dzharii/awesome-typescript)


*English version | [Русская версия](README.ru.md)*

> **Never write `try/catch` for HTTP requests again.** A complete ecosystem of type-safe HTTP utilities built around safe results and predictable error handling.

Modern HTTP client ecosystem that eliminates exceptions through discriminated unions, provides intelligent retries, handles timeouts properly, and integrates seamlessly with popular data fetching libraries.

## 📦 Packages

| Package | Version | Description |
|---------|---------|-------------|
| **[@asouei/safe-fetch](packages/core)** | [![npm](https://img.shields.io/npm/v/@asouei/safe-fetch.svg)](https://npmjs.com/package/@asouei/safe-fetch) | Core HTTP client with safe results, retries, and timeouts |
| **[@asouei/safe-fetch-react-query](packages/react-query)** | [![npm](https://img.shields.io/npm/v/@asouei/safe-fetch-react-query.svg)](https://npmjs.com/package/@asouei/safe-fetch-react-query) | TanStack Query integration with optimized error handling |

## 🚀 Quick Start

```bash
npm install @asouei/safe-fetch
```

```typescript
import { safeFetch } from '@asouei/safe-fetch';

const result = await safeFetch.get<{ users: User[] }>('/api/users');
if (result.ok) {
  // TypeScript knows result.data is { users: User[] }
  console.log(result.data.users);
} else {
  // All errors are normalized and typed
  console.error(`${result.error.name}: ${result.error.message}`);
}
```

## ✨ Why safe-fetch?

- **🛡️ No Exceptions**: Never write `try/catch` — always get a safe result
- **🔧 Typed Errors**: `NetworkError | TimeoutError | HttpError | ValidationError`
- **⏱️ Smart Timeouts**: Per-attempt + total operation timeouts
- **🔄 Intelligent Retries**: Only retries safe operations + `Retry-After` support
- **📦 Zero Dependencies**: Tree-shakable, ~3kb, works everywhere
- **🧪 Validation Ready**: Built-in Zod integration without exceptions

## 📖 Documentation

- **[Core Library](packages/core/README.md)** - Complete API documentation, examples, and migration guides
- **[React Query Adapter](packages/react-query/README.md)** - TanStack Query integration

## 🌟 Core Features

### Safe Results
Every request returns a discriminated union - no more guessing what went wrong:

```typescript
type SafeResult<T> = 
  | { ok: true; data: T; response: Response }
  | { ok: false; error: NormalizedError; response?: Response }
```

### Normalized Errors
All errors follow the same structure:

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

### Smart Configuration

```typescript
import { createSafeFetch } from '@asouei/safe-fetch';

const api = createSafeFetch({
  baseURL: 'https://api.example.com',
  timeoutMs: 5000,        // Per attempt
  totalTimeoutMs: 30000,  // Total operation  
  retries: { 
    retries: 2,
    baseDelayMs: 300      // Exponential backoff
  },
  headers: { Authorization: 'Bearer token' }
});

const result = await api.get<User[]>('/users');
```

## 🔮 Ecosystem Roadmap

- ✅ **Core Library** - Safe HTTP client with retries and timeouts
- ✅ **React Query Adapter** - Optimized TanStack Query integration
- 📋 **SWR Adapter** - SWR integration helpers
- 🔍 **ESLint Plugin** - Enforce safe result patterns
- 🏗️ **Framework Examples** - Next.js, Remix, Cloudflare Workers

## 📱 Framework Integration

### React Query
```typescript
import { createSafeFetch } from '@asouei/safe-fetch';
import { createQueryFn, rqDefaults } from '@asouei/safe-fetch-react-query';

const api = createSafeFetch({ baseURL: '/api' });
const queryFn = createQueryFn(api);

export function useUsers() {
  return useQuery({
    queryKey: ['users'],
    queryFn: queryFn<User[]>('/users'),
    ...rqDefaults() // { retry: false } - let safe-fetch handle retries
  });
}
```

### Next.js / SSR
```typescript
// app/users/page.tsx
import { safeFetch } from '@asouei/safe-fetch';

export default async function UsersPage() {
  const result = await safeFetch.get<User[]>('/api/users');
  
  if (!result.ok) {
    return <ErrorPage error={result.error} />;
  }
  
  return <UserList users={result.data} />;
}
```

### Cloudflare Workers
```typescript
export default {
  async fetch(request: Request) {
    const result = await safeFetch.get<{ status: string }>('https://api.service.com/health');
    
    return new Response(
      result.ok ? JSON.stringify(result.data) : result.error.message,
      { status: result.ok ? 200 : 500 }
    );
  }
};
```

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

**Quick development setup:**
```bash
git clone https://github.com/asouei/safe-fetch.git
cd safe-fetch
pnpm install
pnpm -r test
pnpm -r build
```

## 📄 License

MIT © [Aleksandr Mikhailishin](https://github.com/asouei)

---

**Built with ❤️ for developers who value predictable, type-safe HTTP clients.**