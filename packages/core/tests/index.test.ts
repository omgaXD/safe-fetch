import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createSafeFetch, safeFetch } from '../src';
import { isError, isSuccess } from './type-guards';

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

describe('safe-fetch', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('basic functionality', () => {
        it('returns ok:true on 200 + json', async () => {
            mockFetch.mockResolvedValueOnce(
                new Response(JSON.stringify({ hello: 'world' }), {
                    status: 200,
                    headers: { 'Content-Type': 'application/json' }
                })
            );

            const api = createSafeFetch();
            const res = await api.get<{ hello: string }>('/hello');

            expect(res.ok).toBe(true);
            if (isSuccess(res)) {
                expect(res.data.hello).toBe('world');
                expect(res.response.status).toBe(200);
            }
        });

        it('returns HttpError on 500', async () => {
            mockFetch.mockResolvedValueOnce(
                new Response('Internal Server Error', { status: 500, statusText: 'Internal Server Error' })
            );

            const api = createSafeFetch();
            const res = await api.get('/error');

            expect(res.ok).toBe(false);
            if (isError(res)) {
                expect(res.error.name).toBe('HttpError');
                expect((res.error as any).status).toBe(500);
                expect(res.response?.status).toBe(500);
            }
        });

        it('returns NetworkError on fetch failure', async () => {
            mockFetch.mockRejectedValueOnce(new Error('Network failed'));

            const api = createSafeFetch();
            const res = await api.get('/fail');

            expect(res.ok).toBe(false);
            if (isError(res)) {
                expect(res.error.name).toBe('NetworkError');
                expect(res.error.message).toBe('Network request failed');
            }
        });
    });

    describe('http methods', () => {
        it('GET method works', async () => {
            mockFetch.mockResolvedValueOnce(new Response('{"data": "get"}', { status: 200 }));

            await safeFetch.get('/test');
            expect(mockFetch).toHaveBeenCalledWith(
                expect.stringContaining('/test'),
                expect.objectContaining({ method: 'GET' })
            );
        });

        it('POST method works with body', async () => {
            mockFetch.mockResolvedValueOnce(new Response('{"data": "post"}', { status: 200 }));

            const body = { name: 'test' };
            await safeFetch.post('/test', body);

            expect(mockFetch).toHaveBeenCalledWith(
                expect.stringContaining('/test'),
                expect.objectContaining({
                    method: 'POST',
                    body: JSON.stringify(body),
                    headers: expect.objectContaining({
                        'Content-Type': 'application/json'
                    })
                })
            );
        });

        it('POST method works with typed body', async () => {
            mockFetch.mockResolvedValueOnce(new Response('{"data": "post"}', { status: 200 }));
            
            interface PostBody {
                id: number;
                name: string;
            }

            const body = { id: 1, name: 'typed' };
            await safeFetch.post<{data: string}, PostBody>('/test', body);

            expect(mockFetch).toHaveBeenCalledWith(
                expect.stringContaining('/test'),
                expect.objectContaining({
                    method: 'POST',
                    body: JSON.stringify(body),
                    headers: expect.objectContaining({
                        'Content-Type': 'application/json'
                    })
                })
            );
        });

        it('DELETE method works', async () => {
            mockFetch.mockResolvedValueOnce(new Response(null, { status: 204 }));

            await safeFetch.delete('/test/123');
            expect(mockFetch).toHaveBeenCalledWith(
                expect.stringContaining('/test/123'),
                expect.objectContaining({ method: 'DELETE' })
            );
        });
    });

    describe('configuration', () => {
        it('uses baseURL', async () => {
            mockFetch.mockResolvedValueOnce(new Response('{}', { status: 200 }));

            const api = createSafeFetch({ baseURL: 'https://api.example.com' });
            await api.get('/users');

            expect(mockFetch).toHaveBeenCalledWith(
                'https://api.example.com/users',
                expect.any(Object)
            );
        });

        it('adds query parameters', async () => {
            mockFetch.mockResolvedValueOnce(new Response('{}', { status: 200 }));

            const api = createSafeFetch({ baseURL: 'https://api.example.com' });
            await api.get('/users', { query: { page: 1, limit: 10 } });

            expect(mockFetch).toHaveBeenCalledWith(
                'https://api.example.com/users?page=1&limit=10',
                expect.any(Object)
            );
        });

        it('adds default headers', async () => {
            mockFetch.mockResolvedValueOnce(new Response('{}', { status: 200 }));

            const api = createSafeFetch({
                headers: { Authorization: 'Bearer token' }
            });
            await api.get('/users');

            expect(mockFetch).toHaveBeenCalledWith(
                expect.any(String),
                expect.objectContaining({
                    headers: expect.objectContaining({
                        Authorization: 'Bearer token'
                    })
                })
            );
        });
    });

    describe('retries', () => {
        it('retries GET on 500 error', async () => {
            mockFetch
                .mockResolvedValueOnce(new Response('Server Error', { status: 500 }))
                .mockResolvedValueOnce(new Response('{"success": true}', { status: 200 }));

            const api = createSafeFetch({ retries: { retries: 2 } });
            const res = await api.get('/test');

            expect(mockFetch).toHaveBeenCalledTimes(2);
            expect(res.ok).toBe(true);
        });

        it('does not retry POST by default', async () => {
            mockFetch.mockResolvedValueOnce(new Response('Server Error', { status: 500 }));

            const api = createSafeFetch({ retries: { retries: 2 } });
            const res = await api.post('/test', { data: 'test' });

            expect(mockFetch).toHaveBeenCalledTimes(1);
            expect(res.ok).toBe(false);
        });

        it('retries POST when retryOn allows it', async () => {
            mockFetch
                .mockResolvedValueOnce(new Response('Server Error', { status: 500 }))
                .mockResolvedValueOnce(new Response('{"success": true}', { status: 200 }));

            const api = createSafeFetch({
                retries: {
                    retries: 2,
                    retryOn: (ctx: any) => ctx.response?.status === 500
                }
            });
            const res = await api.post('/test', { data: 'test' });

            expect(mockFetch).toHaveBeenCalledTimes(2);
            expect(res.ok).toBe(true);
        });

        it('respects Retry-After on 429', async () => {
            vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'Date'] });

            mockFetch
                .mockResolvedValueOnce(new Response('Too Many Requests', {
                    status: 429,
                    headers: new Headers({ 'Retry-After': '1' })
                }))
                .mockResolvedValueOnce(new Response('{"ok": true}', { status: 200 }));

            const api = createSafeFetch({ retries: { retries: 2, baseDelayMs: 0 } });
            const promise = api.get('/rate');

            await Promise.resolve();
            await vi.advanceTimersByTimeAsync(1000);
            await vi.runOnlyPendingTimersAsync();
            await Promise.resolve();

            const res = await promise;

            expect(res.ok).toBe(true);
            expect(mockFetch).toHaveBeenCalledTimes(2);

            vi.useRealTimers();
        }, 5000);

        it('handles total timeout', async () => {
            vi.useFakeTimers();

            mockFetch.mockImplementation(() => new Promise(() => {}));

            const api = createSafeFetch({ totalTimeoutMs: 2000 });
            const promise = api.get('/slow');

            await vi.advanceTimersByTimeAsync(2000);
            const res = await promise;

            expect(res.ok).toBe(false);
            if (isError(res)) {
                expect(res.error.name).toBe('TimeoutError');
                expect(res.error.message).toContain('timed out after 2000 ms');
            }

            vi.useRealTimers();
        });
    });

    describe('error handling', () => {
        it('normalizes different error types', async () => {
            mockFetch.mockRejectedValueOnce(new TypeError('Failed to fetch'));
            const networkRes = await safeFetch.get('/test');
            expect(networkRes.ok).toBe(false);
            if (isError(networkRes)) expect(networkRes.error.name).toBe('NetworkError');

            mockFetch.mockResolvedValueOnce(new Response('Not found', { status: 404 }));
            const httpRes = await safeFetch.get('/test');
            expect(httpRes.ok).toBe(false);
            if (isError(httpRes)) expect(httpRes.error.name).toBe('HttpError');
        });
    });

    describe('validation', () => {
        it('validates response with success', async () => {
            mockFetch.mockResolvedValueOnce(
                new Response('{"id": 1, "name": "test"}', { status: 200 })
            );

            const validate = (data: any) => {
                if (data && typeof data.id === 'number' && typeof data.name === 'string') {
                    return { success: true as const, data };
                }
                return { success: false as const, error: new Error('Invalid data') };
            };

            const res = await safeFetch.get('/user', { validate });
            expect(res.ok).toBe(true);
            if (isSuccess(res)) {
                expect(res.data.id).toBe(1);
                expect(res.data.name).toBe('test');
            }
        });

        it('validates response with failure', async () => {
            mockFetch.mockResolvedValueOnce(
                new Response('{"invalid": true}', { status: 200 })
            );

            const validate = (data: any) => {
                if (data && typeof data.id === 'number') {
                    return { success: true as const, data };
                }
                return { success: false as const, error: new Error('Missing id field') };
            };

            const res = await safeFetch.get('/user', { validate });
            expect(res.ok).toBe(false);
            if (isError(res)) {
                expect(res.error.name).toBe('ValidationError');
                expect(res.error.message).toBe('Validation failed');
            }
        });
    });
});