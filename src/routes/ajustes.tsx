import { createFileRoute, Link } from "@tanstack/react-router";
import { useCasino } from "@/store/casino";
import { toast } from "sonner";
import { useSettings } from "@/store/settings";
import { clearBuffer } from "@/lib/analytics";
import { useEffect, useState } from "react";
import { ensureNotificationPermission, notifyLocal } from "@/lib/notifications/local-notifications";
import ajustesHero from "@/assets/ajustes-hero.webp";
import { NameEditor } from "@/components/casino/NameEditor";
import { getPlayerAlias } from "@/lib/player-alias";
import { IconChinche } from "@/components/casino/DecoIcons";

/** Versión mostrada en "Acerca de" (coincide con versionName del build Android). */
const APP_VERSION = "1.0.0";

function NotificationsToggle() {
  const [perm, setPerm] = useState<NotificationPermission | "unsupported">("default");
  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      setPerm("unsupported");
      return;
    }
    setPerm(Notification.permission);
  }, []);
  const enabled = perm === "granted";
  const unsupported = perm === "unsupported";
  const denied = perm === "denied";
  return (
    <div className="mt-3 rounded-xl border border-white/10 bg-white/[0.02] p-3">
      <div className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--marfil)]">
        Recordatorios de racha
      </div>
      <p className="mt-1 text-[12px] font-medium leading-relaxed text-[var(--marfil)]/90">
        Notificación local (sin servidor) cuando tu racha diaria esté por caer. Se muestra sólo si
        abrís la app en las últimas horas del día.
      </p>
      <div className="mt-2 flex items-center gap-2">
        <button
          type="button"
          disabled={unsupported || denied || enabled}
          onClick={async () => {
            const ok = await ensureNotificationPermission();
            setPerm(ok ? "granted" : (Notification.permission as NotificationPermission));
            if (ok) {
              void notifyLocal({
                title: "Recordatorios activos",
                body: "Te avisaremos si tu racha está por romperse.",
                tag: "streak-optin",
              });
            }
          }}
          className="inline-flex min-h-11 items-center rounded-full border border-white/15 bg-white/[0.03] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--marfil)]/80 hover:border-[var(--oro)]/50 hover:text-[var(--oro)] disabled:opacity-50"
        >
          {unsupported ? "No soportado" : denied ? "Bloqueado" : enabled ? "Activado" : "Activar"}
        </button>
      </div>
    </div>
  );
}

