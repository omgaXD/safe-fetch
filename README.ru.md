# @asouei/safe-fetch

*[English version](README.md) | Русская версия*

> **Никогда больше не пишите `try/catch` для HTTP-запросов.** Ноль зависимостей • Не бросает исключения • Полный таймаут • Поддержка Retry-After

Маленькая, типизированная обертка вокруг `fetch`, которая возвращает безопасные результаты, умно обрабатывает таймауты и повторяет запросы с экспоненциальным отступом.

```typescript
import { safeFetch } from '@asouei/safe-fetch';

const result = await safeFetch.get<{ users: User[] }>('/api/users');
if (result.ok) {
  // TypeScript знает, что result.data это { users: User[] }
  console.log(result.data.users);
} else {
  // Все ошибки нормализованы - больше не нужно угадывать что пошло не так
  console.error(result.error.name); // 'NetworkError' | 'TimeoutError' | 'HttpError' | 'ValidationError'
}
```

## Что вы получаете

- **Не бросает исключения:** Никогда не пишите `try/catch` — всегда получайте безопасный результат
- **Типизированные ошибки:** `NetworkError | TimeoutError | HttpError | ValidationError`
- **Двойные таймауты:** `timeoutMs` на попытку + `totalTimeoutMs` для всей операции
- **Умные повторы:** Только идемпотентные методы по умолчанию + поддержка `Retry-After`
- **Готовность к Zod:** Валидация схем без исключений
- **Ноль зависимостей и ~3кб:** Дружелюбен к бандлерам, tree-shakable, без побочных эффектов

| Функция | `@asouei/safe-fetch` | `axios` | `ky` | нативный `fetch` |
|---------|---------------------|---------|------|------------------|
| **Размер бандла** | ~3кб | ~13кб* | ~11кб* | 0кб |
| **Зависимости** | 0 | 0* | 0* | 0 |
| **Безопасные результаты (без исключений)** | ✅ | ❌ | ❌ | ❌ |
| **Дискриминированные union типы** | ✅ | ❌ | ❌ | ❌ |
| **Per-attempt + полный таймауты** | ✅ | Только на запрос | Только на запрос | Вручную |
| **Умные повторы (только идемпотентные)** | ✅ | ✅ (бросает) | ✅ (бросает) | Вручную |
| **Поддержка заголовка Retry-After** | ✅ | ❌ | ❌ | Вручную |
| **Интерсепторы запроса/ответа** | ✅ | ✅ | ✅ | Вручную |
| **Хуки валидации (готов к Zod)** | ✅ | ❌ | ❌ | Вручную |
| **TypeScript-first дизайн** | ✅ | Частично | ✅ | ✅ |

*Размер бандла ~gzip; зависит от версии, окружения и настроек бандлера.  
**Axios/Ky бросают исключения на non-2xx по умолчанию; нет встроенного полного таймаута операции.

## Установка

```bash
npm install @asouei/safe-fetch
```

### Стили импорта

**ESM**
```typescript
import { safeFetch, createSafeFetch } from '@asouei/safe-fetch';
```

**CommonJS**
```javascript
const { safeFetch, createSafeFetch } = require('@asouei/safe-fetch');
// CommonJS поддерживается через поле exports.require
```

**CDN (esm.run)**
```html
<script type="module">
  import { safeFetch } from "https://esm.run/@asouei/safe-fetch";
  const res = await safeFetch.get('/api/ping');
</script>
```

## Быстрое демо

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

const create = await api.post<Todo>('/todos', { title: 'Изучить safe-fetch', completed: false });
if (!create.ok) console.warn('создание не удалось:', create.error);
```

## Парсинг JSON и обработка ошибок

> **Поведение парсинга JSON:**
> - Коды статуса `204/205` → `null`
> - Если `Content-Type` не содержит `json` → `null`
> - Невалидный JSON не бросает исключение, возвращает `null`

**Типы ошибок, которые могут встретиться:** `NetworkError`, `TimeoutError`, `HttpError`, `ValidationError`.  
Все ошибки сериализуемы (обычные объекты), легко логировать и мониторить.

**Поведение таймаута:**
- `timeoutMs` — таймаут на попытку
- `totalTimeoutMs` — таймаут всей операции (включает все повторы)

**Tree-shakable, без побочных эффектов** - импортируете только то, что используете.

### Безопасно по умолчанию
Больше никаких блоков `try/catch`. Каждый запрос возвращает дискриминированное объединение:
```typescript
type SafeResult<T> = 
  | { ok: true; data: T; response: Response }
  | { ok: false; error: NormalizedError; response?: Response }
