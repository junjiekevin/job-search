CREATE OR REPLACE FUNCTION set_selected_resume(p_id uuid)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  UPDATE resumes
  SET is_selected = (id = p_id)
  WHERE id = p_id OR is_selected = true;
END;
$$;
