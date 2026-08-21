import type { Card } from "./deck";

export function findCaptures(table: Card[], target: number): Card[][] {
  const results: Card[][] = [];
  const n = table.length;

  for (let mask = 1; mask < 1 << n; mask++) {
    let sum = 0;
    const pick: Card[] = [];
    for (let i = 0; i < n; i++) {
      if (mask & (1 << i)) {
        sum += table[i].value;
        pick.push(table[i]);
        if (sum > target) break;
      }
    }
    if (sum === target) results.push(pick);
  }

  results.sort((a, b) => a.length - b.length);
  return results;
}

export function capturesFor(table: Card[], card: Card): Card[][] {
  const need = 15 - card.value;
  if (need < 0) return [];
  if (need === 0) return [[]];
  return findCaptures(table, need);
}

export function hasCapture(table: Card[], card: Card): boolean {
  return capturesFor(table, card).length > 0;
}

export function wouldSweep(table: Card[], picked: Card[]): boolean {
  return picked.length === table.length && table.length > 0;
}