```

### Нормализованные типы ошибок
Все ошибки последовательно типизированы и структурированы:
```typescript
// Сетевые проблемы, сбои подключения
type NetworkError = { name: 'NetworkError'; message: string; cause?: unknown }

// Таймауты запроса (на попытку или полный)
type TimeoutError = { name: 'TimeoutError'; message: string; timeoutMs: number }

// HTTP 4xx/5xx ответы
type HttpError = { name: 'HttpError'; message: string; status: number; body?: unknown }

// Сбои валидации схемы  
type ValidationError = { name: 'ValidationError'; message: string; cause?: unknown }
```

### Умные таймауты
Двухуровневая система таймаутов для максимального контроля:
```typescript
const api = createSafeFetch({
  timeoutMs: 5000,        // 5с на попытку
  totalTimeoutMs: 30000   // 30с всего (все повторы)
});
```

### Умные повторы
По умолчанию повторяет только безопасные операции:
- ✅ `GET`, `HEAD` - автоматически повторяются на 5xx, сетевых ошибках
- ❌ `POST`, `PUT`, `PATCH` - никогда не повторяются по умолчанию (предотвращает дублирование)
- 🎛️ Кастомный колбек `retryOn` для полного контроля

```typescript
const result = await safeFetch.get('/api/flaky-endpoint', {
  retries: {
    retries: 3,
    baseDelayMs: 300,     // Экспоненциальный отступ начиная с 300мс
    retryOn: ({ response, error }) => {
      // Кастомная логика повтора
      return error?.name === 'NetworkError' || response?.status === 429;
    }
  }
});
```

### Уважает лимиты скорости
Автоматически обрабатывает `429 Too Many Requests` с заголовком `Retry-After`:
```typescript
// Сервер возвращает: 429 Too Many Requests, Retry-After: 60
// safe-fetch ждет ровно 60 секунд перед повтором
const result = await safeFetch.get('/api/rate-limited', {
  retries: { retries: 3 }
});
```

## Миграция с Axios

**Axios (бросает исключения)**
```typescript
try {
  const { data } = await axios.get<User[]>('/users');
  render(data);
} catch (e) {
  toast(parseAxiosError(e));
}
```

**safe-fetch (не бросает)**
```typescript
const res = await safeFetch.get<User[]>('/users');
if (res.ok) render(res.data);
else toast(`${res.error.name}: ${res.error.message}`);
```

## Примеры использования

### Базовые запросы

```typescript
import { safeFetch } from '@asouei/safe-fetch';

// GET запрос с типобезопасностью
const users = await safeFetch.get<User[]>('/api/users');
if (users.ok) {
  users.data.forEach(user => console.log(user.name));
}

// POST с JSON телом (автоматически устанавливает Content-Type)
const newUser = await safeFetch.post('/api/users', {
  name: 'Алиса',
  email: 'alice@example.com'
});

// Обработка разных типов ошибок
if (!newUser.ok) {
  switch (newUser.error.name) {
    case 'HttpError':
      // Используем type assertion, так как знаем тип из дискриминированного объединения
      const httpError = newUser.error as { status: number; message: string };
      console.log(`HTTP ${httpError.status}: ${httpError.message}`);
      break;
    case 'NetworkError':
      console.log('Сбой сетевого подключения');
      break;
    case 'TimeoutError':
      const timeoutError = newUser.error as { timeoutMs: number };
      console.log(`Запрос превысил время ожидания через ${timeoutError.timeoutMs}мс`);
      break;
    case 'ValidationError':
      console.log('Валидация ответа не удалась');
      break;
  }
}
```

### Настроенный экземпляр

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

// Все запросы используют базовую конфигурацию
const result = await api.get('/users'); // GET https://api.example.com/users
```

### Валидация ответов с Zod

