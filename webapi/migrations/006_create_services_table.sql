-- Migration: Create services table
-- Description: Service types that volunteers can subscribe to

CREATE TABLE services (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    description TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Index for name lookups
CREATE INDEX idx_services_name ON services(name);
