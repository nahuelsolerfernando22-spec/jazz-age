import { type ReactNode } from "react";

interface GameTopBarProps {
  title: string;
  subtitle?: string;
  leading?: ReactNode;
  trailing?: ReactNode;
  chips?: ReactNode;
  className?: string;
}

export function GameTopBar({
  title,
  subtitle,
  leading,
  trailing,
  chips,
  className = "",
}: GameTopBarProps) {
  return (
    <header
      className={`cd-game-topbar relative flex items-center gap-2 rounded-xl border border-[var(--oro)]/25 bg-[var(--verde-noche)]/70 px-2.5 py-1.5 backdrop-blur-md sm:px-4 sm:py-2 ${className}`}
      style={{
        background: "linear-gradient(180deg, rgba(11,21,18,0.78) 0%, rgba(11,21,18,0.55) 100%)",
      }}
    >
      {leading ? <div className="shrink-0">{leading}</div> : null}

      <div className="min-w-0 flex-shrink-0 max-w-[46%] sm:max-w-[38%]">
        <div
          className="truncate text-[15px] leading-tight text-[var(--oro-claro)] sm:text-lg"
          style={{ fontFamily: "'Bebas Neue', sans-serif", letterSpacing: "0.12em" }}
        >
          {title}
        </div>
        {subtitle ? (
          <div className="truncate text-[11px] uppercase tracking-[0.22em] text-[var(--marfil)]/65">
            {subtitle}
          </div>
        ) : null}
      </div>

      {chips ? (
        <div className="cd-scroll-x-fade flex min-w-0 flex-1 items-center gap-1.5 overflow-x-auto scroll-smooth [-webkit-overflow-scrolling:touch] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {chips}
        </div>
      ) : (
        <div className="min-w-0 flex-1" />
      )}

      {trailing ? <div className="shrink-0">{trailing}</div> : null}
    </header>
  );
}
