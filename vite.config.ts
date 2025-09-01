/// <reference types="vitest" />
import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';

export default defineConfig({
    build: {
        lib: {
            entry: 'src/index.ts',
            name: 'SafeFetch',
            fileName: (format) => (format === 'umd' ? 'index.umd.cjs' : 'index.js'),
            formats: ['es', 'cjs', 'umd']
        },
        sourcemap: true,
        outDir: 'dist',
        emptyOutDir: true,
        target: 'es2020',
        minify: true,
        rollupOptions: {
            output: {
                globals: {}
            }
        }
    },
    plugins: [
        dts({
            include: ['src/**/*'],
            exclude: ['**/*.test.*', '**/__tests__/**']
        })
    ],
    test: {
        environment: 'jsdom',
        globals: true,
        setupFiles: [],
        testTimeout: 15_000,
        hookTimeout: 15_000,
        coverage: {
            reporter: ['text', 'html'],
            exclude: [
                'node_modules/',
                'tests/',
                'dist/',
                '**/*.d.ts',
            ]
        }
    }
});