export const Route = createFileRoute("/ajustes")({
  head: () => ({
    meta: [
      { title: "Ajustes — El Cuervo Dorado" },
      {
        name: "description",
        content: "Audio y accesibilidad del salón.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AjustesPage,
});

function Section({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="paria-paper paria-grime rounded-[3px] p-5">
      <span aria-hidden className="cinta -left-4 -top-2 -rotate-[7deg] z-10" />
      <span aria-hidden className="cinta -right-4 top-2 rotate-[5deg] z-10" />
      <header className="relative mb-4">
        <div className="flex items-center gap-2">
          <IconChinche size={13} className="shrink-0 text-[var(--oro)]/80" />
          <h2 className="paria-sign text-xl">{title.toUpperCase()}</h2>
          <span aria-hidden className="paria-rule flex-1" />
        </div>
        {hint ? (
          <p
            className="mt-1 text-xs text-[var(--marfil)]/85"
            style={{ fontFamily: "'Special Elite', monospace" }}
          >
            {hint}
          </p>
        ) : null}
      </header>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

function Slider({
  label,
  hint,
  value,
  min = 0,
  max = 1,
  step = 0.05,
  onChange,
  format,
}: {
  label: string;
  hint?: string;
  value: number;
  min?: number;
  max?: number;
  step?: number;
  onChange: (v: number) => void;
  format?: (v: number) => string;
}) {
  return (
    <label className="block">
      <div className="mb-1 flex items-center justify-between text-xs uppercase tracking-[0.2em] text-[var(--marfil)]/85">
        <span>{label}</span>
        <span className="text-[var(--oro)]/80">
          {format ? format(value) : `${Math.round(value * 100)}%`}
        </span>
      </div>
      {hint && (
        <p
          className="mb-2 text-[11px] text-[var(--marfil)]/65 italic leading-tight"
          style={{ fontFamily: "'Special Elite', monospace" }}
        >
          {hint}
        </p>
      )}
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full accent-[var(--oro)]"
      />
    </label>
  );
}

function Toggle({
  label,
  hint,
  value,
  onChange,
}: {
  label: string;
  hint?: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className="text-sm font-semibold text-[var(--marfil)]">{label}</p>
        {hint ? (
          <p className="mt-0.5 text-[12px] font-medium text-[var(--marfil)]/90">{hint}</p>
        ) : null}
      </div>
      <button
        type="button"
        onClick={() => onChange(!value)}
        aria-pressed={value}
        aria-label={label}
        className="relative inline-flex min-h-11 min-w-[52px] shrink-0 items-center justify-center px-1"
      >
        <span
          className={`relative block h-6 w-11 rounded-full border transition ${
            value ? "border-[var(--oro)] bg-[var(--oro)]/40" : "border-white/15 bg-white/[0.05]"
          }`}
        >
          <span
            className={`absolute top-1/2 h-4 w-4 -translate-y-1/2 rounded-full bg-[var(--oro)] transition ${
              value ? "left-6" : "left-1"
            }`}
          />
        </span>
      </button>
    </div>
  );
}

function ChoiceRow<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: Array<{ value: T; label: string }>;
  onChange: (v: T) => void;
}) {
  return (
    <div>
      <p className="mb-2 text-xs uppercase tracking-[0.2em] text-[var(--marfil)]/85">{label}</p>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => {
          const on = o.value === value;
          return (
            <button
              key={o.value}
              type="button"
              onClick={() => onChange(o.value)}
              className={`inline-flex min-h-11 items-center rounded-full border px-4 py-2 text-xs font-semibold transition ${
                on
                  ? "border-[var(--oro)] bg-[var(--oro)] text-[var(--verde-noche)]"
                  : "border-white/15 bg-white/[0.04] text-[var(--marfil)]/85 hover:border-[var(--oro)]/50 hover:text-[var(--oro)]"
              }`}
            >
              {o.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function AjustesPage() {
  return <AjustesInner />;
}

function AjustesInner() {
  const s = useSettings();
  return (
    <div className="min-h-dvh bg-[var(--verde-noche)] text-[var(--marfil)]">
      <div className="mx-auto max-w-3xl px-4 pt-8 sm:px-6" style={{ paddingBottom: "calc(var(--app-tabbar-h, 74px) + 24px)" }}>
        <div className="mb-4 flex items-center justify-between gap-3">
          <p className="text-[11px] uppercase tracking-[0.3em] text-[var(--marfil)]/65">
            El Cuervo Dorado
          </p>
        </div>

        <div className="relative mb-6 overflow-hidden rounded-3xl border border-[var(--oro)]/40 shadow-[0_20px_60px_-30px_rgba(201,168,76,0.55)]">
          <img
            src={ajustesHero}
            alt=""
            width={1536}
            height={640}
            className="h-40 w-full object-cover sm:h-52"
            loading="eager"
            decoding="async"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[var(--verde-noche)] via-[var(--verde-noche)]/40 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-5">
            <h1
              className="text-4xl text-[var(--oro)]"
              style={{ fontFamily: "'Bebas Neue', sans-serif", letterSpacing: "0.1em" }}
            >
              AJUSTES
            </h1>
            <p className="mt-1 text-[11px] uppercase tracking-[0.3em] text-[var(--marfil)]/85">
              Audio y accesibilidad
            </p>
          </div>
        </div>

        <div className="space-y-5">
          <Section title="Tu nombre" hint="Identidad en el salón. Solo local.">
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0">
                <p
                  className="truncate text-lg text-[var(--oro-claro)]"
                  style={{ fontFamily: "'Bebas Neue', sans-serif", letterSpacing: "0.1em" }}
                >
                  {getPlayerAlias().toUpperCase()}
                </p>
                <p className="mt-1 text-[12px] font-medium text-[var(--marfil)]/90">
                  Entre 2 y 20 caracteres.
                </p>
              </div>
              <NameEditor />
            </div>
          </Section>

          <Section title="Audio" hint="Silenciá todo o ajustá cada canal por separado.">
            <Toggle
              label="Silenciar todo"
              hint="Corta música, efectos y voz de las anfitrionas."
              value={s.muted}
              onChange={s.setMuted}
            />
            <Slider label="Volumen general" value={s.masterVolume} onChange={s.setMasterVolume} />
            <Slider label="Música" value={s.musicVolume} onChange={s.setMusicVolume} />
            <Slider label="Efectos" value={s.sfxVolume} onChange={s.setSfxVolume} />
            <Slider label="Voz de anfitriona" value={s.voiceVolume} onChange={s.setVoiceVolume} />
          </Section>

          <Section
            title="Accesibilidad"
            hint="Ajustes visuales y de lectura. Se aplican en toda la app."
          >
            <Toggle
              label="Alto contraste"
              hint="Refuerza bordes y quita transparencias. Útil bajo el sol o en pantallas OLED."
              value={s.highContrast}
              onChange={s.setHighContrast}
            />
            <Toggle
              label="Reducir movimiento"
              hint="Menos animaciones. Recomendado si te marea el vaivén de las cartas."
              value={s.reduceMotion}
              onChange={s.setReduceMotion}
            />
            <ChoiceRow
              label="Tamaño de subtítulos"
              value={s.subtitleSize}
              onChange={s.setSubtitleSize}
              options={[
                { value: "sm", label: "Pequeño" },
                { value: "md", label: "Normal" },
                { value: "lg", label: "Grande" },
              ]}
            />
            <Toggle
              label="Vibración (háptica)"
              hint="Solo en dispositivos que lo soporten."
              value={s.hapticFeedback}
              onChange={s.setHapticFeedback}
            />
            <div className="paria-rule my-4 opacity-30" />
            <Slider
              label="Intensidad Noir"
              hint="Ajusta la profundidad de las sombras y el contraste cinematográfico."
              value={s.noirIntensity}
              onChange={s.setNoirIntensity}
            />
            <Toggle
              label="Grano de película"
              hint="Añade textura de celuloide antiguo para mayor inmersión."
              value={s.filmGrain}
              onChange={s.setFilmGrain}
            />
          </Section>

          <Section title="Privacidad" hint="Todo se guarda en tu dispositivo.">
            <Toggle
              label="Compartir métricas anónimas"
              hint="Se registran localmente qué minijuegos jugás y cuándo cumplís misiones."
              value={s.analyticsEnabled}
              onChange={s.setAnalyticsEnabled}
            />
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  clearBuffer();
                  toast.success("Datos de uso borrados de este dispositivo");
                }}
                className="tap-comfort min-h-[44px] rounded-full border border-white/15 bg-white/[0.03] px-4 text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--marfil)]/80 active:border-[var(--oro)]/50 active:text-[var(--oro)]"
              >
                Borrar datos de uso
              </button>
              <Link
                to="/privacidad"
                className="inline-flex min-h-11 items-center rounded-full border border-[var(--oro)]/60 bg-[var(--oro)]/10 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--oro)] hover:bg-[var(--oro)]/20"
              >
                Política de privacidad
              </Link>
            </div>
          </Section>

          <Section title="Legajo" hint="Tu historial, logros y el pulso de la mesa.">
            <div className="flex flex-wrap gap-2">
              {(
                [
                  { to: "/torneo", label: "Torneo" },
                  { to: "/logros", label: "Logros" },
                  { to: "/estadisticas", label: "Estadísticas" },
                  { to: "/diario", label: "Diario" },
                  { to: "/camerinos", label: "Camerinos" },
                  { to: "/dificultad", label: "Dificultad" },
                ] as const
              ).map((l) => (
                <Link
                  key={l.to}
                  to={l.to}
                  className="inline-flex min-h-11 items-center rounded-full border border-white/15 bg-white/[0.03] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--marfil)]/80 hover:border-[var(--oro)]/50 hover:text-[var(--oro)]"
                >
                  {l.label}
                </Link>
              ))}
            </div>
            <button
              type="button"
              onClick={() => {
                useCasino.getState().resetTutorial();
                toast.success("La bienvenida vuelve a aparecer en la portada");
              }}
              className="mt-3 inline-flex min-h-11 items-center rounded-full border border-white/15 bg-white/[0.03] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--marfil)]/80 hover:border-[var(--oro)]/50 hover:text-[var(--oro)]"
            >
              Ver la bienvenida otra vez
            </button>
          </Section>

          <Section title="Acerca de" hint="Información de la app y contenido.">

            <div className="space-y-2 text-[14px] font-medium leading-relaxed text-[var(--marfil)]">
              <p>
                <span className="text-[var(--oro)]">El Cuervo Dorado</span> — versión {APP_VERSION}
              </p>
              <p>
                Juego de casino de ficción: las fichas y apuestas son virtuales, no hay dinero real
                ni posibilidad de ganarlo. Recomendado para mayores de 18 años.
              </p>
            </div>
            <div className="flex flex-wrap gap-2 pt-1">
              <Link
                to="/reglas"
                className="inline-flex min-h-11 items-center rounded-full border border-white/15 bg-white/[0.03] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--marfil)]/80 hover:border-[var(--oro)]/50 hover:text-[var(--oro)]"
              >
                Reglas de los juegos
              </Link>
              <Link
                to="/privacidad"
                className="inline-flex min-h-11 items-center rounded-full border border-white/15 bg-white/[0.03] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--marfil)]/80 hover:border-[var(--oro)]/50 hover:text-[var(--oro)]"
              >
                Privacidad
              </Link>
            </div>
          </Section>

          <div className="flex justify-end pt-2 pb-8">
            <button
              type="button"
              onClick={() => s.resetDefaults()}
              className="inline-flex min-h-11 items-center rounded-full border border-white/15 bg-white/[0.03] px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--marfil)]/80 hover:border-[var(--oro)]/50 hover:text-[var(--oro)]"
            >
              Restaurar valores por defecto
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
