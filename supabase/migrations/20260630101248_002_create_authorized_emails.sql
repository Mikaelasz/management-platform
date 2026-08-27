/*
# Create authorized_emails table

1. New Tables
- `authorized_emails`
  - id (uuid, primary key)
  - email (text, unique, not null)
  - name (text, optional - name of authorized user)
  - created_at (timestamp)

2. Security
- Enable RLS on `authorized_emails`
- Allow anon + authenticated read (to check authorization)
- Only service role can insert/update/delete (managed via admin)

3. Initial Data
- Insert the default professor email
*/

CREATE TABLE IF NOT EXISTS authorized_emails (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  name text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE authorized_emails ENABLE ROW LEVEL SECURITY;

-- Allow anyone to check if an email is authorized (needed for auth flow)
DROP POLICY IF EXISTS "anon_select_authorized_emails" ON authorized_emails;
CREATE POLICY "anon_select_authorized_emails" ON authorized_emails FOR SELECT
  TO anon, authenticated USING (true);

-- Insert default authorized email
INSERT INTO authorized_emails (email, name) 
VALUES ('professor@muaythai.com', 'Professor Muay Thai')
ON CONFLICT (email) DO NOTHING;
