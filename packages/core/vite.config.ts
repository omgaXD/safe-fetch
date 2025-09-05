import { defineConfig } from 'vitest/config';
import dts from 'vite-plugin-dts';
import { resolve } from 'node:path';

export default defineConfig({
    resolve: {
        alias: {
            '@asouei/safe-fetch': resolve(__dirname, 'src'),
        },
    },
    build: {
        lib: {
            entry: 'src/index.ts',
            name: 'SafeFetch',
            fileName: (format) => {
                switch (format) {
                    case 'es': return 'index.js';
                    case 'cjs': return 'index.umd.cjs';
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
            output: {
                globals: {}
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
            reportsDirectory: 'coverage',
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