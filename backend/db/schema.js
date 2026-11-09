export async function ensureUserSchema(pool) {
  const statements = [
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS domain TEXT NOT NULL DEFAULT ''`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS location TEXT NOT NULL DEFAULT ''`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS first_name TEXT NOT NULL DEFAULT ''`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS last_name TEXT NOT NULL DEFAULT ''`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS position TEXT NOT NULL DEFAULT ''`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS category TEXT NOT NULL DEFAULT ''`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS inm DOUBLE PRECISION`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`,
    `ALTER TABLE auth_tokens ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ`,
    `ALTER TABLE auth_tokens ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMPTZ`,
    `UPDATE auth_tokens SET expires_at = created_at + INTERVAL '8 hours' WHERE expires_at IS NULL`,
    `UPDATE auth_tokens SET last_seen_at = created_at WHERE last_seen_at IS NULL`,
  ];
  for (const sql of statements) {
    await pool.query(sql);
  }
}

export const USER_SELECT_FIELDS = `
  id, email, name, role, service, domain, location,
  first_name, last_name, position, category, inm, created_at
`;
