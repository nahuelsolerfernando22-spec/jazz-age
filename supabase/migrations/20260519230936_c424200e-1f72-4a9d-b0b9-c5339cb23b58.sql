-- Vita-Mahjong-style progression: tiramos scores plano y guardamos progreso por nivel.

DROP TABLE IF EXISTS public.scores;

CREATE TABLE public.player_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id text NOT NULL,
  alias text NOT NULL,
  game text NOT NULL,
  level integer NOT NULL,
  stars smallint NOT NULL DEFAULT 0 CHECK (stars BETWEEN 0 AND 3),
  best_score bigint NOT NULL DEFAULT 0,
  attempts integer NOT NULL DEFAULT 0,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (device_id, game, level)
);

CREATE INDEX idx_progress_device ON public.player_progress(device_id);
CREATE INDEX idx_progress_game_level ON public.player_progress(game, level);
CREATE INDEX idx_progress_game_stars ON public.player_progress(game, stars DESC);

ALTER TABLE public.player_progress ENABLE ROW LEVEL SECURITY;

-- Sin login todavía: identidad por device_id. Lectura pública para ranking, escritura pública (validada client-side).
CREATE POLICY progress_public_read ON public.player_progress FOR SELECT TO public USING (true);
CREATE POLICY progress_public_insert ON public.player_progress FOR INSERT TO public WITH CHECK (true);
CREATE POLICY progress_public_update ON public.player_progress FOR UPDATE TO public USING (true) WITH CHECK (true);

CREATE TRIGGER trg_progress_updated_at
BEFORE UPDATE ON public.player_progress
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Vista de ranking: total de estrellas por jugador (todos los juegos).
CREATE OR REPLACE VIEW public.v_player_stars AS
SELECT
  device_id,
  MAX(alias) AS alias,
  SUM(stars)::int AS total_stars,
  COUNT(*) FILTER (WHERE stars > 0)::int AS levels_completed,
  COUNT(*) FILTER (WHERE stars = 3)::int AS perfect_levels
FROM public.player_progress
GROUP BY device_id;