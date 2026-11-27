// Gobble & Go — the game itself: state, the loop, collisions, scoring and
// the farmer chase. It wires together the turkey, the farmer, the hazards,
// the corn, the world, the HUD and the screens, and nothing else.
import {
  BASE_SPEED,
  CORN_SCORE,
  ESCAPE_DISTANCE_M,
  GOLDEN_CORN_SCORE,
  GROUND_Y,
  MAX_LIVES,
  MAX_SPEED,
  NEAR_MISS_SCORE,
  PX_PER_METRE,
  SCORE_PER_METRE,
  SPEED_RAMP_PER_M,
  STAGES,
  VIEW_H,
  VIEW_W,
} from './config.js';
import { createAudio } from './audio.js';
import { createCorn, drawCorn } from './corn.js';
import { createFarmer, drawFarmer } from './farmer.js';
import { createHazards, drawHazards } from './hazards.js';
import { drawHud } from './hud.js';
import { createInput } from './input.js';
import { drawEffects, drawEnd, drawTitle } from './render.js';
import { mulberry32, seedFromUrl } from './rng.js';
import { applyShotEnd, applyShotPlay, applyShotStart, shotFromUrl } from './shots.js';
import { createTurkey, drawTurkey } from './turkey.js';
import { createWorld } from './world.js';

