import {
  BALL_R,
  FLIPPER_HALF_THICK,
  FLIPPER_LEN,
  FLIPPER_REST,
  FLIPPER_SPEED,
  FLIPPER_UP,
  MAGNET,
  closestOnSeg,
} from "./engine";

export interface Ball {
  x: number;
  y: number;
  vx: number;
  vy: number;
  live: boolean;
}

export interface Flipper {
  active: boolean;
  angle: number;
}

/** Ease a flipper's angle toward its target (up/rest) at FLIPPER_SPEED. */
export function stepFlipperAngle(flipper: Flipper, dt: number): void {
  const target = flipper.active ? FLIPPER_UP : FLIPPER_REST;
  const delta = target - flipper.angle;
  flipper.angle += Math.sign(delta) * Math.min(Math.abs(delta), FLIPPER_SPEED * dt);
}

export function applyGravityAndDrag(ball: Ball, gravity: number, dt: number): void {
  ball.vy += gravity * dt;
  ball.vx *= Math.pow(0.998, dt * 60);
  ball.vy *= Math.pow(0.9995, dt * 60);
}

export function applyMagnetForce(ball: Ball, freqMul: number, dt: number): void {
  const dx = MAGNET.x - ball.x;
  const dy = MAGNET.y - ball.y;
  const d = Math.hypot(dx, dy);
  if (d < MAGNET.pullR && d > 0.1) {
    const fall = 1 - d / MAGNET.pullR;
    const force = MAGNET.pullForce * fall * freqMul;
    ball.vx += (dx / d) * force * dt;
    ball.vy += (dy / d) * force * dt;
  }
}

export function applyShooterLane(ball: Ball, dt: number): boolean {
  const inLane = ball.x > 84 && ball.y > 30;
  // Rescate: si la bola se queda muerta en el fondo del carril, el émbolo
  // la vuelve a empujar en vez de dejarla drenar o quedarse quieta.
  if (inLane && ball.vy >= 0 && ball.y > 138) {
    ball.vy -= 340 * dt;
  }
  // Compuerta antirretorno: si la bola vuelve a caer por la boca del carril,
  // se la desvía al campo en vez de dejar que baje y se drene por el canal.
  if (ball.x > 84 && ball.y > 22 && ball.y < 50 && ball.vy > 0) {
    ball.vx -= 300 * dt;
    if (ball.vy > 40) ball.vy = 40;
  }
  const inShooterLane = inLane && ball.vy < 0;
  if (inShooterLane) {
    ball.vx += (-10 - ball.vx) * Math.min(1, dt * 6);
    if (ball.vy > -92) ball.vy = -92;
  }
  if (ball.x > 84 && ball.y <= 30 && ball.vy < 0) {
    const sweep = -46 - Math.random() * 26;
    ball.vx += (sweep - ball.vx) * Math.min(1, dt * 9);
    if (ball.vy > -96) ball.vy = -96;
  }
  return inShooterLane;
}

export function clampSpeed(ball: Ball, max: number): void {
  const speed = Math.hypot(ball.vx, ball.vy);
  if (speed > max) {
    ball.vx *= max / speed;
    ball.vy *= max / speed;
  }
}

export function collideFlipper(
  ball: Ball,
  pivot: { x: number; y: number },
  flipper: Flipper,
  isLeft: boolean,
): void {
  const angle = isLeft ? flipper.angle : Math.PI - flipper.angle;
  const tipX = pivot.x + Math.cos(angle) * FLIPPER_LEN;
  const tipY = pivot.y + Math.sin(angle) * FLIPPER_LEN;
  const point = closestOnSeg(ball.x, ball.y, pivot.x, pivot.y, tipX, tipY);
  const dx = ball.x - point.x;
  const dy = ball.y - point.y;
  const distance = Math.hypot(dx, dy);
  const min = BALL_R + FLIPPER_HALF_THICK;
  if (distance >= min || distance <= 1e-4) return;

  const nx = dx / distance;
  const ny = dy / distance;
  ball.x = point.x + nx * min;
  ball.y = point.y + ny * min;

  const vn = ball.vx * nx + ball.vy * ny;
  if (vn < 0) {
    ball.vx -= 1.3 * vn * nx;
    ball.vy -= 1.3 * vn * ny;
  }

  if (flipper.active) {
    const along = Math.hypot(point.x - pivot.x, point.y - pivot.y) / FLIPPER_LEN;
    ball.vx += (isLeft ? 1 : -1) * (12 + along * 18);
    ball.vy -= 36 + along * 28;
    if (ball.vy > -26) ball.vy = -26;
  }
}

export function decayNumericMap(map: Record<number, number>, dt: number): void {
  for (const key of Object.keys(map)) {
    const k = Number(key);
    map[k] -= dt;
    if (map[k] <= 0) delete map[k];
  }
}

export interface Spark {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  max: number;
  gold: boolean;
}

export function stepSparks(sparks: Spark[], dt: number): void {
  for (let i = sparks.length - 1; i >= 0; i -= 1) {
    const s = sparks[i];
    s.life -= dt;
    if (s.life <= 0) {
      sparks.splice(i, 1);
      continue;
    }
    s.vy += 110 * dt;
    s.vx *= Math.pow(0.94, dt * 60);
    s.x += s.vx * dt;
    s.y += s.vy * dt;
  }
}

export function stepTrail(trail: { x: number; y: number; life: number }[], dt: number): void {
  for (let i = trail.length - 1; i >= 0; i -= 1) {
    trail[i].life -= dt;
    if (trail[i].life <= 0) trail.splice(i, 1);
  }
}
