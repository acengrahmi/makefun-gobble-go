[![make.fun](https://make.fun/badge/turkey-run-game-01.svg)](https://make.fun/c/turkey-run-game-01)
[![rank](https://make.fun/badge/turkey-run-game-01/acengrahmi/makefun-gobble-go/rank.svg)](https://make.fun/c/turkey-run-game-01)
[![reward](https://make.fun/badge/turkey-run-game-01/acengrahmi/makefun-gobble-go/reward.svg)](https://make.fun/c/turkey-run-game-01)

# Gobble & Go — Turkey's Great Thanksgiving Escape

An original side-scrolling turkey escape game for make.fun `turkey-run-game-01`, built from scratch in plain HTML5 Canvas + ES modules (no library, no WebGL, no network, no build step). Gus the turkey runs 1,500 m from Farmer Bram — farmyard, cornfield, woods — to keep from becoming Thanksgiving dinner.

## The game

- **The chase:** Farmer Bram runs behind Gus and speeds up with distance — his gap is the run's real health bar. Clean jumps buy distance; every stumble lets him surge. He lights a lantern at dusk.
- **Hazards:** fences, hay bales, the flaming oven ("HOT!") and the carving knife — telegraphed by a red shadow and "!" warning before it drops and sticks in the ground. Knife pairs appear late in the run.
- **Collectibles:** corn arcs over the hazards (+25 pts); rare golden corn (+100 pts, restores a life).
- **Ramp:** speed 250 → 540 px/s, hazard gaps shrink, new hazards unlock at 120 m (oven), 260 m (knife), 700 m (knife pair).
- **World:** three stages (The Farmyard / The Cornfield / The Woods) with parallax barn, fences, corn stalks, pines and pumpkins — and the sky slides from bright Thanksgiving morning to purple dusk with stars as the run goes on.
- **Screens:** title screen, run HUD (score, distance + progress bar, hearts, farmer-proximity meter, stage, km/h), CAUGHT! and ESCAPED! end screens with restart.
- **Sounds:** WebAudio effects, all synthesized in code (gobble, jump, corn pops, thud, sad trombone, escape fanfare, banjo-style tune). All art is drawn on canvas — zero external assets.

## Controls

Space / Up / W — jump (press again mid-air for a double jump); Down / S — tuck-and-roll speed burst; R — restart; P — pause; M — mute. Mouse / tap also works.

## Play it

Open `game/index.html` in desktop Chrome. No server needed (or run `python3 -m http.server` from `game/`).

## Build

`main.ts` (Node 22) generates the entry dossier from the game sources. No build step for the game itself.