export function createGame(canvas) {
  const ctx = canvas.getContext('2d');
  const audio = createAudio();
  const input = createInput(canvas);
  const seed = seedFromUrl();
  const rng = mulberry32(seed);

  const game = {
    canvas,
    ctx,
    audio,
    input,
    state: 'title',
    result: null,
    time: 0,
    paused: false,
    frozen: false,
    flash: 0,
    score: 0,
    distanceM: 0,
    lives: MAX_LIVES,
    cornCollected: 0,
    best: 0,
    bestScore: 0,
    speed: BASE_SPEED,
    turkey: createTurkey(),
    farmer: createFarmer(),
    hazards: createHazards(rng),
    corn: createCorn(rng),
    world: createWorld(rng),
    stageName: STAGES[0].name,
    statusEl: document.getElementById('status'),

    startRun() {
      this.state = 'play';
      this.result = null;
      this.score = 0;
      this.distanceM = 0;
      this.lives = MAX_LIVES;
      this.cornCollected = 0;
      this.speed = BASE_SPEED;
      this.flash = 0;
      this.turkey = createTurkey();
      this.farmer = createFarmer();
      this.hazards.reset();
      this.corn.reset();
      this.world.reset();
      this.stageName = STAGES[0].name;
      audio.unlock();
      audio.gobble();
      audio.startMusic();
      this.announce('The run begins. Farmer Bram is behind you — run!');
    },

    finishRun(result) {
      this.state = 'end';
      this.result = result;
      audio.stopMusic();
      if (result === 'escaped') {
        audio.escaped();
        this.announce(`Escaped! Gus reached the woods with ${this.score} points.`);
      } else {
        audio.caught();
        this.announce(`Caught! Farmer Bram got Gus after ${Math.floor(this.distanceM)} metres.`);
      }
      if (this.distanceM > this.best) this.best = this.distanceM;
      if (this.score > this.bestScore) this.bestScore = this.score;
    },

    announce(text) {
      if (this.statusEl) this.statusEl.textContent = text;
    },

    stageFor(distanceM) {
      for (const stage of STAGES) {
        if (distanceM >= stage.from && distanceM < stage.to) return stage.name;
      }
      return STAGES[STAGES.length - 1].name;
    },

    // One fixed step of the run.
    update(dt) {
      if (this.state !== 'play' || this.paused || this.frozen) return;

      // Speed ramps with distance; tuck-and-roll adds a burst.
      const target = Math.min(MAX_SPEED, BASE_SPEED + this.distanceM * SPEED_RAMP_PER_M);
      const sliding = this.turkey.sliding > 0;
      this.speed = target * (sliding ? 1.25 : 1);
      const travelled = this.speed * dt;
      this.distanceM += travelled / PX_PER_METRE;
      this.score += (travelled / PX_PER_METRE) * SCORE_PER_METRE;
      this.stageName = this.stageFor(this.distanceM);

      this.turkey.update(dt, this.speed);
      const caught = this.farmer.update(dt, this.speed, this.turkey, this.distanceM);
      if (sliding) this.farmer.pullAway(8 * dt);
      this.hazards.update(dt, this.speed, this.distanceM, this.world.scrollX);
      this.corn.update(dt, this.speed);
      this.world.update(dt, this.speed, this.distanceM, this.stageName);
      if (this.flash > 0) this.flash -= dt;

      // Corn arcs appear above the hazards ahead.
      for (const hz of this.hazards.list) {
        if (!hz.cornSpawned && hz.x < VIEW_W + 60) {
          hz.cornSpawned = true;
          this.corn.spawnArc(hz.x + hz.w / 2, GROUND_Y - hz.h - 40);
        }
      }

      // Collecting corn.
      const got = this.corn.collect(this.turkey.box);
      for (const c of got) {
        this.cornCollected += 1;
        if (c.golden) {
          this.score += GOLDEN_CORN_SCORE;
          if (this.lives < MAX_LIVES) {
            this.lives += 1;
            this.world.popup(this.turkey.x + 20, this.turkey.y - 10, '+1 LIFE!', '#fbbf24');
          } else {
            this.world.popup(this.turkey.x + 20, this.turkey.y - 10, `+${GOLDEN_CORN_SCORE} GOLDEN CORN!`, '#fbbf24');
          }
          audio.goldenCorn();
        } else {
          this.score += CORN_SCORE;
          audio.corn();
        }
      }

      // Passing a hazard clean buys distance from the farmer.
      for (const hz of this.hazards.passedBy(this.turkey.x)) {
        this.farmer.pullAway(12);
        if (hz.kind === 'knife' || hz.kind === 'knifepair') {
          this.score += NEAR_MISS_SCORE;
          this.world.popup(this.turkey.x + 30, this.turkey.y - 20, 'CLOSE ONE!', '#fca5a5');
          audio.nearMiss();
        }
      }

      // Hitting a hazard: lose a life, the farmer surges.
      if (this.turkey.invincible <= 0) {
        const hit = this.hazards.hitTest(this.turkey.box);
        if (hit) {
          this.lives -= 1;
          this.turkey.hurt();
          this.farmer.surge();
          this.flash = 0.7;
          audio.hit();
          this.world.popup(this.turkey.x + 20, this.turkey.y - 10, 'OUCH!', '#f87171');
          this.announce(`Ouch! ${this.lives} ${this.lives === 1 ? 'life' : 'lives'} left.`);
          if (this.lives <= 0) {
            this.finishRun('caught');
            return;
          }
        }
      }

      // The farmer catches the turkey.
      if (caught) {
        this.finishRun('caught');
        return;
      }

      // The woods at last: escaped!
      if (this.distanceM >= ESCAPE_DISTANCE_M) {
        this.score += 500;
        this.finishRun('escaped');
        return;
      }

      // The farmer is right behind: warn the player.
      if (this.farmer.close && !this._warnedClose) {
        this._warnedClose = true;
        audio.spotted();
        this.announce('Spotted! The farmer is right behind you!');
      } else if (!this.farmer.close) {
        this._warnedClose = false;
      }
    },

    // One frame of input, depending on the screen showing.
    handleInput() {
      const presses = input.drain();
      // A screenshot scene freezes the frame; the first real press unfreezes
      // it so a ?shot= link still plays when someone actually opens it.
      if (this.frozen && presses.length > 0) this.frozen = false;
      for (const code of presses) {
        if (code === 'Mute') {
          const muted = audio.toggleMute();
          this.announce(muted ? 'Sound off.' : 'Sound on.');
          continue;
        }
        if (code === 'Pause' && this.state === 'play') {
          this.paused = !this.paused;
          this.announce(this.paused ? 'Paused.' : 'Running again.');
          continue;
        }
        if (this.state === 'title') {
          if (input.isJump(code)) this.startRun();
        } else if (this.state === 'play') {
          if (!this.paused) {
            if (input.isJump(code)) {
              const kind = this.turkey.jump();
              if (kind === 'jump') audio.jump();
              else if (kind === 'double') audio.doubleJump();
            } else if (input.isSlide(code)) {
              if (this.turkey.slide()) audio.slide();
            }
          }
        } else if (this.state === 'end') {
          if (input.isRestart(code)) this.startRun();
        }
      }
    },

    // Draw the current screen.
    render() {
      const { ctx } = this;
      ctx.clearRect(0, 0, VIEW_W, VIEW_H);
      if (this.state === 'title') {
        drawTitle(ctx, this, this.time);
        return;
      }
      if (this.state === 'end') {
        drawEnd(ctx, this, this.time);
        return;
      }
      // The run.
      this.world.drawSky(ctx, this.distanceM, this.time);
      this.world.drawScenery(ctx, this.distanceM);
      this.world.drawGround(ctx, this.distanceM);
      drawCorn(ctx, this.corn, this.time);
      drawHazards(ctx, this.hazards, this.time);
      drawTurkey(ctx, this.turkey, this.time);
      drawFarmer(ctx, this.farmer, this.time);
      this.world.drawPopups(ctx);
      drawHud(ctx, {
        score: Math.floor(this.score),
        distanceM: this.distanceM,
        lives: this.lives,
        farmer: this.farmer,
        speed: this.speed,
        stageName: this.stageName,
        time: this.time,
      });
      drawEffects(ctx, this, this.time);
      if (this.paused) {
        ctx.fillStyle = 'rgba(20, 12, 8, 0.55)';
        ctx.fillRect(0, 0, VIEW_W, VIEW_H);
        ctx.fillStyle = '#fff7d6';
        ctx.font = 'bold 44px "Trebuchet MS", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('PAUSED', VIEW_W / 2, VIEW_H / 2);
        ctx.font = '18px "Trebuchet MS", sans-serif';
        ctx.fillText('Press P to keep running', VIEW_W / 2, VIEW_H / 2 + 34);
      }
    },
  };

  return game;
}

// Boot: resize the canvas to the fixed logical size, apply any screenshot
// scene, then run the loop.
export function boot() {
  const canvas = document.getElementById('game');
  canvas.width = VIEW_W;
  canvas.height = VIEW_H;
  const game = createGame(canvas);
  game.world.reset();

  const shot = shotFromUrl();
  if (shot === 'start') applyShotStart(game);
  else if (shot === 'play') applyShotPlay(game);
  else if (shot === 'end') applyShotEnd(game);

  let last = performance.now();
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    // The clock runs everywhere except in a frozen screenshot scene.
    if (!game.paused && !game.frozen) game.time += dt;
    game.handleInput();
    game.update(dt);
    game.render();
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
  return game;
}

boot();
