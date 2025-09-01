# Changelog

All notable changes to this project will be documented here.  
We follow [Semantic Versioning](https://semver.org/).

## [0.1.0] - 2025-09-01
### Added
- First public release of **@asouei/safe-fetch**
- Core features:
  - Safe result API (`{ ok: true | false }`)
  - Normalized errors (`NetworkError`, `TimeoutError`, `HttpError`, `ValidationError`)
  - Per-attempt and total timeouts
  - Smart retries with exponential backoff
  - Support for `Retry-After` header
  - Request/response interceptors
  - Validation hook (Zod-ready)
  - Zero dependencies, ~3kb size

---

## Future Roadmap
- React Query / SWR integration helpers
- ESLint plugin for enforcing `{ ok }` checks
- Framework examples (Next.js, Cloudflare Workers, Remix)