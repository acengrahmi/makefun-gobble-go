// Gobble & Go — tuning constants. One place for every number that shapes
// how the escape feels: speeds, gravity, the farmer's temper, the ramp.
export const VIEW_W = 960;
export const VIEW_H = 540;
export const GROUND_Y = 468;

// The run: distance is measured in metres, 50 px of world travel = 1 m.
export const PX_PER_METRE = 50;
export const ESCAPE_DISTANCE_M = 1500;
export const BASE_SPEED = 250;
export const MAX_SPEED = 540;
export const SPEED_RAMP_PER_M = 0.21;

// The turkey.
export const TURKEY_X = 210;
export const TURKEY_W = 64;
export const TURKEY_H = 58;
export const GRAVITY = 2300;
export const JUMP_VELOCITY = 950;
export const DOUBLE_JUMP_VELOCITY = 850;
export const SLIDE_TIME = 0.55;
export const MAX_LIVES = 3;

// The farmer: how far behind the turkey he starts, and how the chase works.
export const FARMER_START_GAP = 150;
export const FARMER_CATCH_GAP = 26;
export const FARMER_HIT_SURGE = 46;
export const FARMER_RECOVER_PER_S = 9;
export const FARMER_BASE_TEMPER = 1.0;

// Scoring.
export const SCORE_PER_METRE = 2;
export const CORN_SCORE = 25;
export const GOLDEN_CORN_SCORE = 100;
export const NEAR_MISS_SCORE = 15;

// The three stretches of the escape, each with its own scenery.
export const STAGES = [
  { name: 'THE FARMYARD', from: 0, to: 500, sky: 'farmyard' },
  { name: 'THE CORNFIELD', from: 500, to: 1000, sky: 'cornfield' },
  { name: 'THE WOODS', from: 1000, to: ESCAPE_DISTANCE_M, sky: 'woods' },
];

// Hazard spawn pacing: gap in pixels between hazards, shrinking with distance.
export function hazardGapPx(distanceM, rng) {
  const base = 430 - Math.min(190, distanceM * 0.16);
  return base + rng() * 260;
}

// Which hazards may appear at a given distance (the kitchen creeps in).
export function hazardKindsAt(distanceM) {
  const kinds = ['fence', 'hay'];
  if (distanceM > 120) kinds.push('oven');
  if (distanceM > 260) kinds.push('knife');
  if (distanceM > 700) kinds.push('knifepair');
  return kinds;
}

// How often corn appears, and how rare a golden cob is.
export const CORN_ARC_CHANCE = 0.55;
export const GOLDEN_CORN_CHANCE = 0.09;

// Day-to-dusk: 0 = bright Thanksgiving morning, 1 = dusk at the woods.
export function duskFactor(distanceM) {
  return Math.min(1, Math.max(0, distanceM / ESCAPE_DISTANCE_M));
}
