// Gobble & Go — the world: a farmyard that scrolls past in parallax layers
// (clouds, barn, fences, corn, trees) while the sky slides from bright
// Thanksgiving morning to purple dusk as the run goes on. The world also
// owns the stage banners and the floating "pop" texts.
import { GROUND_Y, VIEW_H, VIEW_W, duskFactor } from './config.js';

// Morning -> dusk colour stops, lerped by distance.
const SKY_STOPS = [
  { t: 0.0, top: '#7ec8f7', mid: '#cfeefb', low: '#ffe9a8' },
  { t: 0.5, top: '#8fb8e8', mid: '#f6c98a', low: '#f9a26b' },
  { t: 0.8, top: '#5b5f9e', mid: '#e07a5f', low: '#f2a65a' },
  { t: 1.0, top: '#2e2a5e', mid: '#7c4a7d', low: '#e07a5f' },
];

function lerpColor(a, b, t) {
  const pa = [1, 3, 5].map((i) => Number.parseInt(a.slice(i, i + 2), 16));
  const pb = [1, 3, 5].map((i) => Number.parseInt(b.slice(i, i + 2), 16));
  const mixed = pa.map((v, i) => Math.round(v + (pb[i] - v) * t));
  return `rgb(${mixed[0]}, ${mixed[1]}, ${mixed[2]})`;
}

function skyAt(dusk) {
  let i = 0;
  while (i < SKY_STOPS.length - 2 && dusk > SKY_STOPS[i + 1].t) i += 1;
  const a = SKY_STOPS[i];
  const b = SKY_STOPS[i + 1];
  const t = Math.min(1, Math.max(0, (dusk - a.t) / (b.t - a.t)));
  return {
    top: lerpColor(a.top, b.top, t),
    mid: lerpColor(a.mid, b.mid, t),
    low: lerpColor(a.low, b.low, t),
  };
}

