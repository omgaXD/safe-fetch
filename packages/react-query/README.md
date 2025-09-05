# @asouei/safe-fetch-react-query

[![npm version](https://img.shields.io/npm/v/@asouei/safe-fetch-react-query.svg)](https://www.npmjs.com/package/@asouei/safe-fetch-react-query)
[![npm downloads](https://img.shields.io/npm/dw/@asouei/safe-fetch-react-query.svg)](https://www.npmjs.com/package/@asouei/safe-fetch-react-query)
[![bundle size](https://img.shields.io/bundlephobia/minzip/@asouei/safe-fetch-react-query)](https://bundlephobia.com/package/@asouei/safe-fetch-react-query)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

*English version | [Русская версия](README.ru.md)*

**Experimental (0.x)** - TanStack React Query adapter for [@asouei/safe-fetch](../core)

> Converts safe-fetch results to throws and provides sensible defaults for React Query integration.

## What It Does

This adapter bridges the gap between `safe-fetch`'s safe result API (`{ ok: true | false }`) and React Query's expectation of thrown errors for failed requests. It provides:

- **Result conversion**: `{ ok: false, error }` → `throw error`
- **Factory functions**: Ready-made `queryFn` and `mutationFn` creators
- **Sensible defaults**: Recommends `retry: false` to let safe-fetch handle retries

## Installation

```bash
npm install @asouei/safe-fetch @asouei/safe-fetch-react-query @tanstack/react-query
# or
pnpm add @asouei/safe-fetch @asouei/safe-fetch-react-query @tanstack/react-query
```

## Quick Example

```typescript
import { createSafeFetch } from '@asouei/safe-fetch';
import { createQueryFn, createMutationFn, rqDefaults } from '@asouei/safe-fetch-react-query';
import { useQuery, useMutation } from '@tanstack/react-query';

const api = createSafeFetch({ 
  baseURL: '/api', 
  retries: { retries: 2 } // Let safe-fetch handle retries
});

const queryFn = createQueryFn(api);
const mutationFn = createMutationFn(api);

export function useUsers() {
  return useQuery({
    queryKey: ['users'],
    queryFn: queryFn<User[]>('/users'),
    ...rqDefaults(), // Important: { retry: false }
  });
}

export function useCreateUser() {
  return useMutation({
    mutationFn: mutationFn<User>('/users', { method: 'POST' }),
  });
}

// Usage in component
function UserList() {
  const { data: users, error, isLoading } = useUsers();
  const createUser = useCreateUser();

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.name}</div>; // Typed error from safe-fetch
  
  return (
    <div>
      {users?.map(user => <div key={user.id}>{user.name}</div>)}
      <button onClick={() => createUser.mutate({ name: 'New User' })}>
        Add User
      </button>
    </div>
  );
}
```

## API Reference

### `createQueryFn(api)`
Creates a query function factory for React Query.

```typescript
const queryFn = createQueryFn(api);
const getUsersFn = queryFn<User[]>('/users', { 
  headers: { Authorization: 'Bearer token' } 
});

useQuery({
  queryKey: ['users'],
  queryFn: getUsersFn,
  ...rqDefaults()
});
```

### `createMutationFn(api)`
Creates a mutation function factory. Defaults to `POST` method.

```typescript
const mutationFn = createMutationFn(api);
const createUserFn = mutationFn<User>('/users'); // POST by default
const updateUserFn = mutationFn<User>('/users', { method: 'PUT' });

useMutation({
  mutationFn: createUserFn // (body) => Promise<User>
});
```

### `rqDefaults()`
Returns recommended React Query defaults.

```typescript
rqDefaults(); // { retry: false }
```

**Why `retry: false`?** Let safe-fetch handle retries with proper exponential backoff, jitter, and `Retry-After` support instead of React Query's simpler retry logic.

### `unwrap(promise)`
Utility to convert safe results to throws (re-exported from core for convenience).

```typescript
const result = await unwrap(safeFetch.get('/users'));
// Throws on error, returns data on success
```

## Advanced Usage

### Custom Query Hook with Validation

```typescript
import { z } from 'zod';

const UserSchema = z.array(z.object({
  id: z.number(),
  name: z.string(),
  email: z.string().email()
}));

export function useUsers() {
  const queryFn = createQueryFn(api);
  
  return useQuery({
    queryKey: ['users'],
    queryFn: queryFn<z.infer<typeof UserSchema>>('/users', {
      validate: (raw) => {
        const result = UserSchema.safeParse(raw);
        return result.success 
          ? { success: true, data: result.data }
          : { success: false, error: result.error };
      }
    }),
    ...rqDefaults()
  });
}
```

### Error Handling with Type Guards

```typescript
import type { HttpError, NetworkError } from '@asouei/safe-fetch';

const isHttpError = (error: any): error is HttpError => 
  error?.name === 'HttpError';

const isNetworkError = (error: any): error is NetworkError => 
  error?.name === 'NetworkError';

function UserList() {
  const { data, error } = useUsers();
  
  if (error) {
    if (isHttpError(error)) {
      return <div>Server error: {error.status} {error.statusText}</div>;
    }
    if (isNetworkError(error)) {
      return <div>Network error: Check your connection</div>;
    }
    return <div>Unknown error: {error.message}</div>;
  }
  
  return <div>{/* render users */}</div>;
}
```

### Infinite Queries

```typescript
export function useInfiniteUsers() {
  const queryFn = createQueryFn(api);
  
  return useInfiniteQuery({
    queryKey: ['users', 'infinite'],
    queryFn: ({ pageParam = 1 }) => 
      queryFn<{ users: User[]; nextPage?: number }>('/users', {
        query: { page: pageParam, limit: 10 }
      })(),
    getNextPageParam: (lastPage) => lastPage.nextPage,
    ...rqDefaults()
  });
}
```

## Best Practices

### 1. Always use `rqDefaults()`
```typescript
// ✅ Good
useQuery({
  queryKey: ['users'],
  queryFn: queryFn('/users'),
  ...rqDefaults()
});

// ❌ Avoid - React Query will retry with its own logic
useQuery({
  queryKey: ['users'],
  queryFn: queryFn('/users')
  // missing rqDefaults()
});
```

### 2. Configure retries in safe-fetch, not React Query
```typescript
// ✅ Good
const api = createSafeFetch({
  retries: { 
    retries: 2,
    baseDelayMs: 300 
  }
});

// ❌ Avoid - double retries
useQuery({
  queryFn: queryFn('/users'),
  retry: 3 // Don't do this with safe-fetch
});
```

### 3. Handle loading states properly
```typescript
function UserProfile({ id }: { id: string }) {
  const { data: user, isLoading, error } = useQuery({
    queryKey: ['users', id],
    queryFn: queryFn<User>(`/users/${id}`),
    ...rqDefaults()
  });

  // Handle all states explicitly
  if (isLoading) return <UserSkeleton />;
  if (error) return <ErrorBoundary error={error} />;
  if (!user) return <NotFound />; // Shouldn't happen, but be safe
  
  return <div>{user.name}</div>;
}
```

## Compatibility

- **React Query**: v5.x
- **SSR/Next.js**: Compatible (pure functions, no runtime React dependency)
- **Bundle size**: Minimal - only thin wrapper functions

## Why This Approach?

Instead of providing custom hooks like `useSafeQuery`, this adapter focuses on:

1. **Minimal API surface**: Just factory functions
2. **No React peer dependency**: Works in any React Query setup
3. **Composable**: Use with existing React Query patterns
4. **Type-safe**: Preserves safe-fetch's error typing

## Troubleshooting

### "Query function threw an error"
This is expected! The adapter converts `{ ok: false }` results into thrown errors that React Query can handle.

### Type errors with query functions
Make sure to specify the expected return type:
```typescript
// ✅ Good
const queryFn = createQueryFn(api);
const getUserFn = queryFn<User>('/user/123');

// ❌ Type issues
const getUserFn = queryFn('/user/123'); // unknown return type
```

### Retries not working as expected
Remember to use `rqDefaults()` to disable React Query's retries:
```typescript
useQuery({
  queryKey: ['data'],
  queryFn: queryFn('/data'),
  ...rqDefaults() // This sets retry: false
});
```

## Migration from Direct safe-fetch

**Before:**
```typescript
function useUsers() {
  return useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const result = await safeFetch.get<User[]>('/users');
      if (!result.ok) throw result.error;
      return result.data;
    },
    retry: false
  });
}
```

**After:**
```typescript
const queryFn = createQueryFn(api);

function useUsers() {
  return useQuery({
    queryKey: ['users'],
    queryFn: queryFn<User[]>('/users'),
    ...rqDefaults()
  });
}
```

## Roadmap

- **v0.1**: Core adapter functions ✅ **Published**
- **v0.2**: Optional custom hooks (`useSafeQuery`, `useSafeMutation`)
- **v1.0**: Stable production release after community feedback

## License

MIT © [Aleksandr Mikhailishin](https://github.com/asouei)