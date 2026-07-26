CREATE TYPE application_status AS ENUM (
  'saved',
  'applying',
  'applied',
  'interview',
  'offer',
  'rejected',
  'archived'
);

CREATE TABLE jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source text NOT NULL,
  external_id text NOT NULL,
  title text NOT NULL,
  company text NOT NULL,
  location text,
  description text,
  posting_url text,
  apply_url text,
  salary_min numeric,
  salary_max numeric,
  salary_currency text,
  employment_type text,
  posted_at timestamptz,
  fetched_at timestamptz NOT NULL DEFAULT now(),
  dedupe_hash text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  status application_status NOT NULL DEFAULT 'saved',
  notes text,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE resumes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  storage_path text NOT NULL,
  filename text NOT NULL,
  mime_type text NOT NULL,
  extracted_text text,
  is_selected boolean NOT NULL DEFAULT false,
  uploaded_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE generations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  resume_id uuid REFERENCES resumes(id) ON DELETE SET NULL,
  kind text NOT NULL CHECK (kind IN ('analysis', 'resume', 'cover_letter')),
  model text NOT NULL,
  prompt_tokens int NOT NULL,
  completion_tokens int NOT NULL,
  duration_ms int NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'resumes',
  'resumes',
  false,
  5242880,
  ARRAY['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
)
ON CONFLICT (id) DO NOTHING;

CREATE INDEX idx_applications_job_id ON applications(job_id);
CREATE INDEX idx_generations_job_id ON generations(job_id);
CREATE INDEX idx_generations_resume_id ON generations(resume_id);

ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE resumes ENABLE ROW LEVEL SECURITY;
ALTER TABLE generations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated_all" ON jobs FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated_all" ON applications FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated_all" ON resumes FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated_all" ON generations FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "authenticated_all" ON storage.objects FOR ALL TO authenticated
USING (bucket_id = 'resumes')
WITH CHECK (bucket_id = 'resumes');
