# babetka — Claude Code context

`@pure-tools/babetka` — Angular security library (auth guards, session timeout, rate limiting, sanitization, AI security).

## Key rules

- All services use **constructor injection** (`@Inject()`), not field `inject()` — required for `new MyService(mock)` testing without TestBed.
- **No TestBed in specs** — instantiate directly.
- All localStorage access wrapped in **try/catch** (not `typeof` check) — SSR-safe.
- Export everything through `src/index.ts` only.

## Workflows

- **Release:** `/publish-pure-tool`
- **New service/guard:** follow `pure-tools/pure-tool-anatomy.md` patterns
- **Test failures:** `/fix-tests`
- **Scaffold new library:** `/new-pure-tool`

## Skills repo

https://github.com/pure-tools/taktika — all slash commands in `~/.claude/commands/`
