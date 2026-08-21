import { TERRITORIOS, type Territorio, type BarrioId, BARRIOS } from "./sindicato-data";
import { rngFromSeed, rngInt, rngShuffle, type RngFn } from "./rng";

export interface ProceduralMap {
  territorios: Territorio[];
  seed: string;
}

export function generateSubMap(seed: string, targetCount: number): ProceduralMap {
  const rng = rngFromSeed(`map-gen:${seed}`);

  const startIndex = rngInt(rng, 0, TERRITORIOS.length - 1);
  const startNode = TERRITORIOS[startIndex];

  const selectedIds = new Set<string>([startNode.id]);
  const frontier = new Set<string>(startNode.vecinos);

  while (selectedIds.size < targetCount && frontier.size > 0) {
    const frontierArray = Array.from(frontier);
    const nextId = frontierArray[rngInt(rng, 0, frontierArray.length - 1)];

    selectedIds.add(nextId);
    frontier.delete(nextId);

    const nextNode = TERRITORIOS.find((t) => t.id === nextId);
    if (nextNode) {
      nextNode.vecinos.forEach((v) => {
        if (!selectedIds.has(v)) {
          frontier.add(v);
        }
      });
    }
  }

  const subTerritorios: Territorio[] = TERRITORIOS.filter((t) => selectedIds.has(t.id)).map(
    (t) => ({
      ...t,
      vecinos: t.vecinos.filter((v) => selectedIds.has(v)),
    }),
  );

  return {
    territorios: subTerritorios,
    seed,
  };
}

export function getActiveBarrios(territorios: Territorio[]) {
  const barrioIds = new Set(territorios.map((t) => t.barrio));
  return BARRIOS.filter((b) => barrioIds.has(b.id));
}
