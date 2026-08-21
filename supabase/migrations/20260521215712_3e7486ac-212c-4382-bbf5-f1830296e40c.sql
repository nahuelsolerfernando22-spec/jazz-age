-- =========================================
-- PROFILES
-- =========================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  avatar_seed INTEGER NOT NULL DEFAULT (floor(random() * 1000000)::integer),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT display_name_format CHECK (char_length(display_name) BETWEEN 3 AND 18 AND display_name ~ '^[A-Za-z0-9_\-]+$')
);

CREATE UNIQUE INDEX profiles_display_name_lower_key ON public.profiles (LOWER(display_name));

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profiles are viewable by everyone"
  ON public.profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================
-- AUTO-CREATE PROFILE ON SIGNUP
-- =========================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  candidate TEXT;
  suffix INT;
BEGIN
  -- Base del alias: lo que el usuario eligió, o derivado del email, o "jugador"
  candidate := COALESCE(
    NULLIF(regexp_replace(COALESCE(NEW.raw_user_meta_data->>'display_name', ''), '[^A-Za-z0-9_\-]', '', 'g'), ''),
    NULLIF(regexp_replace(split_part(COALESCE(NEW.email, ''), '@', 1), '[^A-Za-z0-9_\-]', '', 'g'), ''),
    'jugador'
  );
  candidate := substr(candidate, 1, 12);
  IF char_length(candidate) < 3 THEN
    candidate := 'jugador';
  END IF;

  suffix := floor(random() * 9000 + 1000)::int;

  INSERT INTO public.profiles (id, display_name)
  VALUES (NEW.id, candidate || '_' || suffix::text);

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- =========================================
-- PINBALL RUNS
-- =========================================
CREATE TABLE public.pinball_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  mode TEXT NOT NULL,
  seed TEXT NOT NULL,
  score INTEGER NOT NULL DEFAULT 0,
  best_ball INTEGER NOT NULL DEFAULT 0,
  balls_played INTEGER NOT NULL DEFAULT 1,
  combo_max INTEGER NOT NULL DEFAULT 0,
  jackpots INTEGER NOT NULL DEFAULT 0,
  duration_ms INTEGER NOT NULL DEFAULT 0,
  replay JSONB,
  client_version TEXT NOT NULL DEFAULT 'v1',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT pinball_runs_mode_check CHECK (mode IN ('casual', 'daily', 'tournament')),
  CONSTRAINT pinball_runs_score_check CHECK (score BETWEEN 0 AND 9999999),
  CONSTRAINT pinball_runs_best_ball_check CHECK (best_ball BETWEEN 0 AND 999999),
  CONSTRAINT pinball_runs_balls_check CHECK (balls_played BETWEEN 1 AND 20),
  CONSTRAINT pinball_runs_duration_check CHECK (duration_ms BETWEEN 500 AND 1800000)
);

CREATE INDEX pinball_runs_best_ball_idx ON public.pinball_runs (best_ball DESC, created_at DESC);
CREATE INDEX pinball_runs_score_idx ON public.pinball_runs (score DESC, created_at DESC);
CREATE INDEX pinball_runs_user_idx ON public.pinball_runs (user_id, created_at DESC);
CREATE INDEX pinball_runs_mode_created_idx ON public.pinball_runs (mode, created_at DESC);
-- Reto diario: solo 1 entrada por usuario por semilla
CREATE UNIQUE INDEX pinball_runs_daily_unique ON public.pinball_runs (user_id, seed) WHERE mode = 'daily';

ALTER TABLE public.pinball_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Pinball runs are viewable by everyone"
  ON public.pinball_runs FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can submit their own runs"
  ON public.pinball_runs FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);
