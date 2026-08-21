-- Recrear vista con security_invoker para evitar warning de SECURITY DEFINER.
DROP VIEW IF EXISTS public.v_player_stars;

CREATE VIEW public.v_player_stars
WITH (security_invoker = true) AS
SELECT
  device_id,
  MAX(alias) AS alias,
  SUM(stars)::int AS total_stars,
  COUNT(*) FILTER (WHERE stars > 0)::int AS levels_completed,
  COUNT(*) FILTER (WHERE stars = 3)::int AS perfect_levels
FROM public.player_progress
GROUP BY device_id;