export function createWorld(rng) {
  return {
    rng,
    scrollX: 0,
    clouds: [],
    birds: [],
    popups: [],
    stageBanner: null,
    stageBannerT: 0,

    reset() {
      this.scrollX = 0;
      this.popups = [];
      this.stageBanner = null;
      this.stageBannerT = 0;
      this.clouds = [];
      for (let i = 0; i < 7; i += 1) {
        this.clouds.push({
          x: this.rng() * VIEW_W,
          // Below the HUD band (y < 76) so the top bar stays clean.
          y: 92 + this.rng() * 100,
          s: 0.6 + this.rng() * 0.9,
          speed: 6 + this.rng() * 10,
        });
      }
      this.birds = [];
      for (let i = 0; i < 4; i += 1) {
        this.birds.push({ x: this.rng() * VIEW_W, y: 60 + this.rng() * 90, phase: this.rng() * 6 });
      }
    },

    update(dt, speed, distanceM, stageName) {
      this.scrollX += speed * dt;
      for (const c of this.clouds) {
        c.x -= c.speed * dt;
        if (c.x < -90) {
          c.x = VIEW_W + 60;
          c.y = 92 + this.rng() * 100;
        }
      }
      for (const b of this.birds) {
        b.x -= (speed * 0.55 + 14) * dt;
        b.phase += dt * 6;
        if (b.x < -30) {
          b.x = VIEW_W + 40;
          b.y = 50 + this.rng() * 120;
        }
      }
      for (const p of this.popups) {
        p.y -= 34 * dt;
        p.life -= dt;
      }
      this.popups = this.popups.filter((p) => p.life > 0);
      if (stageName !== this.stageBanner) {
        this.stageBanner = stageName;
        this.stageBannerT = 2.2;
      }
      if (this.stageBannerT > 0) this.stageBannerT -= dt;
    },

    popup(x, y, text, color = '#fff7d6') {
      this.popups.push({ x, y, text, color, life: 1.1 });
    },

    drawSky(ctx, distanceM, time) {
      const dusk = duskFactor(distanceM);
      const sky = skyAt(dusk);
      const grad = ctx.createLinearGradient(0, 0, 0, GROUND_Y);
      grad.addColorStop(0, sky.top);
      grad.addColorStop(0.55, sky.mid);
      grad.addColorStop(1, sky.low);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, VIEW_W, GROUND_Y + 2);

      // The sun sinks as dusk falls.
      const sunX = VIEW_W - 150 - dusk * 60;
      const sunY = 66 + dusk * 210;
      const sunGlow = ctx.createRadialGradient(sunX, sunY, 4, sunX, sunY, 90);
      sunGlow.addColorStop(0, 'rgba(255, 236, 170, 0.95)');
      sunGlow.addColorStop(0.35, 'rgba(255, 196, 90, 0.55)');
      sunGlow.addColorStop(1, 'rgba(255, 196, 90, 0)');
      ctx.fillStyle = sunGlow;
      ctx.beginPath();
      ctx.arc(sunX, sunY, 90, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = dusk > 0.75 ? '#fde68a' : '#fff3c4';
      ctx.beginPath();
      ctx.arc(sunX, sunY, 26, 0, Math.PI * 2);
      ctx.fill();

      // Stars creep in at dusk.
      if (dusk > 0.6) {
        ctx.fillStyle = `rgba(255, 255, 255, ${(dusk - 0.6) * 2.2})`;
        for (let i = 0; i < 26; i += 1) {
          const sx = (i * 173.3) % VIEW_W;
          const sy = ((i * 97.7) % 150) + 12;
          const tw = 1 + Math.sin(time * 2 + i) * 0.6;
          ctx.fillRect(sx, sy, tw, tw);
        }
      }

      // Clouds drift by.
      for (const c of this.clouds) {
        ctx.fillStyle = dusk > 0.6 ? 'rgba(226, 214, 240, 0.5)' : 'rgba(255, 255, 255, 0.85)';
        ctx.beginPath();
        ctx.ellipse(c.x, c.y, 34 * c.s, 14 * c.s, 0, 0, Math.PI * 2);
        ctx.ellipse(c.x + 22 * c.s, c.y + 4, 24 * c.s, 11 * c.s, 0, 0, Math.PI * 2);
        ctx.ellipse(c.x - 24 * c.s, c.y + 5, 20 * c.s, 10 * c.s, 0, 0, Math.PI * 2);
        ctx.fill();
      }

      // Birds, fleeing with the turkey.
      ctx.strokeStyle = dusk > 0.6 ? 'rgba(30, 27, 60, 0.8)' : 'rgba(60, 60, 70, 0.8)';
      ctx.lineWidth = 2;
      for (const b of this.birds) {
        const flap = Math.sin(b.phase) * 4;
        ctx.beginPath();
        ctx.moveTo(b.x - 8, b.y);
        ctx.quadraticCurveTo(b.x - 3, b.y - 4 - flap, b.x, b.y);
        ctx.quadraticCurveTo(b.x + 3, b.y - 4 - flap, b.x + 8, b.y);
        ctx.stroke();
      }
    },

    // The ground and the parallax scenery: barn, fences, corn stalks,
    // trees — each layer scrolling at its own speed.
    drawGround(ctx, distanceM) {
      const dusk = duskFactor(distanceM);
      // Dirt track.
      const dirt = ctx.createLinearGradient(0, GROUND_Y, 0, VIEW_H);
      dirt.addColorStop(0, dusk > 0.6 ? '#7a5a3a' : '#c89b62');
      dirt.addColorStop(1, dusk > 0.6 ? '#4a3520' : '#a97c46');
      ctx.fillStyle = dirt;
      ctx.fillRect(0, GROUND_Y, VIEW_W, VIEW_H - GROUND_Y);
      // Grass fringe.
      ctx.fillStyle = dusk > 0.6 ? '#4a6b2f' : '#6da344';
      ctx.fillRect(0, GROUND_Y, VIEW_W, 8);
      // Pebbles and tufts rushing past.
      ctx.fillStyle = 'rgba(90, 60, 30, 0.5)';
      for (let i = 0; i < 14; i += 1) {
        const px = VIEW_W - ((this.scrollX * 1.0 + i * 173) % (VIEW_W + 80)) + 40;
        ctx.fillRect(px, GROUND_Y + 22 + ((i * 37) % 44), 5, 3);
      }
      ctx.strokeStyle = dusk > 0.6 ? '#3f5c2a' : '#5a8f38';
      ctx.lineWidth = 2;
      for (let i = 0; i < 10; i += 1) {
        const px = VIEW_W - ((this.scrollX * 1.0 + i * 211) % (VIEW_W + 60)) + 30;
        ctx.beginPath();
        ctx.moveTo(px, GROUND_Y + 2);
        ctx.lineTo(px - 3, GROUND_Y - 5);
        ctx.moveTo(px + 4, GROUND_Y + 2);
        ctx.lineTo(px + 7, GROUND_Y - 4);
        ctx.stroke();
      }
    },

    drawScenery(ctx, distanceM) {
      const dusk = duskFactor(distanceM);
      const dark = dusk > 0.6;
      // The red barn, far away, slow parallax.
      const barnX = 720 - ((this.scrollX * 0.12) % 1400);
      this.drawBarn(ctx, barnX, GROUND_Y, dark);
      // Fence line, mid parallax.
      ctx.strokeStyle = dark ? '#5b3a24' : '#8a5a2b';
      ctx.fillStyle = dark ? '#5b3a24' : '#8a5a2b';
      for (let i = 0; i < 9; i += 1) {
        const fx = VIEW_W - ((this.scrollX * 0.45 + i * 130) % (VIEW_W + 130)) + 65;
        ctx.fillRect(fx, GROUND_Y - 34, 6, 34);
        ctx.fillRect(fx, GROUND_Y - 26, 130, 4);
        ctx.fillRect(fx, GROUND_Y - 14, 130, 4);
      }
      // Corn stalks in the cornfield stretch, trees in the woods.
      if (distanceM >= 500 && distanceM < 1000) {
        for (let i = 0; i < 8; i += 1) {
          const sx = VIEW_W - ((this.scrollX * 0.7 + i * 149) % (VIEW_W + 150)) + 75;
          this.drawCornStalk(ctx, sx, GROUND_Y, dark);
        }
      }
      if (distanceM >= 1000) {
        for (let i = 0; i < 6; i += 1) {
          const tx = VIEW_W - ((this.scrollX * 0.6 + i * 191) % (VIEW_W + 190)) + 95;
          this.drawPine(ctx, tx, GROUND_Y, dark);
        }
      }
      // Pumpkins by the track, all the way.
      for (let i = 0; i < 4; i += 1) {
        const px = VIEW_W - ((this.scrollX * 0.9 + i * 337) % (VIEW_W + 340)) + 170;
        ctx.fillStyle = dark ? '#b45309' : '#ea580c';
        ctx.beginPath();
        ctx.ellipse(px, GROUND_Y - 8, 14, 10, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#7c2d12';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.ellipse(px, GROUND_Y - 8, 7, 10, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.strokeStyle = '#16a34a';
        ctx.beginPath();
        ctx.moveTo(px, GROUND_Y - 17);
        ctx.quadraticCurveTo(px + 3, GROUND_Y - 24, px + 8, GROUND_Y - 22);
        ctx.stroke();
      }
    },

    drawBarn(ctx, x, ground, dark) {
      const wall = dark ? '#7f2d2d' : '#b91c1c';
      const roof = dark ? '#4a2c2a' : '#7f1d1d';
      ctx.fillStyle = wall;
      ctx.fillRect(x, ground - 130, 190, 130);
      ctx.fillStyle = roof;
      ctx.beginPath();
      ctx.moveTo(x - 12, ground - 128);
      ctx.lineTo(x + 95, ground - 185);
      ctx.lineTo(x + 202, ground - 128);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = dark ? '#3f2a22' : '#7c2d12';
      ctx.fillRect(x + 70, ground - 84, 50, 84);
      ctx.strokeStyle = dark ? '#5b3a24' : '#f5e6c8';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(x + 70, ground - 84);
      ctx.lineTo(x + 120, ground);
      ctx.moveTo(x + 120, ground - 84);
      ctx.lineTo(x + 70, ground);
      ctx.stroke();
      ctx.fillStyle = '#fde68a';
      ctx.fillRect(x + 22, ground - 108, 26, 22);
      ctx.fillRect(x + 142, ground - 108, 26, 22);
    },

    drawCornStalk(ctx, x, ground, dark) {
      ctx.strokeStyle = dark ? '#3f5c2a' : '#4d7c0f';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(x, ground);
      ctx.lineTo(x, ground - 86);
      ctx.stroke();
      ctx.fillStyle = dark ? '#3f5c2a' : '#65a30d';
      for (const [dx, dy, rot] of [[-12, -60, -0.5], [12, -70, 0.5], [-10, -40, -0.7]]) {
        ctx.save();
        ctx.translate(x + dx, ground + dy);
        ctx.rotate(rot);
        ctx.beginPath();
        ctx.ellipse(0, 0, 6, 20, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
      ctx.fillStyle = '#facc15';
      ctx.beginPath();
      ctx.ellipse(x + 8, ground - 52, 5, 12, 0.3, 0, Math.PI * 2);
      ctx.fill();
    },

    drawPine(ctx, x, ground, dark) {
      ctx.fillStyle = dark ? '#1e3d24' : '#166534';
      for (let i = 0; i < 3; i += 1) {
        const w = 52 - i * 12;
        const y = ground - 40 - i * 34;
        ctx.beginPath();
        ctx.moveTo(x - w / 2, y);
        ctx.lineTo(x, y - 44);
        ctx.lineTo(x + w / 2, y);
        ctx.closePath();
        ctx.fill();
      }
      ctx.fillStyle = '#5b3a1a';
      ctx.fillRect(x - 5, ground - 14, 10, 14);
    },

    // Floating score popups and the stage banner.
    drawPopups(ctx) {
      ctx.textAlign = 'center';
      for (const p of this.popups) {
        ctx.globalAlpha = Math.min(1, p.life);
        ctx.font = 'bold 20px "Trebuchet MS", sans-serif';
        ctx.fillStyle = p.color;
        ctx.strokeStyle = 'rgba(0,0,0,0.45)';
        ctx.lineWidth = 3;
        ctx.strokeText(p.text, p.x, p.y);
        ctx.fillText(p.text, p.x, p.y);
        ctx.globalAlpha = 1;
      }
      if (this.stageBannerT > 0 && this.stageBanner) {
        const a = Math.min(1, this.stageBannerT);
        ctx.globalAlpha = a;
        ctx.font = 'bold 34px "Trebuchet MS", sans-serif';
        ctx.fillStyle = '#fff7d6';
        ctx.strokeStyle = 'rgba(0,0,0,0.5)';
        ctx.lineWidth = 5;
        ctx.strokeText(this.stageBanner, VIEW_W / 2, 150);
        ctx.fillText(this.stageBanner, VIEW_W / 2, 150);
        ctx.globalAlpha = 1;
      }
    },
  };
}
