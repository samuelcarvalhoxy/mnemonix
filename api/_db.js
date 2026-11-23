import {neon} from '@neondatabase/serverless';

let client;
let initialization;
const connection = () => process.env.VERCEL_ENV === 'preview'
  ? process.env.MNEMONIX_PREVIEW_DATABASE_URL
  : process.env.DATABASE_URL;
export const hasDatabase = () => Boolean(connection());
export function database() {
  if (!client) client = neon(connection());
  return client;
}

export const schema = [
  `CREATE TABLE IF NOT EXISTS mnemonix_users (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(), display_name text NOT NULL, username text NOT NULL,
    email text NOT NULL, password_hash text NOT NULL, security_answers jsonb NOT NULL DEFAULT '[]'::jsonb,
    failed_logins integer NOT NULL DEFAULT 0, locked_until timestamptz, active boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
  )`,
  'CREATE UNIQUE INDEX IF NOT EXISTS mnemonix_users_username_lower_idx ON mnemonix_users (lower(username))',
  'CREATE UNIQUE INDEX IF NOT EXISTS mnemonix_users_email_lower_idx ON mnemonix_users (lower(email))',
  `CREATE TABLE IF NOT EXISTS mnemonix_sessions (
    token_hash text PRIMARY KEY, user_id uuid NOT NULL REFERENCES mnemonix_users(id) ON DELETE CASCADE,
    expires_at timestamptz NOT NULL, created_at timestamptz NOT NULL DEFAULT now()
  )`,
  'CREATE INDEX IF NOT EXISTS mnemonix_sessions_user_idx ON mnemonix_sessions (user_id)',
  `CREATE TABLE IF NOT EXISTS mnemonix_profiles (
    user_id uuid PRIMARY KEY REFERENCES mnemonix_users(id) ON DELETE CASCADE,
    items jsonb NOT NULL DEFAULT '[]'::jsonb, metrics jsonb NOT NULL DEFAULT '{}'::jsonb,
    version bigint NOT NULL DEFAULT 1, updated_at timestamptz NOT NULL DEFAULT now()
  )`,
  'ALTER TABLE mnemonix_users ADD COLUMN IF NOT EXISTS email_verified_at timestamptz',
  `CREATE TABLE IF NOT EXISTS mnemonix_consents (
    user_id uuid NOT NULL REFERENCES mnemonix_users(id) ON DELETE CASCADE, version text NOT NULL,
    accepted_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY(user_id, version)
  )`,
  `CREATE TABLE IF NOT EXISTS mnemonix_pending_accounts (
    email text PRIMARY KEY, display_name text NOT NULL, password_hash text NOT NULL, offers boolean NOT NULL,
    terms_version text NOT NULL, token_hash text NOT NULL UNIQUE, expires_at timestamptz NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS mnemonix_password_links (
    user_id uuid PRIMARY KEY REFERENCES mnemonix_users(id) ON DELETE CASCADE,
    token_hash text NOT NULL UNIQUE, expires_at timestamptz NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS mnemonix_email_limits (
    rate_key text PRIMARY KEY, bucket timestamptz NOT NULL, count integer NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS mnemonix_training (
    user_id uuid PRIMARY KEY REFERENCES mnemonix_users(id) ON DELETE CASCADE,
    state jsonb NOT NULL, version bigint NOT NULL DEFAULT 0
  )`,
  `CREATE TABLE IF NOT EXISTS mnemonix_training_writes (
    user_id uuid NOT NULL REFERENCES mnemonix_users(id) ON DELETE CASCADE,
    operation_id uuid NOT NULL, PRIMARY KEY(user_id, operation_id)
  )`,
  `CREATE TABLE IF NOT EXISTS mnemonix_privacy_requests (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL REFERENCES mnemonix_users(id) ON DELETE CASCADE,
    kind text NOT NULL CHECK(kind IN ('access','correction','deletion','other')), details text NOT NULL,
    requested_at timestamptz NOT NULL DEFAULT now()
  )`
];
export function ensureDatabase() {
  if (!initialization) {
    const sql = database();
    initialization = sql.transaction([
      sql`SELECT pg_advisory_xact_lock(137092172)`,
      ...schema.map(statement => sql.query(statement))
    ]).catch(error => { initialization = undefined; throw error; });
  }
  return initialization;
}
