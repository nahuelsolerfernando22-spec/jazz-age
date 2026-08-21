import { Component, type ErrorInfo, type ReactNode } from "react";
import { MirlaFallback } from "@/components/casino/ui/MirlaFallback";

interface Props {
  children: ReactNode;

  scope?: string;
}
interface State {
  error: Error | null;
}

export class SceneErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[SceneErrorBoundary]", error, info.componentStack);
  }

  private reset = () => this.setState({ error: null });

  render() {
    if (this.state.error) {
      return (
        <MirlaFallback
          onRetry={this.reset}
          title="Esperá — a Mirla se le cayó una copa."
          hint={
            this.props.scope
              ? `${this.props.scope} tuvo un traspié. Reintentá o volvé al salón mientras Mirla barre los cristales.`
              : "El garito tuvo un traspié. Reintentá o volvé al salón mientras Mirla barre los cristales."
          }
        />
      );
    }
    return this.props.children;
  }
}
