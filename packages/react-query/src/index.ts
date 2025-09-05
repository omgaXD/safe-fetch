import type { SafeFetcher, SafeFetchRequest, SafeResult } from '@asouei/safe-fetch';

export const unwrap = async <T>(p: Promise<SafeResult<T>>): Promise<T> => {
    const r = await p;
    if (!r.ok) throw r.error;
    return r.data;
};

export const createQueryFn =
    (api: SafeFetcher) =>
        <T = unknown>(url: string, init?: SafeFetchRequest<T>) =>
            async (): Promise<T> => {
                return unwrap(api<T>(url, init));
            };

export const createMutationFn =
    (api: SafeFetcher) =>
        <T = unknown>(url: string, init?: SafeFetchRequest<T>) =>
            async (body?: unknown): Promise<T> => {
                const method = (init?.method ?? 'POST').toUpperCase();
                const nextInit: SafeFetchRequest<T> = {
                    ...init,
                    method: method as any,
                    body: body as any
                };
                return unwrap(api<T>(url, nextInit));
            };

export const rqDefaults = () => ({
    retry: false as const
});