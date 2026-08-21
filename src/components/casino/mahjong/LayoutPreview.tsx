import type { TilePos } from "@/lib/games/mahjong/mahjong-levels";

interface Props {
  positions: TilePos[];
  width: number;
  height: number;
  color: string;
}

export function LayoutPreview({ positions, width, height, color }: Props) {
  if (positions.length === 0) return null;
  const xs = positions.map((p) => p.x);
  const ys = positions.map((p) => p.y);
  const zs = positions.map((p) => p.z);
  const minX = Math.min(...xs);
  const minY = Math.min(...ys);
  const maxX = Math.max(...xs);
  const maxY = Math.max(...ys);
  const maxZ = Math.max(...zs);

  const colsW = maxX - minX + 1;
  const rowsH = maxY - minY + 1;
  const zOffX = 1.2;
  const zOffY = -1.6;

  const totalW = colsW + maxZ * zOffX;
  const totalH = rowsH + Math.abs(maxZ * zOffY);
  const cell = Math.min(width / totalW, height / totalH) * 0.9;
  const tileW = cell;
  const tileH = cell * 1.25;
  const padX = (width - colsW * tileW - maxZ * zOffX * cell) / 2;
  const padY =
    (height - rowsH * tileH - Math.abs(maxZ * zOffY) * cell) / 2 + Math.abs(maxZ * zOffY) * cell;

  const sorted = [...positions].sort((a, b) => a.z - b.z || a.y - b.y || a.x - b.x);

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      {sorted.map((p, i) => {
        const x = padX + (p.x - minX) * tileW + p.z * zOffX * cell;
        const y = padY + (p.y - minY) * tileH + p.z * zOffY * cell;
        const opacity = 0.55 + (p.z / Math.max(1, maxZ)) * 0.45;
        return (
          <rect
            key={i}
            x={x}
            y={y}
            width={tileW * 0.92}
            height={tileH * 0.92}
            rx={tileW * 0.12}
            fill={color}
            opacity={opacity}
            stroke="oklch(0 0 0 / 0.5)"
            strokeWidth={0.5}
          />
        );
      })}
    </svg>
  );
}
