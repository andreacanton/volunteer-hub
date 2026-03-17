# Patterns & Design Decisions

## SQLite Constraint Error Handling (Feb 2026)

### The Fix
Added a catch in `errorHandler.ts` for errors whose message includes
`"UNIQUE constraint failed"`, returning 409 with `AUTH_USER_EXISTS` code.

### Why It Worked But Has a Tension
The service layer (`createUser`) already does a proactive `getUserByEmail` check
before the INSERT. Under normal sequential usage that check is sufficient — the
constraint handler is only needed when two requests race past the check simultaneously.

The global handler using `AUTH_USER_EXISTS` is semantically correct for the users
table today, but will be wrong as soon as other tables with UNIQUE constraints are
added (service groups, subscriptions, etc.). A generic code like `RESOURCE_CONFLICT`
would be more accurate for the global fallback.

### Recommended Future Path
1. Add a `RESOURCE_CONFLICT` error code for the global fallback in `errorHandler.ts`
2. In each service function that does an INSERT, wrap the statement in a try/catch,
   inspect the error message for the column name (`err.message` includes the full
   constraint name, e.g. `UNIQUE constraint failed: users.email`), and re-throw
   the appropriate domain-specific `ApiError`
3. The global handler then becomes a true last-resort and never needs to know about
   domain specifics

### Pattern for Service-Level Handling
```typescript
try {
  stmt.run(id, params.email, passwordHash, role);
} catch (err) {
  if (err instanceof Error && err.message.includes("UNIQUE constraint failed: users.email")) {
    throw new ApiError(ErrorCode.AUTH_USER_EXISTS, "A user with this email already exists");
  }
  throw err; // let the global handler deal with other DB errors
}
```

This removes the proactive `getUserByEmail` lookup entirely (saves a DB round-trip)
and makes the constraint the single authoritative gate.
