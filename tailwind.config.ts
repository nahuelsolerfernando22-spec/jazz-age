// Stub de compatibilidad. Este proyecto usa Tailwind v4 con configuración
// nativa en src/styles.css (@theme). No agregar aquí themes/plugins reales:
// la fuente de la verdad es styles.css.
import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
};

export default config;
