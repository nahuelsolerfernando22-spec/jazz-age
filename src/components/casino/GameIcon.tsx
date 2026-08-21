import type { CSSProperties, SVGProps } from "react";

type Props = SVGProps<SVGSVGElement> & {
  id: string;
  size?: number;
  color?: string;
  style?: CSSProperties;
};

export function GameIcon({ id, size = 22, color = "currentColor", style, ...rest }: Props) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: color,
    strokeWidth: 1.6,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    style,
    "aria-hidden": true,
    ...rest,
  };

  switch (id) {
    case "blackjack":
      return (
        <svg {...common}>
          <rect x="4" y="6" width="10" height="13" rx="1.4" transform="rotate(-10 9 12.5)" />
          <rect x="10" y="5" width="10" height="13" rx="1.4" transform="rotate(10 15 11.5)" />
          <path d="M15 9v5M13 11.5h4" />
        </svg>
      );
    case "chinchon":
      return (
        <svg {...common}>
          <rect x="4.5" y="5.5" width="9" height="13" rx="1.2" />
          <rect x="9" y="4" width="10" height="14" rx="1.2" />
          <path d="M12.5 9h3M14 9v3.5a1.5 1.5 0 003 0V9" />
        </svg>
      );
    case "truco":
      return (
        <svg {...common}>
          <path d="M5 5l9 9M19 5l-9 9" />
          <path d="M4 6.5l2-1.5M20 6.5l-2-1.5" />
          <circle cx="8.5" cy="17.5" r="2" />
          <circle cx="15.5" cy="17.5" r="2" />
          <path d="M10 16l4 0" />
        </svg>
      );
    case "mahjong":
      return (
        <svg {...common}>
          <rect x="5" y="3.5" width="14" height="17" rx="2" />
          <path d="M12 7v3M12 11v3M12 14v3" />
          <path d="M10 8.5h4M10 12.5h4M10 16h4" />
        </svg>
      );
    case "escoba":
      return (
        <svg {...common}>
          <path d="M13 3l-8 8" />
          <path d="M4 12l6 6 8-8-6-6z" opacity="0" />
          <path d="M10 9l5 5" />
          <path d="M15 14l5 5" />
          <path d="M13 17l4-4 3 3-4 4z" />
          <path d="M14 17l1 1M16 15l1 1M17.5 13.5l1 1" />
        </svg>
      );
    case "dados":
      return (
        <svg {...common}>
          <rect x="3" y="9" width="10" height="10" rx="1.4" />
          <rect x="11" y="5" width="10" height="10" rx="1.4" />
          <circle cx="6" cy="12" r="0.9" fill={color} stroke="none" />
          <circle cx="10" cy="16" r="0.9" fill={color} stroke="none" />
          <circle cx="14" cy="8" r="0.9" fill={color} stroke="none" />
          <circle cx="18" cy="12" r="0.9" fill={color} stroke="none" />
          <circle cx="14" cy="12" r="0.9" fill={color} stroke="none" />
        </svg>
      );
    case "ruleta":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="8.5" />
          <circle cx="12" cy="12" r="3" />
          <path d="M12 3.5v17M3.5 12h17M6 6l12 12M18 6L6 18" />
        </svg>
      );
    case "slots":
      return (
        <svg {...common}>
          <rect x="3.5" y="5" width="14" height="14" rx="1.6" />
          <path d="M3.5 10h14" />
          <path d="M8 10v9M13 10v9" />
          <path d="M17.5 8v6M17.5 8a1.5 1.5 0 113 0M20.5 8v6a1.5 1.5 0 01-3 0" />
        </svg>
      );
    case "bagatelle":
      return (
        <svg {...common}>
          <path d="M6 3.5h12v13a4 4 0 01-4 4h-4a4 4 0 01-4-4z" />
          <circle cx="10" cy="9" r="0.9" fill={color} stroke="none" />
          <circle cx="14" cy="9" r="0.9" fill={color} stroke="none" />
          <circle cx="10" cy="13" r="0.9" fill={color} stroke="none" />
          <circle cx="14" cy="13" r="0.9" fill={color} stroke="none" />
          <circle cx="12" cy="18" r="1.4" fill={color} stroke="none" />
        </svg>
      );
    case "solitario":
      return (
        <svg {...common}>
          <rect x="4" y="8" width="7" height="10" rx="1" />
          <rect x="9" y="6" width="7" height="10" rx="1" />
          <rect x="14" y="4" width="7" height="10" rx="1" />
          <path d="M17.5 7v4M15.5 9h4" />
        </svg>
      );
    case "sindicato":
      return (
        <svg {...common}>
          <path d="M12 21l-9-5 9-5 9 5-9 5z" />
          <path d="M12 11V3" />
          <path d="M3 16v-5l9-5 9 5v5" />
          <path d="M7 13.5v-3M17 13.5v-3" strokeWidth="1.2" opacity="0.8" />
        </svg>
      );
    case "monte":
      return (
        <svg {...common}>
          <rect x="4" y="5" width="16" height="14" rx="1.5" />
          <path d="M4 10h16M10 5v14M12 7.5h3.5M12 16.5h3.5" />
          <circle cx="7" cy="7.5" r="1" fill={color} stroke="none" />
          <circle cx="7" cy="16.5" r="1" fill={color} stroke="none" />
        </svg>
      );
    default:
      return (
        <svg {...common}>
          <path d="M4 17h16M5 8l3 5 4-7 4 7 3-5-1 9H6z" />
        </svg>
      );
  }
}

export default GameIcon;
