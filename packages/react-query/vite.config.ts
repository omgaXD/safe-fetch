/// <reference types="vitest" />
import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';

export default defineConfig({
    build: {
        lib: {
            entry: 'src/index.ts',
            name: 'SafeFetchReactQuery',
            fileName: (format) => {
                switch (format) {
                    case 'es': return 'index.mjs';
                    case 'cjs': return 'index.cjs';
                    case 'umd': return 'index.umd.cjs';
                    default: return 'index.js';
                }
            },
            formats: ['es', 'cjs']
        },
        sourcemap: true,
        outDir: 'dist',
        emptyOutDir: true,
        target: 'es2020',
        minify: false,
        rollupOptions: {
            external: ['@asouei/safe-fetch', '@tanstack/react-query'],
            output: {
                globals: {
                    '@asouei/safe-fetch': 'SafeFetch',
                    '@tanstack/react-query': 'ReactQuery'
                }
            }
        }
    },
    plugins: [
        dts({
            include: ['src/**/*'],
            exclude: ['**/*.test.*', '**/__tests__/**', 'src/**/*.spec.ts']
        })
    ],
    test: {
        environment: 'node',
        globals: true,
        testTimeout: 15_000,
        hookTimeout: 15_000,
        coverage: {
            provider: 'v8',
            reporter: ['text', 'html'],
            exclude: [
                'node_modules/',
                'tests/',
                'dist/',
                '**/*.d.ts',
                '**/*.test.*',
                '**/*.spec.*'
            ]
        }
    }
});