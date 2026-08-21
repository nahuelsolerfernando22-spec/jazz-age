/**
 * Acceso diferido al cliente de la nube.
 *
 * El juego es offline primero: en el APK y en el modo demo nunca se toca la
 * nube, así que el cliente (≈200 kB) no debe entrar al paquete de arranque.
 * Se carga solo cuando alguna pizarra o torneo online lo pide de verdad.
 */
export async function getSupabase() {
  const { supabase } = await import("./client");
  return supabase;
}
