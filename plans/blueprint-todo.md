# Blueprint-TODO.md
Template for generating consistent TODO.md checklists from Plan.md. Keep the section order and field labels unchanged.

## Instructions for Agents
- Derive phases from the Implementation Plan in Plan.md (keep same order and names when possible).
- Use clear, testable tasks. Each task should fit in a single working session.
- Preserve the structure and field labels so downstream tooling can parse it.
- Mark dependencies using task IDs; avoid prose-only references.
- Update status with `[ ]` (open) or `[x]` (done); do not invent other symbols.

## Metadata
- Feature: <name>
- Plan Source: <Plan.md path or ticket>
- Service/Repo: <name>
- Date: <yyyy-mm-dd>
- Owner/Reviewer: <name>
- Links: <relevant docs or tickets>

## Phases
List phases in order. Each phase contains tasks with IDs.

### Phase 1: <Name> (Goal: <short objective>)
- [ ] T1: <Task title> (Complexity: Simple|Medium|Complex)
- Description: <what to do>
- Dependencies: <e.g., none | T0>
- Acceptance: <how to verify>
- Notes: <optional>

### Phase 2: <Name> (Goal: <short objective>)
- [ ] T2: <Task title> (Complexity: Simple|Medium|Complex)
- Description: <what to do>
- Dependencies: <e.g., T1>
- Acceptance: <how to verify>
- Notes: <optional>

### Phase 3: <Name> (Goal: <short objective>)
- [ ] T3: <Task title> (Complexity: Simple|Medium|Complex)
- Description: <what to do>
- Dependencies: <e.g., T1, T2>
- Acceptance: <how to verify>
- Notes: <optional>

### Phase ....

## Rollup
- Open Tasks: <count>
- Completed Tasks: <count>
- Blockers: <list or none>
- Next Priority: <task ID>

## Notes
- Keep tasks aligned with Plan.md scope; do not introduce new scope without review.
- If a dependency is external (e.g., infra, ticket approval), state it explicitly.
