CREATE TABLE public.leaderboards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  game text NOT NULL,
  mode text NOT NULL DEFAULT 'classic',
  seed text,
  score integer NOT NULL,
  meta jsonb NOT NULL DEFAULT '{}'::jsonb,
  display_name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX leaderboards_top_idx ON public.leaderboards (game, mode, score DESC, created_at ASC);
CREATE INDEX leaderboards_daily_idx ON public.leaderboards (game, mode, seed, score DESC) WHERE seed IS NOT NULL;
CREATE INDEX leaderboards_user_idx ON public.leaderboards (user_id, game, mode);

GRANT SELECT ON public.leaderboards TO anon;
GRANT SELECT, INSERT ON public.leaderboards TO authenticated;
GRANT ALL ON public.leaderboards TO service_role;

ALTER TABLE public.leaderboards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read leaderboards"
  ON public.leaderboards FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own scores"
  ON public.leaderboards FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);