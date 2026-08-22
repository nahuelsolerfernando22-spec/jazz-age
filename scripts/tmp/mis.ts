import { generateSubMap } from "../../src/lib/sindicato-map-gen";
import { repartirObjetivos, evaluarObjetivo } from "../../src/lib/sindicato-objetivos";
const kinds: Record<string, number> = {};
const vars: Record<string, number> = {};
const sizes = new Set<number>();
for (let i = 0; i < 40; i++) {
  const target = 12 + (i % 20);
  const m = generateSubMap(`seed-${i}`, target);
  vars[m.variante] = (vars[m.variante] ?? 0) + 1;
  sizes.add(m.territorios.length);
  // conexo?
  const ids = new Set(m.territorios.map(t=>t.id));
  const seen = new Set([m.territorios[0].id]); const q=[m.territorios[0].id];
  while(q.length){const c=q.pop()!;for(const v of m.territorios.find(t=>t.id===c)!.vecinos){if(ids.has(v)&&!seen.has(v)){seen.add(v);q.push(v);}}}
  if (seen.size !== ids.size) console.log("DESCONECTADO", i, seen.size, ids.size);
  const objs = repartirObjetivos(`s${i}`, [0,1,2], m.territorios, Math.ceil(m.territorios.length*0.6));
  for (const o of Object.values(objs)) {
    kinds[o.kind] = (kinds[o.kind] ?? 0) + 1;
    const board = { conquests: Object.fromEntries(m.territorios.map((t,j)=>[t.id,{id:t.id,ownerId:j%3,troops:1}])), territories: m.territorios, eliminados: {}, comun: 99 };
    const p = evaluarObjetivo(o, board, 0);
    if (!(p.progreso >= 0 && p.progreso <= 1)) console.log("PROG MALO", o, p);
    if (i===0) console.log(o.kind, "|", o.titulo, "|", o.desc, "|", p.detalle);
  }
}
console.log(kinds, vars, "tamaños distintos:", sizes.size);