Идеальная интеграция с библиотеками валидации схем:

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
  // result.data полностью типизирован как z.infer<typeof UserSchema>
  console.log(result.data.email); // TypeScript знает, что это валидный email
}
```

### Интерсепторы запроса/ответа

```typescript
const api = createSafeFetch({
  interceptors: {
    onRequest: (url, init) => {
      // Добавляем токен авторизации
      const headers = new Headers(init.headers);
      headers.set('Authorization', `Bearer ${getToken()}`);
      init.headers = headers;
      
      console.log(`→ ${init.method} ${url}`);
    },
    
    onResponse: (response) => {
      console.log(`← ${response.status} ${response.url}`);
      
      // Обрабатываем глобальные ошибки авторизации
      if (response.status === 401) {
        redirectToLogin();
      }
    },
    
    onError: (error) => {
      // Отправляем ошибки в сервис мониторинга
      analytics.track('http_error', {
        error_name: error.name,
        message: error.message
      });
    }
  }
});
```

### Маппинг ошибок

Преобразование ошибок в доменно-специфичные типы:

```typescript
const api = createSafeFetch({
  errorMap: (error) => {
    if (error.name === 'HttpError' && error.status === 404) {
      return {
        name: 'NotFoundError',
        message: 'Ресурс не найден',
        status: 404
      } as any; // Type assertion нужен для расширения доменных ошибок
    }
    
    if (error.name === 'HttpError' && error.status === 401) {
      return {
        name: 'AuthError', 
        message: 'Требуется аутентификация',
        status: 401
      } as any;
    }
    
    return error;
  }
});
```

### Загрузка файлов и разные типы контента

```typescript
// JSON (автоматический Content-Type)
await safeFetch.post('/api/users', { name: 'Иван' });

// Form data
const formData = new FormData();
formData.append('file', fileInput.files[0]);
formData.append('description', 'Аватар');
await safeFetch.post('/api/upload', formData);

// Простой текст
await safeFetch.post('/api/webhook', 'простой текст', {
  headers: { 'Content-Type': 'text/plain' }
});

// Получение разных типов ответов
const csv = await safeFetch.get('/api/export.csv', { parseAs: 'text' });
const blob = await safeFetch.get('/api/image.jpg', { parseAs: 'blob' });
const raw = await safeFetch.get('/api/stream', { parseAs: 'response' });
```

### Поддержка AbortController

```typescript
const controller = new AbortController();

const promise = safeFetch.get('/api/long-request', {
  signal: controller.signal,
  timeoutMs: 10000
});

// Отменяем через 5 секунд
setTimeout(() => controller.abort(), 5000);

const result = await promise;
if (!result.ok && result.error.name === 'NetworkError') {
  console.log('Запрос был отменен');
}
```

## Утилитарные хелперы

### Unwrap для кода на основе исключений

```typescript
import type { SafeResult } from '@asouei/safe-fetch';

export const unwrap = async <T>(promise: Promise<SafeResult<T>>): Promise<T> => {
  const result = await promise;
  if (!result.ok) throw result.error;
  return result.data;
};

// Используйте когда хотите традиционную обработку исключений
try {
  const users = await unwrap(safeFetch.get<User[]>('/api/users'));
  console.log(users); // User[] - не нужно проверять result.ok
} catch (error) {
  console.error(error); // NormalizedError с последовательной структурой
}
```

### Type Guards для обработки ошибок

```typescript
export const isHttpError = (e: unknown): e is { name: 'HttpError'; status: number; statusText: string } =>
  !!e && typeof e === 'object' && (e as any).name === 'HttpError' && typeof (e as any).status === 'number';

export const isNetworkError = (e: unknown): e is { name: 'NetworkError'; message: string } =>
  !!e && typeof e === 'object' && (e as any).name === 'NetworkError';

