import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children: ReactNode;

  label: string;

  onRetry?: () => void;
}

interface State {
  error: Error | null;
  attempt: number;
}

export class SectionErrorBoundary extends Component<Props, State> {
  state: State = { error: null, attempt: 0 };

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(`[SectionErrorBoundary:${this.props.label}]`, error, info.componentStack);
  }

  private handleRetry = () => {
    this.props.onRetry?.();

    this.setState((s) => ({ error: null, attempt: s.attempt + 1 }));
  };

  render() {
    if (this.state.error) {
      return <RecoveryCard label={this.props.label} onRetry={this.handleRetry} />;
    }
    return <div key={this.state.attempt}>{this.props.children}</div>;
  }
}

export function RecoveryCard({
  label,
  onRetry,
  hint,
}: {
  label: string;
  onRetry: () => void;
  hint?: string;
}) {
  return (
    <section
      role="alert"
      className="relative overflow-hidden rounded-2xl border border-[var(--oro)]/30 bg-black/50 p-4 text-[var(--marfil)] shadow-[0_8px_24px_-12px_rgba(0,0,0,0.7)] sm:p-5"
    >
      <p className="text-[11px] uppercase tracking-[0.35em] text-[var(--oro)]/80">{label}</p>
      <h3
        className="mt-0.5 text-2xl text-[var(--oro-claro)] drop-shadow-[0_2px_10px_rgba(0,0,0,0.7)]"
        style={{ fontFamily: "'Bebas Neue', sans-serif", letterSpacing: "0.06em" }}
      >
        SE TRABÓ LA BANDEJA
      </h3>
      <p className="mt-2 text-sm text-[var(--marfil)]/80">
        {hint ??
          "Mirla no pudo servir esta sección. Reintentá — los datos quedan en tu dispositivo."}
      </p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-3 inline-flex items-center gap-2 rounded-full border border-[var(--oro)] bg-gradient-to-r from-[var(--oro)] to-[var(--oro-claro)] px-4 py-2 text-xs font-bold uppercase tracking-[0.25em] text-[var(--verde-noche)] transition hover:brightness-110"
      >
        Reintentar
      </button>
    </section>
  );
}
