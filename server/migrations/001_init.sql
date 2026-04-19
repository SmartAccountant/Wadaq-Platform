-- مخطط أولي متوافق مع حقول المستخدم في ودق (يمكن دمجه مع dump من Supabase)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT,
  name TEXT,
  company_name TEXT DEFAULT '',
  company_vat_number TEXT DEFAULT '',
  role TEXT DEFAULT 'user',
  subscription_status TEXT DEFAULT 'trial',
  subscription_type TEXT,
  subscription_plan TEXT,
  subscription_end_date TIMESTAMPTZ,
  trial_ends_at TIMESTAMPTZ,
  trial_end_date TIMESTAMPTZ,
  account_status TEXT DEFAULT 'active',
  auth_provider TEXT DEFAULT 'email',
  google_sub TEXT,
  organization_name TEXT,
  app_name TEXT,
  settings JSONB DEFAULT '{}'::jsonb,
  created_date TIMESTAMPTZ DEFAULT NOW(),
  updated_date TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users (lower(email));
CREATE INDEX IF NOT EXISTS idx_users_google_sub ON users (google_sub);

CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT,
  owner_email TEXT,
  vat_number TEXT,
  created_date TIMESTAMPTZ DEFAULT NOW()
);
