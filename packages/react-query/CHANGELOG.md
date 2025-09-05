# Changelog

All notable changes to **@asouei/safe-fetch-react-query** will be documented here.  
We follow [Semantic Versioning](https://semver.org/).

## [0.1.0] - 2025-09-05 (Initial Release)

### Added

**🎉 First experimental release of the React Query adapter**

- **Core adapter functions:**
    - `createQueryFn(api)` - Factory for creating React Query compatible query functions
    - `createMutationFn(api)` - Factory for creating React Query compatible mutation functions
    - `unwrap(promise)` - Utility to convert safe results to throws (re-exported from core)
    - `rqDefaults()` - Returns `{ retry: false }` to let safe-fetch handle retries

- **Features:**
    - ✅ Converts `{ ok: false, error }` → `throw error` for React Query compatibility
    - ✅ Preserves safe-fetch's typed error system (`NetworkError`, `HttpError`, etc.)
    - ✅ Zero peer dependencies on React (works in any React Query setup)
    - ✅ TypeScript-first design with full type inference
    - ✅ Minimal bundle size - just thin wrapper functions

- **Documentation:**
    - Complete README with examples and best practices
    - Migration guide from direct safe-fetch usage
    - Advanced patterns: validation, error handling, infinite queries
    - Troubleshooting section for TypeScript discriminated union issues

### Technical Details

- **Compatibility**: React Query v5.x
- **Bundle size**: ~500 bytes (minimal wrappers only)
- **Peer dependencies**: `@tanstack/react-query ^5.0.0`, `@asouei/safe-fetch workspace:*`
- **Status**: Experimental (0.x) - API may change based on community feedback

---

## Planned Roadmap

- **v0.2**: Optional custom hooks (`useSafeQuery`, `useSafeMutation`) for convenience
- **v0.3**: Support for React Query DevTools integration
- **v1.0**: Stable API after community validation and feedback