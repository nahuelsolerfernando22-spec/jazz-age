import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/privacidad")({
  head: () => ({
    meta: [
      { title: "Privacidad y datos — El Cuervo Dorado" },
      {
        name: "description",
        content:
          "Cómo trata tus datos El Cuervo Dorado: todo se guarda en tu dispositivo, sin cuentas, sin servidores y sin dinero real.",
      },
      { property: "og:title", content: "Privacidad y datos — El Cuervo Dorado" },
      {
        property: "og:description",
        content: "Política de privacidad del juego: datos locales, sin cuentas y sin dinero real.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Privacidad,
});

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-[var(--oro)]/25 bg-[var(--verde-noche)]/70 p-5">
      <h2 className="text-sm font-semibold uppercase tracking-[0.24em] text-[var(--oro)]">
        {title}
      </h2>
      <div className="mt-2 space-y-2 text-[13px] leading-relaxed text-[var(--marfil)]/80">
        {children}
      </div>
    </section>
  );
}

function Privacidad() {
  return (
    <main className="min-h-dvh bg-[var(--verde-noche)] text-[var(--marfil)]">
      <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
        <div className="mb-6 flex items-center justify-between gap-3">
          <h1
            className="text-3xl text-[var(--oro)]"
            style={{ fontFamily: "'Bebas Neue', sans-serif", letterSpacing: "0.1em" }}
          >
            PRIVACIDAD Y DATOS
          </h1>
          <Link
            to="/ajustes"
            className="inline-flex min-h-11 shrink-0 items-center rounded-full border border-[var(--oro)]/50 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--oro)] hover:bg-[var(--oro)]/10"
          >
            Volver
          </Link>
        </div>

        <div className="space-y-4">
          <Block title="Sin dinero real">
            <p>
              El Cuervo Dorado es un juego de simulación. Las fichas, apuestas y premios son
              ficticios: no se puede depositar, ganar ni retirar dinero real, y no hay compras que
              otorguen ventaja monetaria. Practicar con fichas virtuales no implica que tendrías
              éxito apostando dinero real.
            </p>
          </Block>

          <Block title="Qué datos se guardan">
            <p>
              Todo el progreso (partidas, fichas, logros, ajustes y tu alias) se guarda únicamente
              en el almacenamiento local de tu dispositivo. No hay cuentas de usuario, no pedimos
              email ni teléfono, y no enviamos tus datos a ningún servidor.
            </p>
          </Block>

          <Block title="Métricas">
            <p>
              Las métricas de uso son opcionales, anónimas y se almacenan sólo en tu dispositivo
              para ajustar el balance de los juegos. Podés desactivarlas o borrarlas desde Ajustes
              en cualquier momento.
            </p>
          </Block>

          <Block title="Permisos">
            <p>
              La app puede pedir permiso de notificaciones para recordarte tu racha diaria. Es
              opcional y las notificaciones se generan en el propio dispositivo, sin servidor.
            </p>
          </Block>

          <Block title="Borrar tus datos">
            <p>
              Podés eliminar todo desde Ajustes → Almacenamiento local, o desinstalando la app. No
              queda ninguna copia fuera de tu dispositivo.
            </p>
          </Block>

          <Block title="Edad recomendada">
            <p>
              Contenido con temática de casino ficticio y ambientación adulta de los años 20.
              Recomendado para mayores de 18 años.
            </p>
          </Block>
        </div>
      </div>
    </main>
  );
}
