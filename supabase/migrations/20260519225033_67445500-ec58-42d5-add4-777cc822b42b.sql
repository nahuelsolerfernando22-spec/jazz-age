-- Tabla de jugadores (identidad por dispositivo)
CREATE TABLE public.players (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  device_id TEXT NOT NULL UNIQUE,
  alias TEXT NOT NULL CHECK (char_length(alias) BETWEEN 2 AND 24),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;

CREATE POLICY "players_public_read" ON public.players
  FOR SELECT USING (true);

CREATE POLICY "players_public_insert" ON public.players
  FOR INSERT WITH CHECK (true);

CREATE POLICY "players_public_update" ON public.players
  FOR UPDATE USING (true) WITH CHECK (true);

-- Tabla de puntuaciones del ranking
CREATE TABLE public.scores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  device_id TEXT NOT NULL,
  alias TEXT NOT NULL,
  game TEXT NOT NULL CHECK (game IN (
    'ruleta','slots','poker','blackjack','mahjong','dados',
    'mentirosos','cucarachas','monte','fantan','bagatelle',
    'boxeo','billar','concierto','burlesque','bar'
  )),
  score BIGINT NOT NULL CHECK (score >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "scores_public_read" ON public.scores
  FOR SELECT USING (true);

CREATE POLICY "scores_public_insert" ON public.scores
  FOR INSERT WITH CHECK (true);

-- Índices para consultas de leaderboard
CREATE INDEX idx_scores_game_score ON public.scores (game, score DESC, created_at DESC);
CREATE INDEX idx_scores_device ON public.scores (device_id);

-- Función para actualizar updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_players_updated_at
  BEFORE UPDATE ON public.players
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();