GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA storage TO authenticated;
GRANT USAGE ON TYPE public.application_status TO authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.jobs TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.applications TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.resumes TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.generations TO authenticated;

GRANT EXECUTE ON FUNCTION public.set_selected_resume(uuid) TO authenticated;

GRANT SELECT ON TABLE storage.buckets TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE storage.objects TO authenticated;
