import { describe, it, expect, vi } from 'vitest';
import { createQueryFn, createMutationFn, rqDefaults, unwrap } from '../src';

describe('@asouei/safe-fetch-react-query', () => {
    describe('unwrap', () => {
        it('returns data from successful result', async () => {
            const result = Promise.resolve({
                ok: true as const,
                data: { id: 1, name: 'test' },
                response: new Response()
            });

            const data = await unwrap(result);
            expect(data).toEqual({ id: 1, name: 'test' });
        });

        it('throws error from failed result', async () => {
            const error = { name: 'HttpError' as const, message: 'Not found', status: 404 };
            const result = Promise.resolve({
                ok: false as const,
                error
            });

            await expect(unwrap(result as any)).rejects.toEqual(error);
        });
    });

    describe('createQueryFn', () => {
        it('creates function that calls api and returns data', async () => {
            const mockApi = vi.fn().mockResolvedValue({
                ok: true,
                data: { users: ['alice', 'bob'] },
                response: new Response()
            });

            const queryFn = createQueryFn(mockApi as any)<{ users: string[] }>('/users');
            const result = await queryFn();

            expect(result).toEqual({ users: ['alice', 'bob'] });
            expect(mockApi).toHaveBeenCalledWith('/users', undefined);
        });

        it('creates function that throws on api error', async () => {
            const error = { name: 'NetworkError' as const, message: 'Failed' };
            const mockApi = vi.fn().mockResolvedValue({ ok: false, error });

            const queryFn = createQueryFn(mockApi as any)<any>('/users');

            await expect(queryFn()).rejects.toEqual(error);
        });

        it('passes init options to api', async () => {
            const mockApi = vi.fn().mockResolvedValue({
                ok: true,
                data: {},
                response: new Response()
            });

            const init = { headers: { 'X-Test': 'value' } };
            const queryFn = createQueryFn(mockApi as any)<any>('/users', init);
            await queryFn();

            expect(mockApi).toHaveBeenCalledWith('/users', init);
        });
    });

    describe('createMutationFn', () => {
        it('creates function with POST method by default', async () => {
            const mockApi = vi.fn().mockImplementation((url, init) => {
                return Promise.resolve({
                    ok: true,
                    data: { method: init?.method, body: init?.body },
                    response: new Response()
                });
            });

            const mutationFn = createMutationFn(mockApi as any)<{ method: string; body: any }>('/users');
            const result = await mutationFn({ name: 'John' });

            expect(result.method).toBe('POST');
            expect(result.body).toEqual({ name: 'John' });
        });

        it('uses custom method from init', async () => {
            const mockApi = vi.fn().mockImplementation((url, init) => {
                return Promise.resolve({
                    ok: true,
                    data: { method: init?.method },
                    response: new Response()
                });
            });

            const mutationFn = createMutationFn(mockApi as any)<{ method: string }>('/users', { method: 'PUT' });
            const result = await mutationFn({ name: 'Jane' });

            expect(result.method).toBe('PUT');
        });

        it('merges init options with method and body', async () => {
            const mockApi = vi.fn().mockImplementation((url, init) => {
                return Promise.resolve({
                    ok: true,
                    data: init,
                    response: new Response()
                });
            });

            const customInit = { headers: { 'Authorization': 'Bearer token' } };
            const mutationFn = createMutationFn(mockApi as any)<any>('/users', customInit);
            const result = await mutationFn({ id: 123 });

            expect(result.method).toBe('POST');
            expect(result.body).toEqual({ id: 123 });
            expect(result.headers).toEqual({ 'Authorization': 'Bearer token' });
        });

        it('throws error on api failure', async () => {
            const error = { name: 'ValidationError' as const, message: 'Invalid data' };
            const mockApi = vi.fn().mockResolvedValue({ ok: false, error });

            const mutationFn = createMutationFn(mockApi as any)<any>('/users');

            await expect(mutationFn({ invalid: true })).rejects.toEqual(error);
        });
    });

    describe('rqDefaults', () => {
        it('returns retry false', () => {
            const defaults = rqDefaults();
            expect(defaults).toEqual({ retry: false });
        });

        it('returns object with const retry property', () => {
            const defaults = rqDefaults();
            expect(defaults.retry).toBe(false);
        });
    });
});