-- Migration: Create password_resets table
-- Description: Stores password reset token hashes for recovery flow

CREATE TABLE password_resets (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    token_hash TEXT NOT NULL,
    expires_at TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    used_at TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Index for token hash lookups during reset
CREATE INDEX idx_password_resets_token_hash ON password_resets(token_hash);

-- Index for user lookups
CREATE INDEX idx_password_resets_user_id ON password_resets(user_id);
