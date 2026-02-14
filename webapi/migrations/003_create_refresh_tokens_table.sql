-- Migration: Create refresh_tokens table
-- Description: Stores refresh token hashes for session management

CREATE TABLE refresh_tokens (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    token_hash TEXT NOT NULL,
    expires_at TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    revoked_at TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Index for token hash lookups during refresh
CREATE INDEX idx_refresh_tokens_token_hash ON refresh_tokens(token_hash);

-- Index for user lookups when revoking all tokens
CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens(user_id);
