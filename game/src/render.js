// Gobble & Go — the screens: title, caught, escaped, plus the little
// full-screen effects (the red flash when spotted, the vignette that
// deepens at dusk). The game world is drawn by world.js / turkey.js /
// farmer.js / hazards.js / corn.js; this file owns everything that is not
// the run itself.
import { ESCAPE_DISTANCE_M, VIEW_H, VIEW_W } from './config.js';
import { drawFarmer } from './farmer.js';
import { drawTurkey } from './turkey.js';

export function drawTitle(ctx, game, time) {
  const { world, turkey, farmer } = game;
  world.drawSky(ctx, 40, time);
  world.drawScenery(ctx, 40);
  world.drawGround(ctx, 40);

  // The stars of the show, posed on the title screen.
  const pose = { ...turkey, x: 300, y: 468 - 58, runPhase: Math.sin(time * 2) * 0.4 };
  drawTurkey(ctx, pose, time);
  const farmerPose = { ...farmer, x: 130, gap: 320, close: false, lantern: false, runPhase: Math.sin(time * 2) * 0.4 };
  drawFarmer(ctx, farmerPose, time);

  // Title block.
  ctx.textAlign = 'center';
  ctx.fillStyle = 'rgba(20, 12, 8, 0.5)';
  ctx.beginPath();
  ctx.roundRect(180, 52, VIEW_W - 360, 150, 18);
  ctx.fill();
  ctx.fillStyle = '#fbbf24';
  ctx.font = 'bold 64px "Trebuchet MS", sans-serif';
  ctx.strokeStyle = 'rgba(69, 26, 3, 0.9)';
  ctx.lineWidth = 8;
  ctx.strokeText('GOBBLE & GO!', VIEW_W / 2, 118);
  ctx.fillText('GOBBLE & GO!', VIEW_W / 2, 118);
  ctx.fillStyle = '#fff7d6';
  ctx.font = 'bold 22px "Trebuchet MS", sans-serif';
  ctx.fillText("Turkey's Great Thanksgiving Escape", VIEW_W / 2, 152);
  ctx.font = '16px "Trebuchet MS", sans-serif';
  ctx.fillStyle = '#fde68a';
  ctx.fillText('Farmer Bram wants dinner. Gus wants the woods. Run, Gus, run!', VIEW_W / 2, 180);

  // How to play.
  ctx.fillStyle = 'rgba(20, 12, 8, 0.5)';
  ctx.beginPath();
  ctx.roundRect(240, 220, VIEW_W - 480, 124, 14);
  ctx.fill();
  ctx.fillStyle = '#fff7d6';
  ctx.font = 'bold 15px "Trebuchet MS", sans-serif';
  ctx.fillText('HOW TO PLAY', VIEW_W / 2, 244);
  ctx.font = '15px "Trebuchet MS", sans-serif';
  ctx.fillText('SPACE / CLICK / ↑  —  jump (twice for a double jump)', VIEW_W / 2, 268);
  ctx.fillText('↓ / S  —  tuck & roll for a burst of speed', VIEW_W / 2, 290);
  ctx.fillText('Grab corn for points — golden corn restores a life', VIEW_W / 2, 312);
  ctx.font = '13px "Trebuchet MS", sans-serif';
  ctx.fillStyle = 'rgba(255, 247, 214, 0.8)';
  ctx.fillText('M — mute    P — pause', VIEW_W / 2, 332);

  // The pulsing start prompt, above the characters' heads, on a dark pill
  // so it reads over the pale morning sky.
  const pulse = 0.65 + Math.sin(time * 4) * 0.35;
  ctx.globalAlpha = pulse;
  ctx.fillStyle = 'rgba(20, 12, 8, 0.55)';
  ctx.beginPath();
  ctx.roundRect(VIEW_W / 2 - 225, 346, 450, 44, 22);
  ctx.fill();
  ctx.fillStyle = '#fff7d6';
  ctx.font = 'bold 26px "Trebuchet MS", sans-serif';
  ctx.fillText('PRESS SPACE OR CLICK TO RUN', VIEW_W / 2, 378);
  ctx.globalAlpha = 1;

  // These lines live on the dirt, clear of the turkey and the farmer.
  ctx.font = '14px "Trebuchet MS", sans-serif';
  ctx.fillStyle = '#fde68a';
  ctx.fillText(`Escape ${ESCAPE_DISTANCE_M} m to the woods — dodge fences, hay, the oven and the carving knife!`, VIEW_W / 2, 502);
  if (game.best > 0) {
    ctx.fillStyle = '#fff7d6';
    ctx.fillText(`Best escape so far: ${Math.floor(game.best)} m   •   Best score: ${game.bestScore}`, VIEW_W / 2, 524);
  }
}

