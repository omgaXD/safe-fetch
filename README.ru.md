# @asouei/safe-fetch

[![npm version](https://img.shields.io/npm/v/@asouei/safe-fetch.svg)](https://www.npmjs.com/package/@asouei/safe-fetch)
[![CI](https://github.com/asouei/safe-fetch/actions/workflows/ci.yml/badge.svg?branch=master)](https://github.com/asouei/safe-fetch/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![npm downloads](https://img.shields.io/npm/dm/@asouei/safe-fetch)](https://www.npmjs.com/package/@asouei/safe-fetch)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)](https://www.typescriptlang.org/)
[![Bundle Size](https://img.shields.io/bundlephobia/minzip/@asouei/safe-fetch)](https://bundlephobia.com/package/@asouei/safe-fetch)
[![Zero Dependencies](https://img.shields.io/badge/dependencies-0-green.svg)](package.json)
[![Попробовать в CodeSandbox](https://img.shields.io/badge/Open%20in-CodeSandbox-black?logo=codesandbox)](https://codesandbox.io/p/sandbox/fkw3z5)
[![Awesome](https://awesome.re/badge-flat2.svg)](https://github.com/dzharii/awesome-typescript)

*[English version](README.md) | Русская версия*

> **Никогда больше не пишите `try/catch` для HTTP-запросов.** Полная экосистема типобезопасных HTTP утилит, построенная на безопасных результатах и предсказуемой обработке ошибок.

Современная экосистема HTTP клиентов, которая исключает исключения через дискриминированные объединения, обеспечивает умные повторы, правильно обрабатывает таймауты и легко интегрируется с популярными библиотеками для работы с данными.

## 📦 Пакеты

| Пакет | Версия | Описание |
|-------|--------|----------|
| **[@asouei/safe-fetch](packages/core)** | [![npm](https://img.shields.io/npm/v/@asouei/safe-fetch.svg)](https://npmjs.com/package/@asouei/safe-fetch) | Основной HTTP клиент с безопасными результатами, повторами и таймаутами |
| **[@asouei/safe-fetch-react-query](packages/react-query)** | [![npm](https://img.shields.io/npm/v/@asouei/safe-fetch-react-query.svg)](https://npmjs.com/package/@asouei/safe-fetch-react-query) | Интеграция с TanStack Query и оптимизированная обработка ошибок |

## 🚀 Быстрый старт

```bash
npm install @asouei/safe-fetch
```

```typescript
import { safeFetch } from '@asouei/safe-fetch';

const result = await safeFetch.get<{ users: User[] }>('/api/users');
if (result.ok) {
  // TypeScript знает, что result.data это { users: User[] }
  console.log(result.data.users);
} else {
  // Все ошибки нормализованы и типизированы
  console.error(`${result.error.name}: ${result.error.message}`);
}
```

## ✨ Зачем safe-fetch?

- **🛡️ Никаких исключений**: Никогда не пишите `try/catch` — всегда получайте безопасный результат
- **🔧 Типизированные ошибки**: `NetworkError | TimeoutError | HttpError | ValidationError`
- **⏱️ Умные таймауты**: Таймауты на попытку + общий таймаут операции
- **🔄 Интеллектуальные повторы**: Повторяет только безопасные операции + поддержка `Retry-After`
- **📦 Ноль зависимостей**: Tree-shakable, ~3кб, работает везде
- **🧪 Готовность к валидации**: Встроенная интеграция с Zod без исключений

## 📖 Документация

- **[Основная библиотека](packages/core/README.md)** - Полная документация API, примеры и руководства по миграции
- **[React Query адаптер](packages/react-query/README.md)** - Интеграция с TanStack Query

## 🌟 Основные возможности

### Безопасные результаты
Каждый запрос возвращает дискриминированное объединение — больше не нужно гадать, что пошло не так:

```typescript
type SafeResult<T> = 
  | { ok: true; data: T; response: Response }
  | { ok: false; error: NormalizedError; response?: Response }
```

### Нормализованные ошибки
Все ошибки следуют одинаковой структуре:

```typescript
// Сетевые проблемы, сбои подключения
type NetworkError = { name: 'NetworkError'; message: string; cause?: unknown }

// Таймауты запроса (на попытку или общий)
type TimeoutError = { name: 'TimeoutError'; message: string; timeoutMs: number }

// HTTP 4xx/5xx ответы
type HttpError = { name: 'HttpError'; message: string; status: number; body?: unknown }

// Сбои валидации схемы
type ValidationError = { name: 'ValidationError'; message: string; cause?: unknown }
```

### Умная конфигурация

```typescript
import { createSafeFetch } from '@asouei/safe-fetch';

const api = createSafeFetch({
  baseURL: 'https://api.example.com',
  timeoutMs: 5000,        // На попытку
  totalTimeoutMs: 30000,  // Общий таймаут операции
  retries: { 
    retries: 2,
    baseDelayMs: 300      // Экспоненциальная задержка (backoff)
  },
  headers: { Authorization: 'Bearer token' }
});

const result = await api.get<User[]>('/users');
```

## 🔮 Дорожная карта экосистемы

- ✅ **Основная библиотека** - Безопасный HTTP клиент с повторами и таймаутами
- ✅ **React Query адаптер** - Оптимизированная интеграция с TanStack Query
- 📋 **SWR адаптер** - Хелперы для интеграции с SWR
- 🔍 **ESLint плагин** - Принуждение к паттернам безопасных результатов
- 🏗️ **Примеры фреймворков** - Next.js, Remix, Cloudflare Workers

## 📱 Интеграция с фреймворками

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
    ...rqDefaults() // { retry: false } - пусть safe-fetch обрабатывает повторы
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

## 🤝 Участие в разработке

Мы приветствуем вклад в развитие! Пожалуйста, ознакомьтесь с нашим [Руководством по участию](CONTRIBUTING.md).

**Быстрая настройка для разработки:**
```bash
git clone https://github.com/asouei/safe-fetch.git
cd safe-fetch
pnpm install
pnpm -r test
pnpm -r build
```

## 📄 Лицензия

MIT © [Aleksandr Mikhailishin](https://github.com/asouei)

---

**Создано с ❤️ для разработчиков, которые ценят предсказуемые, типобезопасные HTTP клиенты.**