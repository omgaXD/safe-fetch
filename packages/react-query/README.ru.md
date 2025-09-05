# @asouei/safe-fetch-react-query

[![npm version](https://img.shields.io/npm/v/@asouei/safe-fetch-react-query.svg)](https://www.npmjs.com/package/@asouei/safe-fetch-react-query)
[![npm downloads](https://img.shields.io/npm/dw/@asouei/safe-fetch-react-query.svg)](https://www.npmjs.com/package/@asouei/safe-fetch-react-query)
[![bundle size](https://img.shields.io/bundlephobia/minzip/@asouei/safe-fetch-react-query)](https://bundlephobia.com/package/@asouei/safe-fetch-react-query)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

*[English version](README.md) | Русская версия*

**Экспериментальная (0.x)** - адаптер TanStack React Query для [@asouei/safe-fetch](../core)

> Преобразует результаты safe-fetch в исключения и предоставляет разумные значения по умолчанию для интеграции с React Query.

## Что это делает

Этот адаптер соединяет API безопасных результатов `safe-fetch` (`{ ok: true | false }`) с ожиданием React Query получать брошенные ошибки для неудачных запросов. Он предоставляет:

- **Преобразование результатов**: `{ ok: false, error }` → `throw error`
- **Фабричные функции**: Готовые создатели `queryFn` и `mutationFn`
- **Разумные значения по умолчанию**: Рекомендует `retry: false`, чтобы safe-fetch обрабатывал повторы

## Установка

```bash
npm install @asouei/safe-fetch @asouei/safe-fetch-react-query @tanstack/react-query
# или
pnpm add @asouei/safe-fetch @asouei/safe-fetch-react-query @tanstack/react-query
```

## Быстрый пример

```typescript
import { createSafeFetch } from '@asouei/safe-fetch';
import { createQueryFn, createMutationFn, rqDefaults } from '@asouei/safe-fetch-react-query';
import { useQuery, useMutation } from '@tanstack/react-query';

const api = createSafeFetch({ 
  baseURL: '/api', 
  retries: { retries: 2 } // Пусть safe-fetch обрабатывает повторы
});

const queryFn = createQueryFn(api);
const mutationFn = createMutationFn(api);

export function useUsers() {
  return useQuery({
    queryKey: ['users'],
    queryFn: queryFn<User[]>('/users'),
    ...rqDefaults(), // Важно: { retry: false }
  });
}

export function useCreateUser() {
  return useMutation({
    mutationFn: mutationFn<User>('/users', { method: 'POST' }),
  });
}

// Использование в компоненте
function UserList() {
  const { data: users, error, isLoading } = useUsers();
  const createUser = useCreateUser();

  if (isLoading) return <div>Загрузка...</div>;
  if (error) return <div>Ошибка: {error.name}</div>; // Типизированная ошибка от safe-fetch
  
  return (
    <div>
      {users?.map(user => <div key={user.id}>{user.name}</div>)}
      <button onClick={() => createUser.mutate({ name: 'Новый пользователь' })}>
        Добавить пользователя
      </button>
    </div>
  );
}
```

## Справочник API

### `createQueryFn(api)`
Создает фабрику функций запросов для React Query.

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
Создает фабрику функций мутаций. По умолчанию использует метод `POST`.

```typescript
const mutationFn = createMutationFn(api);
const createUserFn = mutationFn<User>('/users'); // POST по умолчанию
const updateUserFn = mutationFn<User>('/users', { method: 'PUT' });

useMutation({
  mutationFn: createUserFn // (body) => Promise<User>
});
```

### `rqDefaults()`
Возвращает рекомендуемые значения по умолчанию для React Query.

```typescript
rqDefaults(); // { retry: false }
```

**Почему `retry: false`?** Пусть safe-fetch обрабатывает повторы с правильным экспоненциальным отступом, джиттером и поддержкой `Retry-After` вместо более простой логики повторов React Query.

### `unwrap(promise)`
Утилита для преобразования безопасных результатов в исключения (реэкспортирована из core для удобства).

```typescript
const result = await unwrap(safeFetch.get('/users'));
// Бросает исключение при ошибке, возвращает данные при успехе
```

## Расширенное использование

### Кастомный хук запроса с валидацией

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

### Обработка ошибок с Type Guards

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
      return <div>Ошибка сервера: {error.status} {error.statusText}</div>;
    }
    if (isNetworkError(error)) {
      return <div>Сетевая ошибка: Проверьте подключение</div>;
    }
    return <div>Неизвестная ошибка: {error.message}</div>;
  }
  
  return <div>{/* отрисовка пользователей */}</div>;
}
```

### Бесконечные запросы

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

## Лучшие практики

### 1. Всегда используйте `rqDefaults()`
```typescript
// ✅ Хорошо
useQuery({
  queryKey: ['users'],
  queryFn: queryFn('/users'),
  ...rqDefaults()
});

// ❌ Избегайте - React Query будет повторять со своей логикой
useQuery({
  queryKey: ['users'],
  queryFn: queryFn('/users')
  // отсутствует rqDefaults()
});
```

### 2. Настраивайте повторы в safe-fetch, а не в React Query
```typescript
// ✅ Хорошо
const api = createSafeFetch({
  retries: { 
    retries: 2,
    baseDelayMs: 300 
  }
});

// ❌ Избегайте - двойные повторы
useQuery({
  queryFn: queryFn('/users'),
  retry: 3 // Не делайте так с safe-fetch
});
```

### 3. Правильно обрабатывайте состояния загрузки
```typescript
function UserProfile({ id }: { id: string }) {
  const { data: user, isLoading, error } = useQuery({
    queryKey: ['users', id],
    queryFn: queryFn<User>(`/users/${id}`),
    ...rqDefaults()
  });

  // Явно обрабатывайте все состояния
  if (isLoading) return <UserSkeleton />;
  if (error) return <ErrorBoundary error={error} />;
  if (!user) return <NotFound />; // Не должно произойти, но будьте осторожны
  
  return <div>{user.name}</div>;
}
```

## Совместимость

- **React Query**: v5.x
- **SSR/Next.js**: Совместимо (чистые функции, без runtime зависимости от React)
- **Размер бандла**: Минимальный - только тонкие обертки

## Почему такой подход?

Вместо предоставления кастомных хуков типа `useSafeQuery`, этот адаптер фокусируется на:

1. **Минимальная поверхность API**: Только фабричные функции
2. **Без peer зависимости от React**: Работает в любой настройке React Query
3. **Композабельность**: Используйте с существующими паттернами React Query
4. **Типобезопасность**: Сохраняет типизацию ошибок safe-fetch

## Устранение неполадок

### "Query function threw an error"
Это ожидаемо! Адаптер преобразует результаты `{ ok: false }` в брошенные ошибки, которые может обрабатывать React Query.

### Ошибки типов с функциями запросов
Убедитесь, что указали ожидаемый тип возврата:
```typescript
// ✅ Хорошо
const queryFn = createQueryFn(api);
const getUserFn = queryFn<User>('/user/123');

// ❌ Проблемы с типами
const getUserFn = queryFn('/user/123'); // неизвестный тип возврата
```

### Повторы работают не как ожидалось
Не забывайте использовать `rqDefaults()` для отключения повторов React Query:
```typescript
useQuery({
  queryKey: ['data'],
  queryFn: queryFn('/data'),
  ...rqDefaults() // Это устанавливает retry: false
});
```

## Миграция с прямого safe-fetch

**До:**
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

**После:**
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

## Дорожная карта

- **v0.1**: Основные функции адаптера ✅ **Опубликовано**
- **v0.2**: Опциональные кастомные хуки (`useSafeQuery`, `useSafeMutation`)
- **v1.0**: Стабильный продакшн релиз после отзывов сообщества

## Лицензия

MIT © [Aleksandr Mikhailishin](https://github.com/asouei)