CREATE TABLE public.cloud_saves (
  user_id UUID NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  payload JSONB NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  client_updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.cloud_saves TO authenticated;
GRANT ALL ON public.cloud_saves TO service_role;

ALTER TABLE public.cloud_saves ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own cloud save"
  ON public.cloud_saves FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own cloud save"
  ON public.cloud_saves FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own cloud save"
  ON public.cloud_saves FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users delete own cloud save"
  ON public.cloud_saves FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE TRIGGER update_cloud_saves_updated_at
  BEFORE UPDATE ON public.cloud_saves
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();