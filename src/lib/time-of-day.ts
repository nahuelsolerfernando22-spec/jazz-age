export type TimeBand = "amanecer" | "manana" | "dia" | "tarde" | "noche" | "madrugada";

export interface TimeMeta {
  band: TimeBand;
  label: string;
  tint: string;
  mapTint: string;
  mapFilter: string;
  whisper: string;
}

export function getTimeBand(now: Date = new Date()): TimeBand {
  const h = now.getHours();
  if (h >= 5 && h < 8) return "amanecer";
  if (h >= 8 && h < 12) return "manana";
  if (h >= 12 && h < 15) return "dia";
  if (h >= 15 && h < 19) return "tarde";
  if (h >= 19 || h < 2) return "noche";
  return "madrugada";
}

export function getTimeMeta(now: Date = new Date()): TimeMeta {
  const band = getTimeBand(now);
  switch (band) {
    case "amanecer":
      return {
        band,
        label: "Amanecer",
        tint: "linear-gradient(to bottom, rgba(255, 180, 120, 0.10), rgba(80, 30, 40, 0.06))",
        mapTint:
          "linear-gradient(180deg, rgba(255, 170, 110, 0.16) 0%, rgba(200, 90, 80, 0.10) 55%, rgba(40, 20, 40, 0.08) 100%)",
        mapFilter: "brightness(1.02) saturate(0.95) hue-rotate(-4deg)",
        whisper: "El último cliente ya se fue. La luz roza los vasos vacíos.",
      };
    case "manana":
      return {
        band,
        label: "Mañana",
        tint: "linear-gradient(to bottom, rgba(240, 220, 180, 0.06), rgba(60, 40, 20, 0.05))",
        mapTint:
          "linear-gradient(180deg, rgba(255, 230, 180, 0.10) 0%, rgba(220, 190, 140, 0.05) 60%, rgba(30, 20, 15, 0.06) 100%)",
        mapFilter: "brightness(1.08) saturate(1.02) contrast(0.98)",
        whisper: "Se abren las cortinas. El polvo baila en el rayo de sol.",
      };
    case "dia":
      return {
        band,
        label: "Mediodía",
        tint: "linear-gradient(to bottom, rgba(230, 220, 200, 0.05), rgba(40, 30, 20, 0.06))",
        mapTint:
          "linear-gradient(180deg, rgba(255, 245, 220, 0.08) 0%, rgba(240, 210, 170, 0.03) 60%, rgba(30, 20, 20, 0.05) 100%)",
        mapFilter: "brightness(1.12) saturate(1.05) contrast(1)",
        whisper: "Sol alto. Adentro se duerme la resaca en silencio.",
      };
    case "tarde":
      return {
        band,
        label: "Tarde",
        tint: "linear-gradient(to bottom, rgba(220, 150, 100, 0.08), rgba(60, 30, 25, 0.10))",
        mapTint:
          "linear-gradient(180deg, rgba(230, 150, 90, 0.12) 0%, rgba(190, 90, 70, 0.08) 60%, rgba(40, 20, 30, 0.10) 100%)",
        mapFilter: "brightness(1.0) saturate(1.08) hue-rotate(-2deg)",
        whisper: "Persianas bajas. Adentro se ensaya para la noche.",
      };
    case "noche":
      return {
        band,
        label: "Noche cerrada",

        tint: "linear-gradient(to bottom, rgba(20, 15, 40, 0.04), rgba(15, 5, 20, 0.12))",
        mapTint:
          "linear-gradient(180deg, rgba(25, 30, 70, 0.14) 0%, rgba(15, 10, 30, 0.18) 60%, rgba(0, 0, 0, 0.24) 100%)",

        mapFilter: "brightness(0.88) saturate(0.95) contrast(1.02) hue-rotate(4deg)",
        whisper: "La sala respira parejo. Es la hora buena.",
      };
    case "madrugada":
      return {
        band,
        label: "Madrugada",

        tint: "linear-gradient(to bottom, rgba(40, 30, 80, 0.08), rgba(10, 5, 25, 0.14))",
        mapTint:
          "linear-gradient(180deg, rgba(50, 40, 110, 0.16) 0%, rgba(20, 10, 45, 0.20) 60%, rgba(0, 0, 0, 0.28) 100%)",
        mapFilter: "brightness(0.80) saturate(0.90) contrast(1.03) hue-rotate(8deg)",
        whisper: "Sólo quedan los que no tienen a dónde ir.",
      };
  }
}
