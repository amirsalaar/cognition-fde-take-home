## Communication Style

- Drop grammar; min tokens; noun-phrases ok; like a telegraph.
- Unsure: read more code; if still stuck, ask w/ short options.
- Missing context to complete task effectively: ask.
- Never assume; always verify. If unsure, ask.

## Workflow Orchestration

### 1. Plan Mode Default

- Enter plan mode for ANY non-trivial task (3+ steps or architectural decisions).
- If something goes sideways, STOP and re-plan immediately.
- Use plan mode for verification steps, not just building.
- **Check existing `tasks/lessons.md` for context before planning.**

### 2. Context Isolation

- Keep main context window clean.
- **Create new sessions/threads** for research, exploration, parallel analysis.
- One task per session for focused execution.
- **Summarize findings back to main thread clearly.**

### 3. Verification Before Done

- Never mark task complete without proving it works.
- **Provide reproduction scripts** for bugs before fixing them.
- Ask: "Would a staff engineer approve this?"
- Run tests, check logs, demonstrate correctness.

### 4. Demand Elegance (Balanced)

- Pause and ask "is there a more elegant way?"
- If fix feels hacky: "Knowing everything I know now, implement the elegant solution."
- **Respect existing patterns:** don't introduce new libraries if existing ones suffice.

### 5. Autonomous Bug Fixing

- Fix bugs without hand-holding, **unless data loss is a risk**.
- Point at logs, errors, failing tests – then resolve them.
- Fix failing CI tests without being told how.

### 6. Multi-Agent Awareness

- Unrecognized changes: assume other agent; keep going; focus your changes.
- If unrecognized changes cause issues, stop + ask user.

## Task Management

1. **Context Check**: Read `tasks/lessons.md` and project architecture docs.
2. **Plan First**: Write plan to `tasks/todo.md` with checkable items.
3. **Verify Plan**: Check in before starting implementation.
4. **Track Progress**: Mark items complete as you go.
5. **Document Results**: Update `tasks/todo.md` with summary of changes.
6. **Capture Lessons**: Update `tasks/lessons.md` if new patterns emerged.

**Bootstrapping**: If `tasks/` directory doesn't exist in a project, create it with empty `lessons.md` and `todo.md` before starting work.

## Git Workflow

- **Always explain**: Every git command must include a plain-English comment explaining what it does and why.
- **No co-authored-by**: Do NOT append `Co-Authored-By` lines to commit messages.
- **Commit messages**: Short, descriptive. What changed and why — not how.
- **Commit often**: Small, logical commits > one giant commit. Each commit should be a single coherent change.
- **Branch naming**: `feature/short-description`, `fix/short-description`, `chore/short-description`.
- **Before destructive ops**: Always explain consequences and confirm with user before force pushes, resets, rebases, or branch deletions.

## Testing Strategy

- **Identify repeatable test loops**: When a manual test pattern emerges (run X, check Y, fix Z), capture it as a script in `tasks/test-commands/`.
- **Format**: Each file = one test loop. Name describes what it validates (e.g., `tasks/test-commands/validate-api-response.sh`).
- **Automate incrementally**: Start manual, formalize into scripts as patterns stabilize.
- **Verification scripts**: For bug fixes, write a reproduction script first, then verify the fix passes it.
- **Don't over-test**: Focus on behavior that matters. No tests for trivial getters or framework boilerplate.

## Core Principles

- **Simplicity First**: Make every change as simple as possible. Minimal code impact.
- **Fix Root Causes**: No band-aids. No "todo" comments or placeholder code.
- **Minimal Impact**: Only touch what's necessary. Avoid introducing bugs.
- **Greenfield Default**: Backwards compatibility often unnecessary and harmful. If unsure, ask.
- **Readable > Abstract**: Avoid abstractions. Avoid microscopic helper functions. Prefer code co-location.
- **Error Propagation**: Avoid fallbacks and over-use of try-catch. Think critically about error boundaries. Propagate errors to user; implement error UI rather than swallowing.
- **Strongly Typed**: Prefer strong types. Don't over-complicate type definitions.

## Python Rules

- Always use `pathlib.Path()` for filepaths, not strings or `os.path.join()`.
- Prefer Pydantic types for objects instead of dicts.

## TypeScript Rules

- Avoid `any`. Mission to remove all `any` casts for full type safety. If it compiles, it should run.
- Use OpenAPI wrapper around Tanstack Query for OpenAPI compliance between frontend/backend.
- Explore existing `useQuery` hooks before writing new ones. Prefer Tanstack Query over `fetch`.
- Store state in Tanstack Query instead of `useContext` or `useState` where possible.

## Frontend Aesthetics

- Avoid "AI slop" UI. Be opinionated + distinctive.
- **Theme**: Use project's existing theme/CSS vars. Commit to the palette; bold accents > timid gradients.
- **Motion**: 1–2 high-impact moments (staggered reveal beats random micro-anim).
- **Avoid**: Purple-on-white clichés, generic component grids, predictable layouts, default shadows, gratuitous rounded corners.
- **Principle**: Every visual choice should feel intentional, not templated.

## Writing Style

- Clear, concise, direct. No fluff or filler.
- DO NOT use em-dashes (–) or ellipses (…). Use commas and periods.
