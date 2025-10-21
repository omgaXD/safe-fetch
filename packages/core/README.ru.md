# @asouei/safe-fetch

[![npm version](https://img.shields.io/npm/v/@asouei/safe-fetch.svg)](https://www.npmjs.com/package/@asouei/safe-fetch)
[![CI](https://github.com/asouei/safe-fetch/actions/workflows/ci.yml/badge.svg?branch=master)](https://github.com/asouei/safe-fetch/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![npm downloads](https://img.shields.io/npm/dm/@asouei/safe-fetch)](https://www.npmjs.com/package/@asouei/safe-fetch)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)](https://www.typescriptlang.org/)
[![Bundle Size](https://img.shields.io/bundlephobia/minzip/@asouei/safe-fetch)](https://bundlephobia.com/package/@asouei/safe-fetch)
[![Zero Dependencies](https://img.shields.io/badge/dependencies-0-green.svg)](package.json)

*[English version](README.md) | Русская версия*

> **Никогда больше не пишите `try/catch` для HTTP-запросов.** Ноль зависимостей • Не бросает исключения • Полный таймаут • Поддержка Retry-After

Маленькая, типизированная обертка вокруг `fetch`, которая возвращает безопасные результаты, умно обрабатывает таймауты и повторяет запросы с экспоненциальным отступом.

Часть **[экосистемы @asouei/safe-fetch](../../README.ru.md)** - также доступен: [адаптер React Query](../react-query).

📌 Библиотека вошла в список [Awesome TypeScript](https://github.com/dzharii/awesome-typescript).

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

## Интеграция с фреймворками

### React Query

**Простая интеграция** с официальным адаптером:

```bash
npm install @asouei/safe-fetch-react-query
```

```typescript
import { createSafeFetch } from '@asouei/safe-fetch';
import { createQueryFn, rqDefaults } from '@asouei/safe-fetch-react-query';

const api = createSafeFetch({ baseURL: '/api' });
const queryFn = createQueryFn(api);

export function useUsers() {
  return useQuery({
    queryKey: ['users'],
    queryFn: queryFn<User[]>('/users'),
    ...rqDefaults() // { retry: false } - пусть safe-fetch обрабатывает повторы
  });
}
```

См. **[документацию адаптера React Query](../react-query)** для полного руководства по интеграции.

### SWR

```typescript
import useSWR from 'swr';

const fetcher = async (url: string) => {
  const result = await safeFetch.get(url);
  if (!result.ok) throw result.error;
  return result.data;
};

export function UserProfile({ id }: { id: string }) {
  const { data, error } = useSWR(`/api/users/${id}`, fetcher);
  if (error) return <div>Ошибка: {error.message}</div>;
  if (!data) return <div>Загрузка...</div>;
  return <div>Привет, {data.name}!</div>;
}
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

      return { input: url, init }
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

## FAQ

**Почему не бросать исключения?**
Явный поток управления через `{ ok }` легче читать, типизировать и тестировать, чем try/catch вокруг каждой операции.

**Можно ли все же бросать исключения при необходимости?**
Да - используйте хелпер `unwrap(result)` из секции Утилиты.

**Почему POST/PUT/PATCH не повторяются по умолчанию?**
Чтобы предотвратить дублирование побочных эффектов. Включите повторы для неидемпотентных методов явно через колбек `retryOn`.

**Работает ли это с React Query/SWR?**
Идеально! Используйте наш [адаптер React Query](../react-query) или оберните ваши вызовы safeFetch хелпером `unwrap`.

## Участие в разработке

Вклады приветствуются! Пожалуйста, прочитайте наш [Гид по участию](../../CONTRIBUTING.md) для подробностей.

**Настройка разработки:**
```bash
git clone https://github.com/asouei/safe-fetch.git
cd safe-fetch/packages/core
pnpm install
pnpm test
pnpm build
```

## Лицензия

MIT © [Aleksandr Mikhailishin](https://github.com/asouei)

---

**Сделано с ❤️ для разработчиков, которые ценят предсказуемые, типобезопасные HTTP клиенты.**