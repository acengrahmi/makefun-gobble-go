// Gobble & Go — the hazards: fences to hop, hay bales to clear, the oven
// (hot! jump it) and the carving knife that drops from above with a
// shadowed warning. Each hazard knows its box, its danger and how to draw
// itself; this file spawns them, moves them and tests collisions.
import { GROUND_Y, VIEW_W, hazardGapPx, hazardKindsAt } from './config.js';
import { pick, range } from './rng.js';

const SIZES = {
  fence: { w: 46, h: 52 },
  hay: { w: 78, h: 62 },
  oven: { w: 92, h: 96 },
  knife: { w: 34, h: 120 },
  knifepair: { w: 120, h: 120 },
};

export function createHazards(rng) {
  return {
    list: [],
    nextSpawnX: VIEW_W + 240,
    rng,

    reset() {
      this.list = [];
      this.nextSpawnX = VIEW_W + 240;
    },

    // Spawn ahead of the run as the world scrolls.
    update(dt, speed, distanceM, scrollX) {
      for (const hz of this.list) hz.x -= speed * dt;
      this.list = this.list.filter((hz) => hz.x + hz.w > -80);

      this.nextSpawnX -= speed * dt;
      if (this.nextSpawnX <= VIEW_W + 120) {
        this.spawn(distanceM, scrollX);
        this.nextSpawnX = VIEW_W + 120 + hazardGapPx(distanceM, this.rng);
      }

      // Falling knives: telegraph, then drop.
      for (const hz of this.list) {
        if (hz.kind === 'knife' || hz.kind === 'knifepair') {
          if (hz.state === 'warn') {
            hz.warnT -= dt;
            if (hz.warnT <= 0) hz.state = 'fall';
          } else if (hz.state === 'fall') {
            hz.dropY += hz.dropV * dt;
            hz.dropV += 5200 * dt;
            if (hz.dropY >= 0) {
              hz.dropY = 0;
              hz.state = 'stuck';
              hz.stuckT = 0.9;
            }
          } else if (hz.state === 'stuck') {
            hz.stuckT -= dt;
          }
        }
      }
    },

    spawn(distanceM, scrollX) {
      const kind = pick(this.rng, hazardKindsAt(distanceM));
      const size = SIZES[kind];
      const base = {
        kind,
        x: VIEW_W + 120,
        w: size.w,
        h: size.h,
        y: GROUND_Y - size.h,
        scored: false,
        id: scrollX,
      };
      if (kind === 'knife' || kind === 'knifepair') {
        base.state = 'warn';
        base.warnT = range(this.rng, 0.55, 0.85);
        base.dropY = -260;
        base.dropV = 0;
        base.blades = kind === 'knifepair' ? 2 : 1;
      }
      // Ovens stand alone: a hay bale right behind one used to be
      // unjumpable in a single flight, so combos stay single hazards.
      this.list.push(base);
    },

    // The box the turkey must not touch. Knives only hurt once dropped.
    boxOf(hz) {
      if (hz.kind === 'knife' || hz.kind === 'knifepair') {
        if (hz.state !== 'fall' && hz.state !== 'stuck') return null;
        const dy = hz.dropY;
        return { x: hz.x + 4, y: hz.y + dy + 10, w: hz.w - 8, h: hz.h - 12 };
      }
      if (hz.kind === 'oven') return { x: hz.x + 6, y: hz.y + 8, w: hz.w - 12, h: hz.h - 8 };
      if (hz.kind === 'hay') return { x: hz.x + 6, y: hz.y + 6, w: hz.w - 12, h: hz.h - 6 };
      return { x: hz.x + 5, y: hz.y + 4, w: hz.w - 10, h: hz.h - 4 };
    },

    // First hazard whose box overlaps the turkey's box, if any.
    hitTest(turkeyBox) {
      for (const hz of this.list) {
        const b = this.boxOf(hz);
        if (!b) continue;
        if (turkeyBox.x < b.x + b.w && turkeyBox.x + turkeyBox.w > b.x &&
            turkeyBox.y < b.y + b.h && turkeyBox.y + turkeyBox.h > b.y) {
          return hz;
        }
      }
      return null;
    },

    // Hazards the turkey has fully passed: near-miss points and a breather.
    passedBy(turkeyX) {
      const passed = [];
      for (const hz of this.list) {
        if (!hz.scored && hz.x + hz.w < turkeyX) {
          hz.scored = true;
          passed.push(hz);
        }
      }
      return passed;
    },
  };
}

// Draw every hazard in the list.
export function drawHazards(ctx, hazards, time) {
  for (const hz of hazards.list) {
    if (hz.kind === 'fence') drawFence(ctx, hz);
    else if (hz.kind === 'hay') drawHay(ctx, hz);
    else if (hz.kind === 'oven') drawOven(ctx, hz, time);
    else drawKnife(ctx, hz, time);
  }
}

function drawFence(ctx, hz) {
  ctx.fillStyle = '#7c4a21';
  // Two posts and two rails, with a "NO TURKEYS" sign for comic effect.
  ctx.fillRect(hz.x, hz.y, 8, hz.h);
  ctx.fillRect(hz.x + hz.w - 8, hz.y, 8, hz.h);
  ctx.fillRect(hz.x, hz.y + 10, hz.w, 7);
  ctx.fillRect(hz.x, hz.y + 30, hz.w, 7);
  ctx.fillStyle = '#f5e6c8';
  ctx.fillRect(hz.x + 8, hz.y - 16, 30, 14);
  ctx.fillStyle = '#7c2d12';
  ctx.font = 'bold 8px "Trebuchet MS", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('NO', hz.x + 23, hz.y - 6);
}

