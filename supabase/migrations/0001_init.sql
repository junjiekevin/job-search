CREATE TYPE application_status AS ENUM (
  'saved',
  'applying',
  'applied',
  'interview',
  'offer',
  'rejected',
  'archived'
);

CREATE TABLE profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, created_at)
  VALUES (new.id, new.email, now());
  RETURN new;
END;
$$;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

CREATE TABLE jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
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
  dedupe_hash text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, dedupe_hash)
);

ALTER TABLE jobs ADD CONSTRAINT jobs_id_user_id_unique UNIQUE (id, user_id);

CREATE TABLE applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  job_id uuid NOT NULL,
  status application_status NOT NULL DEFAULT 'saved',
  notes text,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, job_id),
  FOREIGN KEY (job_id, user_id) REFERENCES jobs(id, user_id) ON DELETE CASCADE
);

CREATE TABLE resumes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  storage_path text NOT NULL,
  filename text NOT NULL,
  mime_type text NOT NULL,
  extracted_text text,
  is_selected boolean NOT NULL DEFAULT false,
  uploaded_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE resumes ADD CONSTRAINT resumes_id_user_id_unique UNIQUE (id, user_id);

CREATE TABLE generations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  job_id uuid NOT NULL,
  resume_id uuid REFERENCES resumes(id) ON DELETE SET NULL,
  kind text NOT NULL CHECK (kind IN ('analysis', 'resume', 'cover_letter')),
  model text NOT NULL,
  prompt_tokens int NOT NULL,
  completion_tokens int NOT NULL,
  duration_ms int NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (job_id, user_id) REFERENCES jobs(id, user_id) ON DELETE CASCADE
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

CREATE UNIQUE INDEX IF NOT EXISTS resumes_single_selected_per_user
ON resumes (user_id, is_selected) WHERE is_selected = true;

CREATE INDEX idx_generations_job_id ON generations(job_id);
CREATE INDEX idx_generations_resume_id ON generations(resume_id);

CREATE OR REPLACE FUNCTION check_generation_resume_owner()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.resume_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM resumes WHERE id = NEW.resume_id AND user_id = NEW.user_id
  ) THEN
    RAISE EXCEPTION 'resume_id must reference a resume owned by the same user';
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER on_generations_insert_update
  BEFORE INSERT OR UPDATE ON generations
  FOR EACH ROW
  EXECUTE FUNCTION check_generation_resume_owner();

CREATE OR REPLACE FUNCTION set_selected_resume(p_id uuid)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM resumes WHERE id = p_id AND user_id = auth.uid()) THEN
    RAISE EXCEPTION 'Résumé with id % does not exist', p_id;
  END IF;

  PERFORM 1 FROM resumes WHERE (id = p_id OR is_selected = true) AND user_id = auth.uid() FOR UPDATE;

  UPDATE resumes
  SET is_selected = (id = p_id)
  WHERE (id = p_id OR is_selected = true) AND user_id = auth.uid();
END;
$$;

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE resumes ENABLE ROW LEVEL SECURITY;
ALTER TABLE generations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_owns" ON profiles FOR ALL TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "user_owns" ON jobs FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "user_owns" ON applications FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "user_owns" ON resumes FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "user_owns" ON generations FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "user_resumes" ON storage.objects FOR ALL TO authenticated
  USING (bucket_id = 'resumes' AND (storage.foldername(name))[1] = auth.uid()::text)
  WITH CHECK (bucket_id = 'resumes' AND (storage.foldername(name))[1] = auth.uid()::text);