// Использование
const result = await safeFetch.get('/api/data');
if (!result.ok) {
  if (isHttpError(result.error)) {
    console.log(`HTTP ${result.error.status}: ${result.error.statusText}`);
  } else if (isNetworkError(result.error)) {
    console.log('Сбой сетевого подключения');
  }
}
```

## Ограничения (по дизайну)

- Нет встроенного кеширования/дедупликации запросов (используйте SWR/TanStack Query)
- Нет автоматических преобразований запроса/ответа (сохраняет предсказуемость поведения)
- Не будет повторять неидемпотентные методы (POST/PUT/PATCH) без явного `retryOn`

## Для кого это

- Команды, уставшие от непоследовательных блоков `try/catch` и неявной обработки ошибок
- Проекты со строгими SLA требованиями, нуждающиеся в полных таймаутах и правильных повторах
- TypeScript кодбазы, требующие точных определений типов ошибок
- Разработчики, которые хотят простоту fetch с производственной надежностью

## Песочница

Попробуйте safe-fetch онлайн с готовыми примерами:  
**CodeSandbox:** [Открыть интерактивное демо](https://codesandbox.io/s/safe-fetch-demo) _(ссылка доступна после публикации пакета)_

## Дорожная карта

- ✅ `Retry-After` (секунды/дата) и экспоненциальный отступ с джиттером
- ✅ Полный таймаут операции (`totalTimeoutMs`)
- ⏳ Генераторы адаптеров React Query/SWR (`unwrap*` хелперы)
- ⏳ ESLint плагин для инвариантов паттерна `{ ok }`
- ⏳ Примеры фреймворков: Next.js, Cloudflare Workers, Remix

## Поддержка браузеров и рантайма

- **Node.js**: 18+ (использует встроенный `fetch`)
- **Bun**: 1.1+ (с поддержкой `fetch`)
- **Браузеры**: Все современные браузеры (Chrome 63+, Firefox 57+, Safari 10.1+)
- **SSR**: Совместим с Next.js, Nuxt, SvelteKit

### Edge/Workers

Работает в Cloudflare Workers и Vercel Edge Runtime (использует глобальный `fetch`):

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

## Рецепты

### Обновление авторизации (401 → refresh → повтор один раз)

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

### GraphQL хелпер

```typescript
type GQL<T> = { data?: T; errors?: any[] };

const gql = <T>(query: string, variables?: any) =>
  safeFetch.post<GQL<T>>('/graphql', { query, variables }, { 
    validate: v =>
      v && !v.errors 
        ? { success: true, data: v.data as T }
        : { success: false, error: v?.errors }
  });

// Использование
const result = await gql<User>('query { user(id: "123") { name email } }');
```

### Интеграция с React Query / SWR

```typescript
// React Query
import { useQuery } from '@tanstack/react-query';
import { safeFetch } from '@asouei/safe-fetch';

export function useUsers() {
  return useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const r = await safeFetch.get<User[]>('/api/users');
      if (!r.ok) throw r.error; // RQ ожидает исключения для состояний ошибок
      return r.data;
    },
    retry: false, // полагаемся на внутренние повторы safe-fetch
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
  if (error) return <div>Ошибка: {error.message}</div>;
  if (!data) return <div>Загрузка...</div>;
  return <div>Привет, {data.name}!</div>;
}
```

### Безопасность и учетные данные

```typescript
const api = createSafeFetch({
  baseURL: 'https://api.example.com',
  credentials: 'include', // Аутентификация на основе cookie
  timeoutMs: 5000,
  totalTimeoutMs: 20000,
  headers: {
    'X-Requested-With': 'XMLHttpRequest'
  }
});

// Библиотека не изменяет политику CORS/cookie; поведение идентично fetch
```

```typescript
// app/users/page.tsx
import { safeFetch } from '@asouei/safe-fetch';

