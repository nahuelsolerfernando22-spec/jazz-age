import { generateSubMap } from "../../src/lib/sindicato-map-gen";
import { misionesPosibles } from "../../src/lib/sindicato-objetivos";
const stats: Record<string, number> = {};
let minMis = 99;
for (let i = 0; i < 60; i++) {
  const m = generateSubMap(`s${i}`, 12 + (i % 23));
  stats[m.variante] = (stats[m.variante] ?? 0) + 1;
  // conectividad
  const ids = new Set(m.territorios.map((t) => t.id));
  const seen = new Set([m.territorios[0].id]);
  const q = [m.territorios[0].id];
  while (q.length) {
    const c = q.pop()!;
    for (const v of m.territorios.find((t) => t.id === c)!.vecinos) {
      if (ids.has(v) && !seen.has(v)) { seen.add(v); q.push(v); }
    }
  }
  if (seen.size !== ids.size) console.log("DESCONECTADO", i, seen.size, ids.size);
  const mis = misionesPosibles(m.territorios, m.rasgos);
  minMis = Math.min(minMis, mis.length);
  if (mis.length < 3) console.log("POCAS MISIONES", i, m.territorios.length, mis.length);
}
console.log(stats, "minMisiones", minMis);
