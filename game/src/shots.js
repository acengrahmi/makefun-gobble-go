// Gobble & Go — the screenshot scenes behind ?shot=start|play|end&seed=N.
// Each one sets the real game up in a fixed, deterministic state and, for
// the play scene, runs the real rules forward so the shot shows a genuine
// mid-run moment: hazards ahead, corn in the air, the farmer closing in.
import { ESCAPE_DISTANCE_M } from './config.js';

export function shotFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const shot = params.get('shot');
  if (shot === 'start' || shot === 'play' || shot === 'end') return shot;
  return null;
}

// Title screen, posed with the turkey and the farmer in frame.
export function applyShotStart(game) {
  game.state = 'title';
  game.world.reset();
  game.world.scrollX = 320;
  game.turkey.x = 300;
  game.farmer.gap = 150;
  // Freeze at full pulse so the start prompt reads at full strength.
  game.time = 0.39;
  game.frozen = true;
}

// A real mid-run moment: simulate the rules forward with scripted jumps so
// the scene is rich and fair — fences, an oven, a falling knife, corn arcs
// and the farmer breathing down the turkey's neck at dusk's edge.
export function applyShotPlay(game) {
  game.startRun();
  game.state = 'play';
  const dt = 1 / 60;
  let steps = 0;
  while (game.distanceM < 640 && steps < 60 * 150) {
    // Scripted pilot: jump when a hazard is about half a jump away — the
    // jump carries ~250 px at low speed and more as the run quickens — and
    // double-jump over tall ones (oven, knife) while still rising.
    const horizon = game.speed * 0.5;
    const next = game.hazards.list.find((hz) => hz.x > game.turkey.x && hz.x - game.turkey.x < horizon);
    if (next) {
      if (game.turkey.onGround) game.turkey.jump();
      else if (game.turkey.jumps < 2 && hzIsTall(next) && game.turkey.vy > -350) game.turkey.jump();
    }
    // A tuck-and-roll on open ground buys distance from the farmer.
    if (!next && game.turkey.onGround && game.farmer.gap < 90) game.turkey.slide();
    game.update(dt);
    if (game.state !== 'play') break;
    steps += 1;
  }
  // Freeze a lively frame: farmer close, oven ahead, knife warning up.
  // (frozen, not paused: the PAUSED veil must not cover the shot.)
  game.farmer.gap = 52;
  game.time = 8.2;
  game.frozen = true;
}

// The escaped end screen, with a full run's numbers behind it.
export function applyShotEnd(game) {
  game.startRun();
  game.state = 'play';
  game.distanceM = ESCAPE_DISTANCE_M;
  game.score = 2840;
  game.cornCollected = 23;
  game.lives = 2;
  game.finishRun('escaped');
  // Park the barn clear of the turkey and the farmer for the portrait.
  game.world.scrollX = 600;
  // Freeze at full pulse so the restart prompt reads at full strength.
  game.time = 3.53;
  game.frozen = true;
}

// Tall hazards need the double jump's extra height to clear safely.
function hzIsTall(hz) {
  return hz.kind === 'oven' || hz.kind === 'knife' || hz.kind === 'knifepair';
}