export default async function Page() {
  const res = await safeFetch.get<User[]>('https://api.example.com/users');
  if (!res.ok) return <pre>Ошибка: {res.error.name}</pre>;
  return <ul>{res.data.map(u => <li key={u.id}>{u.name}</li>)}</ul>;
}
```

## Справочник API

### `createSafeFetch(config?)`

**Опции конфигурации:**

| Опция | Тип | По умолчанию | Описание |
|-------|-----|-------------|----------|
| `baseURL` | `string` | - | Базовый URL для всех запросов |
| `headers` | `Record<string, string>` | `{}` | Заголовки по умолчанию |
| `query` | `Record<string, any>` | `{}` | Параметры запроса по умолчанию |
| `timeoutMs` | `number` | `0` | Таймаут на попытку в миллисекундах |
| `totalTimeoutMs` | `number` | `0` | Общий таймаут для всех попыток повтора |
| `retries` | `RetryStrategy` | `false` | Конфигурация повторов |
| `parseAs` | `ParseAs` | `'json'` | Метод парсинга ответа по умолчанию |
| `errorMap` | `ErrorMapper` | - | Преобразование ошибок перед возвратом |
| `interceptors` | `Interceptors` | - | Хуки запроса/ответа/ошибки |

### Сигнатуры методов

```typescript
// Базовый запрос
safeFetch<T>(url: string, options?: SafeFetchRequest<T>): Promise<SafeResult<T>>

// Сокращения HTTP методов
safeFetch.get<T>(url: string, options?: SafeFetchRequest<T>): Promise<SafeResult<T>>
safeFetch.post<T>(url: string, body?: unknown, options?: SafeFetchRequest<T>): Promise<SafeResult<T>>
safeFetch.put<T>(url: string, body?: unknown, options?: SafeFetchRequest<T>): Promise<SafeResult<T>>
safeFetch.patch<T>(url: string, body?: unknown, options?: SafeFetchRequest<T>): Promise<SafeResult<T>>
safeFetch.delete<T>(url: string, options?: SafeFetchRequest<T>): Promise<SafeResult<T>>
```

### Функция валидации

```typescript
validate: (raw: unknown) => { success: true, data: T } | { success: false, error: any }
```

## Почему не Axios/Ky?

### vs Axios
- **Нет исключений:** Никакой "магической" глобальной обработки ошибок — явная проверка `{ ok }`
- **Меньший бандл:** ~3кб против ~13кб*
- **Современная платформа:** Нативный fetch, никаких слоев абстракции
- **Лучше для TypeScript:** Дискриминированные объединения вместо ловли любых ошибок
- **Полный таймаут:** `totalTimeoutMs` для всей операции, а не только одного запроса

### vs Ky
- **Безопасные результаты:** Предсказуемый поток управления (не бросает)
- **Безопасные повторы:** Не будет повторять POST по умолчанию для предотвращения дублирования побочных эффектов
- **Поддержка Retry-After:** Уважает заголовки ограничения скорости сервера
- **Хуки валидации:** Интеграция с Zod без исключений

### vs нативный Fetch
- **Нормализованные ошибки:** Последовательная структура `Network/Timeout/Http/Validation`
- **Повторы + отступ + джиттер:** Не нужно изобретать велосипед
- **Двойные таймауты:** Таймауты на попытку и общей операции
- **Удобства:** Сокращения методов, автоматическая обработка JSON, интерсепторы

## FAQ

**Почему не бросать исключения?**
Явный поток управления через `{ ok }` легче читать, типизировать и тестировать, чем try/catch вокруг каждой операции.

**Можно ли все же бросать исключения при необходимости?**
Да - используйте хелпер `unwrap(result)` из секции Утилиты.

**Почему POST/PUT/PATCH не повторяются по умолчанию?**
Чтобы предотвратить дублирование побочных эффектов. Включите повторы для неидемпотентных методов явно через колбек `retryOn`.

**Работает ли это с React Query/SWR?**
Идеально! Просто оберните ваши вызовы safeFetch или используйте хелпер `unwrap`.

## Участие в разработке

Вклады приветствуются! Пожалуйста, прочитайте наш [Гид по участию](CONTRIBUTING.md) для подробностей.

**Настройка разработки:**
```bash
git clone https://github.com/asouei/safe-fetch.git
cd safe-fetch
pnpm install
pnpm test
pnpm build
```

**Версионирование:** Мы следуем [Семантическому версионированию](https://semver.org/). См. [CHANGELOG.md](CHANGELOG.md) для истории релизов.

**Политика поддержки:** Минимальное окружение — Node 18+, современные браузеры (ES2017+). Мы следуем циклам Node.js LTS.

## Лицензия

MIT © [Aleksandr Mikhailishin](https://github.com/asouei)

---

**Сделано с ❤️ для разработчиков, которые ценят предсказуемые, типобезопасные HTTP клиенты.**