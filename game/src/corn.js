// Gobble & Go — corn: the turkey's fuel. Regular cobs are worth points; a
// golden cob (rare) restores a lost life. Corn hangs in little arcs over
// the hazards, so grabbing it means committing to the jump.
import { GROUND_Y, VIEW_W, CORN_ARC_CHANCE, GOLDEN_CORN_CHANCE } from './config.js';
import { chance } from './rng.js';

export function createCorn(rng) {
  return {
    list: [],
    rng,

    reset() {
      this.list = [];
    },

    update(dt, speed) {
      for (const c of this.list) c.x -= speed * dt;
      this.list = this.list.filter((c) => c.x > -40);
    },

    // Lay an arc of cobs above a hazard, sometimes golden.
    spawnArc(x, baseY) {
      if (!chance(this.rng, CORN_ARC_CHANCE)) return;
      const golden = chance(this.rng, GOLDEN_CORN_CHANCE);
      const n = golden ? 1 : 4;
      for (let i = 0; i < n; i += 1) {
        const arcY = baseY - Math.sin((i / (n - 1 || 1)) * Math.PI) * 46 - 30;
        this.list.push({
          x: x + i * 34 - (n - 1) * 17,
          y: golden ? baseY - 70 : arcY,
          golden,
          bob: this.rng() * Math.PI * 2,
          taken: false,
        });
      }
    },

    collect(turkeyBox) {
      const got = [];
      for (const c of this.list) {
        if (c.taken) continue;
        if (turkeyBox.x < c.x + 16 && turkeyBox.x + turkeyBox.w > c.x - 16 &&
            turkeyBox.y < c.y + 18 && turkeyBox.y + turkeyBox.h > c.y - 18) {
          c.taken = true;
          got.push(c);
        }
      }
      this.list = this.list.filter((c) => !c.taken);
      return got;
    },
  };
}

// Draw a cob: yellow kernels in rows, green husk leaves, golden ones glow.
export function drawCorn(ctx, corn, time) {
  for (const c of corn.list) {
    const bobY = Math.sin(time * 3 + c.bob) * 3;
    const y = c.y + bobY;
    ctx.save();
    ctx.translate(c.x, y);
    if (c.golden) {
      const glow = ctx.createRadialGradient(0, 0, 2, 0, 0, 30);
      glow.addColorStop(0, 'rgba(251, 191, 36, 0.5)');
      glow.addColorStop(1, 'rgba(251, 191, 36, 0)');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(0, 0, 30, 0, Math.PI * 2);
      ctx.fill();
    }
    // Husk leaves.
    ctx.fillStyle = '#16a34a';
    ctx.beginPath();
    ctx.moveTo(-12, 6);
    ctx.quadraticCurveTo(-20, 16, -8, 14);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(12, 6);
    ctx.quadraticCurveTo(20, 16, 8, 14);
    ctx.closePath();
    ctx.fill();
    // The cob.
    ctx.fillStyle = c.golden ? '#fbbf24' : '#facc15';
    ctx.beginPath();
    ctx.ellipse(0, -4, 10, 16, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = c.golden ? '#f59e0b' : '#eab308';
    for (let row = -1; row <= 1; row += 1) {
      for (let col = -1; col <= 1; col += 1) {
        ctx.beginPath();
        ctx.arc(col * 5, -4 + row * 8, 2.4, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();
  }
}
