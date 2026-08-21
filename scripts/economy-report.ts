/** Reporte de balance: `bun scripts/economy-report.ts`. */
import { ECONOMY_PROFILES, simulateEconomy, cupExpectedValue } from "../src/lib/economy-balance";

for (const p of ECONOMY_PROFILES) {
  const r = simulateEconomy(p, 30);
  console.log(
    `${p.nombre.padEnd(12)} EV torneo ${String(Math.round(cupExpectedValue(p.winRate))).padStart(6)}  ` +
      `neto/día ${String(Math.round(r.netoDiario)).padStart(6)}  saldo 30d ${String(Math.round(r.saldoFinal)).padStart(7)}`,
  );
}
