
CREATE TABLE public.daily_tournament_runs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  day INTEGER NOT NULL,
  game TEXT NOT NULL,
  device_id TEXT NOT NULL,
  alias TEXT NOT NULL,
  score BIGINT NOT NULL DEFAULT 0,
  attempts INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT daily_tournament_runs_unique UNIQUE (day, game, device_id)
);

CREATE INDEX daily_tournament_runs_leaderboard_idx
  ON public.daily_tournament_runs (day, game, score DESC);

GRANT SELECT, INSERT, UPDATE ON public.daily_tournament_runs TO anon;
GRANT SELECT, INSERT, UPDATE ON public.daily_tournament_runs TO authenticated;
GRANT ALL ON public.daily_tournament_runs TO service_role;

ALTER TABLE public.daily_tournament_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tournament_public_read"
  ON public.daily_tournament_runs
  FOR SELECT
  USING (true);

CREATE POLICY "tournament_public_insert"
  ON public.daily_tournament_runs
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "tournament_public_update"
  ON public.daily_tournament_runs
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE TRIGGER update_daily_tournament_runs_updated_at
  BEFORE UPDATE ON public.daily_tournament_runs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
