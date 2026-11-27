// Gobble & Go — Farmer Bram: the chase. He runs behind the turkey and his
// gap is the run's real health bar. Clean jumps let the turkey pull away;
// every stumble lets him surge. He also gets faster — and angrier — as the
// run goes on, and at dusk he pulls out his lantern.
import { FARMER_CATCH_GAP, FARMER_HIT_SURGE, FARMER_START_GAP, GROUND_Y } from './config.js';

export function createFarmer() {
  return {
    gap: FARMER_START_GAP,
    runPhase: 0,
    temper: 1,
    lantern: false,

    // The farmer gains when the turkey is slow or stumbling, and loses
    // ground when the turkey runs clean. Returns true when he catches up.
    update(dt, speed, turkey, distanceM) {
      // He speeds up over the run: by the woods he is nearly as fast.
      this.temper = 1 + Math.min(0.8, distanceM / 1600);
      this.lantern = distanceM > 1000;
      // He closes slowly on his own — the turkey must keep clearing
      // hazards to stay ahead. Each clean jump buys back a little air.
      const closing = (2 + distanceM / 300) * this.temper;
      this.gap -= closing * dt;
      if (turkey.onGround) this.gap += 5 * dt;
      this.gap = Math.max(0, Math.min(320, this.gap));
      this.runPhase += dt * (speed / 26) * this.temper;
      return this.gap <= FARMER_CATCH_GAP;
    },

    // A clean jump over a hazard buys the turkey breathing room.
    pullAway(px) {
      this.gap = Math.min(320, this.gap + px);
    },

    surge() {
      this.gap = Math.max(0, this.gap - FARMER_HIT_SURGE);
    },

    get caught() {
      return this.gap <= FARMER_CATCH_GAP;
    },

    get close() {
      return this.gap < 70;
    },

    get x() {
      return 210 - this.gap - 54;
    },
  };
}

// Draw Farmer Bram: straw hat, red shirt, blue overalls, grey beard, and a
// carving knife in one hand when he is close. He runs hard — arms pumping,
// hat bouncing — and at dusk he carries a lantern.
export function drawFarmer(ctx, farmer, time) {
  const x = farmer.x;
  const ground = GROUND_Y;
  const swing = Math.sin(farmer.runPhase) * 10;
  const bob = Math.abs(Math.sin(farmer.runPhase)) * -4;

  ctx.save();
  ctx.translate(x + 27, ground + bob);

  // Legs: overalls, pumping.
  ctx.strokeStyle = '#2b4a7a';
  ctx.lineWidth = 7;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-6, -34);
  ctx.lineTo(-6 + swing, 0);
  ctx.moveTo(6, -34);
  ctx.lineTo(6 - swing, 0);
  ctx.stroke();

  // Body: red shirt under blue overalls.
  ctx.fillStyle = '#b91c1c';
  ctx.beginPath();
  ctx.roundRect(-16, -62, 32, 32, 8);
  ctx.fill();
  ctx.fillStyle = '#2b4a7a';
  ctx.beginPath();
  ctx.roundRect(-14, -58, 28, 26, 6);
  ctx.fill();
  ctx.fillRect(-14, -62, 5, 30);
  ctx.fillRect(9, -62, 5, 30);

  // Arms: one pumping, one waving the carving knife when close.
  ctx.strokeStyle = '#b91c1c';
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(-14, -56);
  ctx.lineTo(-24, -40 - swing * 0.6);
  ctx.moveTo(14, -56);
  ctx.lineTo(24, -42 + swing * 0.6);
  ctx.stroke();

  // Head, beard and straw hat.
  ctx.fillStyle = '#e8b98a';
  ctx.beginPath();
  ctx.arc(0, -72, 11, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#d1d5db';
  ctx.beginPath();
  ctx.ellipse(2, -64, 8, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  // Angry eyes.
  ctx.strokeStyle = '#1f2937';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-7, -76);
  ctx.lineTo(-2, -74);
  ctx.moveTo(7, -76);
  ctx.lineTo(2, -74);
  ctx.stroke();
  // Straw hat.
  ctx.fillStyle = '#d9a441';
  ctx.beginPath();
  ctx.ellipse(0, -80, 17, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(0, -81, 9, Math.PI, 0);
  ctx.fill();
  ctx.fillStyle = '#92400e';
  ctx.fillRect(-9, -82, 18, 3);

  // Carving knife, glinting, when he is close enough to matter.
  if (farmer.close) {
    const glint = 0.6 + Math.sin(time * 8) * 0.4;
    ctx.save();
    ctx.translate(26, -46 + swing * 0.6);
    ctx.rotate(0.7);
    ctx.fillStyle = `rgba(226, 232, 240, ${glint})`;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(22, -4);
    ctx.lineTo(26, 0);
    ctx.lineTo(0, 6);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#451a03';
    ctx.fillRect(-8, -2, 9, 6);
    ctx.restore();
  }

  // Lantern glow at dusk.
  if (farmer.lantern) {
    const glow = ctx.createRadialGradient(-30, -40, 2, -30, -40, 46);
    glow.addColorStop(0, 'rgba(251, 191, 36, 0.55)');
    glow.addColorStop(1, 'rgba(251, 191, 36, 0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(-30, -40, 46, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#92400e';
    ctx.fillRect(-34, -46, 8, 12);
    ctx.fillStyle = '#fde68a';
    ctx.fillRect(-32, -44, 4, 8);
  }
  ctx.restore();
}
