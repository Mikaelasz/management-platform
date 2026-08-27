/*
# Create initial schema for Muay Thai Manager

1. New Tables
- `students` - Alunos com horários de aula
  - id (uuid, primary key)
  - name (text, not null)
  - birth_date (date)
  - phone (text)
  - location (text)
  - schedule (jsonb) - array of {day, startTime, endTime}
  - monthly_value (numeric)
  - due_date (integer) - dia do vencimento
  - has_graduation (boolean)
  - graduation_level (text)
  - notes (text)
  - status (text) - 'active' | 'inactive'
  - created_at, updated_at (timestamps)

- `academies` - Academias com horários de aula
  - id (uuid, primary key)
  - name (text, not null)
  - schedule (jsonb)
  - location (text)
  - monthly_value (numeric)
  - notes (text)
  - status (text)
  - created_at, updated_at

- `events` - Eventos/aulas agendadas
  - id (uuid, primary key)
  - title (text)
  - type (text) - 'private' | 'group' | 'cancelled'
  - student_id (uuid, foreign key to students)
  - academy_id (uuid, foreign key to academies)
  - date (date)
  - start_time, end_time (text)
  - location (text)
  - notes (text)
  - created_at, updated_at

- `payments` - Pagamentos
  - id (uuid, primary key)
  - type (text) - 'student' | 'academy'
  - reference_id (uuid)
  - reference_name (text)
  - amount (numeric)
  - due_date (date)
  - paid_date (date, nullable)
  - month (text)
  - year (integer)
  - status (text) - 'paid' | 'pending' | 'overdue'
  - created_at, updated_at

2. Security
- Enable RLS on all tables
- Allow anon + authenticated full CRUD (single-tenant app)

3. Indexes
- Index on student_id, academy_id in events
- Index on reference_id in payments
*/

-- Students table
CREATE TABLE IF NOT EXISTS students (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  birth_date date,
  phone text DEFAULT '',
  location text DEFAULT '',
  schedule jsonb DEFAULT '[]',
  monthly_value numeric DEFAULT 0,
  due_date integer DEFAULT 1,
  has_graduation boolean DEFAULT false,
  graduation_level text DEFAULT 'none',
  notes text DEFAULT '',
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE students ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_students" ON students;
CREATE POLICY "anon_select_students" ON students FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_students" ON students;
CREATE POLICY "anon_insert_students" ON students FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_students" ON students;
CREATE POLICY "anon_update_students" ON students FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_students" ON students;
CREATE POLICY "anon_delete_students" ON students FOR DELETE
  TO anon, authenticated USING (true);

-- Academies table
CREATE TABLE IF NOT EXISTS academies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  schedule jsonb DEFAULT '[]',
  location text DEFAULT '',
  monthly_value numeric DEFAULT 0,
  notes text DEFAULT '',
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE academies ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_academies" ON academies;
CREATE POLICY "anon_select_academies" ON academies FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_academies" ON academies;
CREATE POLICY "anon_insert_academies" ON academies FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_academies" ON academies;
CREATE POLICY "anon_update_academies" ON academies FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_academies" ON academies;
CREATE POLICY "anon_delete_academies" ON academies FOR DELETE
  TO anon, authenticated USING (true);

-- Events table
CREATE TABLE IF NOT EXISTS events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL DEFAULT '',
  type text NOT NULL DEFAULT 'private',
  student_id uuid REFERENCES students(id) ON DELETE SET NULL,
  academy_id uuid REFERENCES academies(id) ON DELETE SET NULL,
  date date NOT NULL,
  start_time text DEFAULT '',
  end_time text DEFAULT '',
  location text DEFAULT '',
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_events" ON events;
CREATE POLICY "anon_select_events" ON events FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_events" ON events;
CREATE POLICY "anon_insert_events" ON events FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_events" ON events;
CREATE POLICY "anon_update_events" ON events FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_events" ON events;
CREATE POLICY "anon_delete_events" ON events FOR DELETE
  TO anon, authenticated USING (true);

-- Payments table
CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL DEFAULT 'student',
  reference_id uuid,
  reference_name text NOT NULL DEFAULT '',
  amount numeric DEFAULT 0,
  due_date date,
  paid_date date,
  month text NOT NULL DEFAULT '',
  year integer NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_payments" ON payments;
CREATE POLICY "anon_select_payments" ON payments FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_payments" ON payments;
CREATE POLICY "anon_insert_payments" ON payments FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_payments" ON payments;
CREATE POLICY "anon_update_payments" ON payments FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_payments" ON payments;
CREATE POLICY "anon_delete_payments" ON payments FOR DELETE
  TO anon, authenticated USING (true);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_events_student_id ON events(student_id);
CREATE INDEX IF NOT EXISTS idx_events_academy_id ON events(academy_id);
CREATE INDEX IF NOT EXISTS idx_events_date ON events(date);
CREATE INDEX IF NOT EXISTS idx_payments_reference_id ON payments(reference_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
DROP TRIGGER IF EXISTS update_students_updated_at ON students;
CREATE TRIGGER update_students_updated_at
  BEFORE UPDATE ON students
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_academies_updated_at ON academies;
CREATE TRIGGER update_academies_updated_at
  BEFORE UPDATE ON academies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_events_updated_at ON events;
CREATE TRIGGER update_events_updated_at
  BEFORE UPDATE ON events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_payments_updated_at ON payments;
CREATE TRIGGER update_payments_updated_at
  BEFORE UPDATE ON payments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
