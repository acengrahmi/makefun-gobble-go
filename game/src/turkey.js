// Gobble & Go — Gus the turkey: the player. Runs, jumps (twice), slides,
// and gets knocked about. Physics live here; the drawing lives below.
import {
  GRAVITY,
  GROUND_Y,
  JUMP_VELOCITY,
  DOUBLE_JUMP_VELOCITY,
  SLIDE_TIME,
  TURKEY_H,
  TURKEY_W,
  TURKEY_X,
} from './config.js';

export function createTurkey() {
  return {
    x: TURKEY_X,
    y: GROUND_Y - TURKEY_H,
    w: TURKEY_W,
    h: TURKEY_H,
    vy: 0,
    jumps: 0,
    sliding: 0,
    runPhase: 0,
    invincible: 0,
    squish: 0,
    // The collision box shrinks while sliding low.
    get box() {
      if (this.sliding > 0) return { x: this.x + 4, y: this.y + 26, w: this.w - 6, h: this.h - 26 };
      return { x: this.x + 8, y: this.y + 4, w: this.w - 16, h: this.h - 6 };
    },
    get onGround() {
      return this.y >= GROUND_Y - TURKEY_H;
    },

    jump() {
      if (this.onGround) {
        this.vy = -JUMP_VELOCITY;
        this.jumps = 1;
        this.sliding = 0;
        return 'jump';
      }
      if (this.jumps < 2) {
        this.vy = -DOUBLE_JUMP_VELOCITY;
        this.jumps = 2;
        return 'double';
      }
      return null;
    },

    slide() {
      if (this.onGround && this.sliding <= 0) {
        this.sliding = SLIDE_TIME;
        return true;
      }
      return false;
    },

    hurt() {
      this.invincible = 1.4;
      this.squish = 0.35;
    },

    update(dt, speed) {
      this.vy += GRAVITY * dt;
      this.y += this.vy * dt;
      if (this.y >= GROUND_Y - TURKEY_H) {
        this.y = GROUND_Y - TURKEY_H;
        this.vy = 0;
        this.jumps = 0;
      }
      if (this.sliding > 0) this.sliding -= dt;
      if (this.invincible > 0) this.invincible -= dt;
      if (this.squish > 0) this.squish -= dt;
      this.runPhase += dt * (speed / 28);
    },
  };
}

// Draw Gus: a plump brown turkey with a fanned tail, red wattle, orange
// beak, and legs that pump as he runs. Everything is canvas paths.
export function drawTurkey(ctx, turkey, time) {
  const { x, y, w, h } = turkey;
  const cx = x + w / 2;
  const cy = y + h / 2;
  const legSwing = Math.sin(turkey.runPhase) * (turkey.onGround ? 9 : 2);
  const airTilt = turkey.onGround ? 0 : -0.12;
  const sliding = turkey.sliding > 0;
  const squash = turkey.squish > 0 ? 1 - turkey.squish * 0.35 : 1;
  const blink = turkey.invincible > 0 && Math.floor(time * 14) % 2 === 0;

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(airTilt);
  ctx.scale(1, squash);
  if (blink) ctx.globalAlpha = 0.35;

  if (sliding) {
    // Low slide: body flattened, tail up behind, beak first.
    ctx.rotate(0.5);
    drawTurkeyBody(ctx, -6, 6, 0.9);
    drawTurkeyHead(ctx, 26, -8, 0.9);
    drawTurkeyTail(ctx, -34, 0, 0.85, time);
  } else {
    drawTurkeyTail(ctx, -w / 2 + 2, -4, 1, time);
    // Legs, pumping.
    ctx.strokeStyle = '#e8912d';
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-4, 16);
    ctx.lineTo(-4 + legSwing, 30);
    ctx.moveTo(6, 16);
    ctx.lineTo(6 - legSwing, 30);
    ctx.stroke();
    drawTurkeyBody(ctx, 0, 0, 1);
    drawTurkeyHead(ctx, 20, -20, 1);
    // Wing, flapping a little.
    const flap = Math.sin(turkey.runPhase * 1.7) * 3;
    ctx.fillStyle = '#8a5a2b';
    ctx.beginPath();
    ctx.ellipse(-2, 2 + flap * 0.3, 16, 10, -0.5 + flap * 0.02, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawTurkeyBody(ctx, ox, oy, s) {
  ctx.fillStyle = '#a06835';
  ctx.beginPath();
  ctx.ellipse(ox, oy, 24 * s, 20 * s, 0, 0, Math.PI * 2);
  ctx.fill();
  // Breast feathers: scalloped lighter arcs.
  ctx.fillStyle = '#c98d4e';
  for (let i = 0; i < 3; i += 1) {
    ctx.beginPath();
    ctx.ellipse(ox - 6 + i * 7, oy + 10 * s, 7 * s, 5 * s, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawTurkeyHead(ctx, ox, oy, s) {
  // Neck and head.
  ctx.fillStyle = '#d9a066';
  ctx.beginPath();
  ctx.ellipse(ox - 4, oy + 8, 7 * s, 10 * s, 0.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#e8b98a';
  ctx.beginPath();
  ctx.arc(ox, oy, 10 * s, 0, Math.PI * 2);
  ctx.fill();
  // Beak.
  ctx.fillStyle = '#f59e0b';
  ctx.beginPath();
  ctx.moveTo(ox + 8, oy - 2);
  ctx.lineTo(ox + 20, oy + 2);
  ctx.lineTo(ox + 8, oy + 6);
  ctx.closePath();
  ctx.fill();
  // Wattle: the red dangly bit that says "turkey".
  ctx.fillStyle = '#dc2626';
  ctx.beginPath();
  ctx.ellipse(ox + 9, oy + 8, 3.5 * s, 6 * s, 0.3, 0, Math.PI * 2);
  ctx.fill();
  // Eye.
  ctx.fillStyle = '#1f2937';
  ctx.beginPath();
  ctx.arc(ox + 3, oy - 3, 2.2 * s, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(ox + 4, oy - 4, 0.8 * s, 0, Math.PI * 2);
  ctx.fill();
}

function drawTurkeyTail(ctx, ox, oy, s, time) {
  // The fan: five feathers, each a rounded petal with a darker eye.
  const sway = Math.sin(time * 3) * 0.04;
  ctx.save();
  ctx.translate(ox, oy);
  ctx.rotate(sway);
  for (let i = -2; i <= 2; i += 1) {
    const angle = -Math.PI / 2 + i * 0.42;
    ctx.save();
    ctx.rotate(angle + Math.PI / 2);
    ctx.fillStyle = i % 2 === 0 ? '#8a5a2b' : '#a06835';
    ctx.beginPath();
    ctx.ellipse(0, -20 * s, 7 * s, 20 * s, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#5b3a1a';
    ctx.beginPath();
    ctx.ellipse(0, -32 * s, 4 * s, 7 * s, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  ctx.restore();
}
