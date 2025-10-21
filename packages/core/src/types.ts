export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD';
export type ParseAs = 'json' | 'text' | 'blob' | 'arrayBuffer' | 'response';

export type RetryStrategy =
    | false
    | {
    retries: number;           // e.g. 2
    baseDelayMs?: number;      // e.g. 300
    maxDelayMs?: number;       // optional cap
    retryOn?: (ctx: { attempt: number; error?: unknown; response?: Response }) => boolean;
};

export interface NormalizedErrorBase {
    name: string;
    message: string;
    cause?: unknown;
}

export interface NetworkError extends NormalizedErrorBase {
    name: 'NetworkError';
}

export interface TimeoutError extends NormalizedErrorBase {
    name: 'TimeoutError';
    timeoutMs: number;
}

export interface HttpError extends NormalizedErrorBase {
    name: 'HttpError';
    status: number;
    statusText: string;
    body?: unknown;
}

export interface ValidationError extends NormalizedErrorBase {
    name: 'ValidationError';
}

export type NormalizedError = NetworkError | TimeoutError | HttpError | ValidationError;

export type ErrorMapper = (error: NormalizedError) => NormalizedError;

export type ValidateResult<T> =
    | { success: true; data: T }
    | { success: false; error: NormalizedError | unknown };

export interface Interceptors {
    onRequest?: (input: RequestInfo, init: RequestInit & { url: string }) => Promise<void> | void;
    onResponse?: (response: Response) => Promise<void> | void;
    onError?: (error: NormalizedError) => Promise<void> | void;
}

export type SafeResult<T> =
    | { ok: true; data: T; response: Response }
    | { ok: false; error: NormalizedError; response?: Response };

export interface SafeFetchBaseConfig {
    baseURL?: string;
    headers?: Record<string, string>;
    query?: Record<string, string | number | boolean | undefined>;
    timeoutMs?: number;
    totalTimeoutMs?: number;
    retries?: RetryStrategy;
    parseAs?: ParseAs;
    errorMap?: ErrorMapper;
    interceptors?: Interceptors;
}

export interface SafeFetchRequest<TOut, TBody extends object = any> extends Omit<RequestInit, 'body' | 'method'> {
    method?: HttpMethod;
    body?: (BodyInit | TBody | null | undefined);
    query?: Record<string, string | number | boolean | undefined>;
    parseAs?: ParseAs;
    validate?: (raw: unknown) => ValidateResult<TOut>;
    timeoutMs?: number;
    totalTimeoutMs?: number;
    retries?: RetryStrategy;
}

export interface SafeFetcher {
    <TOut = unknown, TBody extends object = any>(url: string, init?: SafeFetchRequest<TOut, TBody>): Promise<SafeResult<TOut>>;

    get<TOut = unknown>(url: string, init?: SafeFetchRequest<TOut>): Promise<SafeResult<TOut>>;
    post<TOut = unknown, TBody extends object = any>(url: string, body?: TBody, init?: SafeFetchRequest<TOut>): Promise<SafeResult<TOut>>;
    put<TOut = unknown, TBody extends object = any>(url: string, body?: TBody, init?: SafeFetchRequest<TOut>): Promise<SafeResult<TOut>>;
    patch<TOut = unknown, TBody extends object = any>(url: string, body?: TBody, init?: SafeFetchRequest<TOut>): Promise<SafeResult<TOut>>;
    delete<TOut = unknown>(url: string, init?: SafeFetchRequest<TOut>): Promise<SafeResult<TOut>>;
}