CREATE TABLE IF NOT EXISTS backoffice_member (
 user_id text PRIMARY KEY REFERENCES "user"(id) ON DELETE CASCADE,
 role text NOT NULL CHECK (role IN ('owner', 'viewer')),
 revoked_at timestamptz,
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS backoffice_invitation (
 id text PRIMARY KEY,
 email text NOT NULL,
 token_hash text NOT NULL UNIQUE,
 created_by text NOT NULL REFERENCES "user"(id),
 expires_at timestamptz NOT NULL,
 consumed_at timestamptz,
 revoked_at timestamptz,
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS backoffice_access_audit (
 id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 actor_id text NOT NULL REFERENCES "user"(id),
 action text NOT NULL CHECK (action IN ('invite', 'revoke-invitation', 'revoke-member')),
 subject_id text NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS backoffice_invitation_email ON backoffice_invitation(email);