function drawHay(ctx, hz) {
  // A round golden bale with a spiral of straw.
  const cx = hz.x + hz.w / 2;
  const cy = hz.y + hz.h / 2;
  ctx.fillStyle = '#d9a441';
  ctx.beginPath();
  ctx.ellipse(cx, cy, hz.w / 2, hz.h / 2, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#b45309';
  ctx.lineWidth = 3;
  ctx.beginPath();
  for (let a = 0; a < Math.PI * 4; a += 0.4) {
    const r = 4 + a * 3.4;
    const px = cx + Math.cos(a) * r * 1.25;
    const py = cy + Math.sin(a) * r;
    if (a === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.stroke();
  ctx.strokeStyle = '#92400e';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(cx, cy, hz.w / 2, hz.h / 2, 0, 0, Math.PI * 2);
  ctx.stroke();
}

function drawOven(ctx, hz, time) {
  // The kitchen oven, sitting in the middle of the farmyard where it has
  // no business being — door glowing, flames licking, dials set to ROAST.
  const flick = Math.sin(time * 11 + hz.x) * 3;
  ctx.fillStyle = '#1f2937';
  ctx.beginPath();
  ctx.roundRect(hz.x, hz.y, hz.w, hz.h, 8);
  ctx.fill();
  ctx.fillStyle = '#374151';
  ctx.fillRect(hz.x + 6, hz.y + 6, hz.w - 12, 16);
  // Dials.
  ctx.fillStyle = '#f59e0b';
  for (let i = 0; i < 3; i += 1) {
    ctx.beginPath();
    ctx.arc(hz.x + 22 + i * 24, hz.y + 14, 4, 0, Math.PI * 2);
    ctx.fill();
  }
  // Glowing door with a little turkey silhouette inside (menacing!).
  ctx.fillStyle = '#7c2d12';
  ctx.beginPath();
  ctx.roundRect(hz.x + 12, hz.y + 30, hz.w - 24, 46, 4);
  ctx.fill();
  const glow = ctx.createLinearGradient(0, hz.y + 30, 0, hz.y + 76);
  glow.addColorStop(0, '#f97316');
  glow.addColorStop(1, '#dc2626');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.roundRect(hz.x + 18, hz.y + 36, hz.w - 36, 34, 3);
  ctx.fill();
  ctx.fillStyle = '#451a03';
  ctx.beginPath();
  ctx.arc(hz.x + hz.w / 2, hz.y + 52, 7, 0, Math.PI * 2);
  ctx.fill();
  // Flames on top.
  for (let i = 0; i < 3; i += 1) {
    const fx = hz.x + 20 + i * 26;
    const fh = 16 + Math.sin(time * 9 + i * 2) * 4 + flick * 0.4;
    ctx.fillStyle = i === 1 ? '#f97316' : '#fbbf24';
    ctx.beginPath();
    ctx.moveTo(fx - 8, hz.y);
    ctx.quadraticCurveTo(fx, hz.y - fh, fx + 8, hz.y);
    ctx.closePath();
    ctx.fill();
  }
  // "HOT" warning.
  ctx.fillStyle = '#fca5a5';
  ctx.font = 'bold 11px "Trebuchet MS", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('HOT!', hz.x + hz.w / 2, hz.y + hz.h - 6);
}

function drawKnife(ctx, hz, time) {
  // Warning shadow first, then the blade drops and sticks in the ground.
  if (hz.state === 'warn') {
    const pulse = 0.35 + Math.sin(time * 14) * 0.15;
    ctx.fillStyle = `rgba(220, 38, 38, ${pulse})`;
    ctx.beginPath();
    ctx.ellipse(hz.x + hz.w / 2, GROUND_Y + 4, hz.w / 2, 6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = `rgba(220, 38, 38, ${0.8})`;
    ctx.font = 'bold 16px "Trebuchet MS", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('!', hz.x + hz.w / 2, hz.y - 8);
    return;
  }
  const blades = hz.blades;
  for (let i = 0; i < blades; i += 1) {
    const bx = hz.x + (blades === 2 ? i * 62 + 8 : 4);
    const by = hz.y + hz.dropY;
    // Blade.
    const steel = ctx.createLinearGradient(bx, by, bx + 26, by);
    steel.addColorStop(0, '#e2e8f0');
    steel.addColorStop(0.5, '#94a3b8');
    steel.addColorStop(1, '#e2e8f0');
    ctx.fillStyle = steel;
    ctx.beginPath();
    ctx.moveTo(bx, by + 20);
    ctx.lineTo(bx + 26, by + 34);
    ctx.lineTo(bx + 26, by + 108);
    ctx.lineTo(bx + 6, by + 118);
    ctx.closePath();
    ctx.fill();
    // Handle.
    ctx.fillStyle = '#451a03';
    ctx.beginPath();
    ctx.roundRect(bx + 2, by, 22, 26, 5);
    ctx.fill();
    // Impact dust.
    if (hz.state === 'stuck') {
      ctx.fillStyle = 'rgba(214, 182, 140, 0.7)';
      ctx.beginPath();
      ctx.ellipse(bx + 13, GROUND_Y + 2, 16, 4, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}
