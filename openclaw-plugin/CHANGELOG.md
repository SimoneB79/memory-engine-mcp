## 4.5.8
- SQLite WAL + busy_timeout=5000 all connections (fix null from lock contention)
- TTL UPDATE failure logging

## 4.5.7 (2026-10-14)

- Structured logging on all 46 tools (info/warn/error): NULL/UNDEFINED results, timing, stack traces
- Embedding failures now logged with ollama host/model (was silent catch)
- Version string in dist matches package version (was 4.5.5 through 4.5.6)