// The end screens: caught by the farmer, or escaped to the woods.
export function drawEnd(ctx, game, time) {
  const { world, turkey, farmer, result } = game;
  const escaped = result === 'escaped';
  world.drawSky(ctx, escaped ? 1500 : game.distanceM, time);
  world.drawScenery(ctx, escaped ? 1500 : game.distanceM);
  world.drawGround(ctx, escaped ? 1500 : game.distanceM);

  if (escaped) {
    const pose = { ...turkey, x: 300, y: 468 - 58, runPhase: 0 };
    drawTurkey(ctx, pose, time);
    // Fireworks of freedom.
    for (let i = 0; i < 5; i += 1) {
      const fx = 120 + i * 180 + Math.sin(time + i) * 20;
      const fy = 90 + ((i * 53) % 90);
      const hue = ['#fbbf24', '#f472b6', '#34d399', '#60a5fa', '#f87171'][i];
      ctx.fillStyle = hue;
      for (let a = 0; a < 8; a += 1) {
        const ang = (a / 8) * Math.PI * 2 + time * 0.5;
        ctx.beginPath();
        ctx.arc(fx + Math.cos(ang) * 18, fy + Math.sin(ang) * 18, 3, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  } else {
    const farmerPose = { ...farmer, x: 250, gap: 20, close: true, lantern: game.distanceM > 1000, runPhase: 0 };
    drawFarmer(ctx, farmerPose, time);
    const pose = { ...turkey, x: 400, y: 468 - 58, runPhase: 0, squish: 0.4 };
    drawTurkey(ctx, pose, time);
    // The farmer's speech bubble.
    ctx.fillStyle = '#fff7d6';
    ctx.beginPath();
    ctx.roundRect(270, 300, 260, 52, 12);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(300, 352);
    ctx.lineTo(290, 372);
    ctx.lineTo(318, 352);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#7c2d12';
    ctx.font = 'bold 17px "Trebuchet MS", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Gotcha, Gus! Dinner is served!', 400, 324);
    ctx.fillText('...or is it?', 400, 344);
  }

  // Result panel.
  ctx.fillStyle = 'rgba(20, 12, 8, 0.62)';
  ctx.beginPath();
  ctx.roundRect(180, 96, VIEW_W - 360, 190, 18);
  ctx.fill();
  ctx.textAlign = 'center';
  ctx.fillStyle = escaped ? '#34d399' : '#f87171';
  ctx.font = 'bold 56px "Trebuchet MS", sans-serif';
  ctx.strokeStyle = 'rgba(0,0,0,0.6)';
  ctx.lineWidth = 7;
  ctx.strokeText(escaped ? 'ESCAPED!' : 'CAUGHT!', VIEW_W / 2, 158);
  ctx.fillText(escaped ? 'ESCAPED!' : 'CAUGHT!', VIEW_W / 2, 158);
  ctx.fillStyle = '#fff7d6';
  ctx.font = 'bold 19px "Trebuchet MS", sans-serif';
  ctx.fillText(
    escaped
      ? 'Gus made it to the woods — Thanksgiving is saved!'
      : 'Farmer Bram got his dinner... this time. Run again, Gus!',
    VIEW_W / 2,
    192,
  );
  ctx.font = '16px "Trebuchet MS", sans-serif';
  ctx.fillStyle = '#fde68a';
  ctx.fillText(
    `Score ${Math.floor(game.score)}    •    Distance ${Math.floor(game.distanceM)} m    •    Corn ${game.cornCollected}    •    Best ${Math.floor(game.best)} m`,
    VIEW_W / 2,
    226,
  );
  ctx.fillStyle = '#fff7d6';
  ctx.font = '15px "Trebuchet MS", sans-serif';
  ctx.fillText(
    escaped ? 'A new best escape! The woods are safe — for now.' : 'Tip: jump the oven late, double-jump the tall knife, grab the golden corn.',
    VIEW_W / 2,
    256,
  );

  const pulse = 0.65 + Math.sin(time * 4) * 0.35;
  ctx.globalAlpha = pulse;
  ctx.font = 'bold 24px "Trebuchet MS", sans-serif';
  ctx.fillText('PRESS R OR CLICK TO RUN AGAIN', VIEW_W / 2, 505);
  ctx.globalAlpha = 1;
}

// A red edge flash when the farmer is about to grab the turkey, and a
// gentle vignette that deepens as dusk falls.
export function drawEffects(ctx, game, time) {
  const { distanceM, farmer, flash } = game;
  if (flash > 0) {
    ctx.fillStyle = `rgba(220, 38, 38, ${Math.min(0.35, flash * 0.5)})`;
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  }
  if (farmer && farmer.close) {
    const pulse = 0.1 + Math.sin(time * 8) * 0.05;
    const grad = ctx.createLinearGradient(0, 0, 220, 0);
    grad.addColorStop(0, `rgba(220, 38, 38, ${pulse + 0.12})`);
    grad.addColorStop(1, 'rgba(220, 38, 38, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 220, VIEW_H);
    ctx.fillStyle = '#fca5a5';
    ctx.font = 'bold 20px "Trebuchet MS", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('HE IS RIGHT BEHIND YOU!', 18, 110);
  }
  const dusk = Math.min(1, Math.max(0, distanceM / ESCAPE_DISTANCE_M));
  if (dusk > 0.4) {
    const vg = ctx.createRadialGradient(
      VIEW_W / 2, VIEW_H / 2, VIEW_H * 0.45,
      VIEW_W / 2, VIEW_H / 2, VIEW_H * 0.85,
    );
    vg.addColorStop(0, 'rgba(20, 10, 40, 0)');
    vg.addColorStop(1, `rgba(20, 10, 40, ${(dusk - 0.4) * 0.5})`);
    ctx.fillStyle = vg;
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  }
}
