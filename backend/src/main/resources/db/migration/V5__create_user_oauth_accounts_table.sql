-- Flyway Migration V5: Create user_oauth_accounts table for federated OAuth2 providers (Google, etc.)
CREATE TABLE IF NOT EXISTS user_oauth_accounts (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id BIGINT NOT NULL,
    provider VARCHAR(50) NOT NULL,
    provider_user_id VARCHAR(255) NOT NULL,
    email VARCHAR(150) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_oauth_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT uk_provider_user UNIQUE (provider, provider_user_id),
    CONSTRAINT uk_user_provider UNIQUE (user_id, provider)
);

CREATE INDEX IF NOT EXISTS idx_oauth_user_id ON user_oauth_accounts (user_id);
CREATE INDEX IF NOT EXISTS idx_oauth_provider_user ON user_oauth_accounts (provider, provider_user_id);
