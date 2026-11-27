// Gobble & Go — keyboard and mouse input. Space / Up / W jumps (twice for
// a double jump), Down / S slides under the low-hanging trouble, R restarts
// from an end screen, and a click or tap does whatever the moment needs:
// start the run, jump, or restart.
export function createInput(canvas) {
  const pressed = new Set();
  const queue = [];

  function note(code) {
    if (!pressed.has(code)) queue.push(code);
    pressed.add(code);
  }

  function onKeyDown(event) {
    if (['Space', 'ArrowUp', 'ArrowDown', 'KeyW', 'KeyS', 'KeyR'].includes(event.code)) {
      event.preventDefault();
    }
    note(event.code);
  }

  function onKeyUp(event) {
    pressed.delete(event.code);
  }

  function onPointerDown(event) {
    event.preventDefault();
    note('Pointer');
  }

  // Muting is a kindness: M toggles the sound, P pauses the run.
  function onMuteKey(event) {
    if (event.code === 'KeyM') note('Mute');
    if (event.code === 'KeyP') note('Pause');
  }

  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  window.addEventListener('keydown', onMuteKey);
  canvas.addEventListener('pointerdown', onPointerDown);

  return {
    // Every fresh press since the last frame, in order.
    drain() {
      const out = queue.splice(0, queue.length);
      return out;
    },
    // Is a key held right now?
    held(code) {
      return pressed.has(code);
    },
    isJump(code) {
      return code === 'Space' || code === 'ArrowUp' || code === 'KeyW' || code === 'Pointer';
    },
    isSlide(code) {
      return code === 'ArrowDown' || code === 'KeyS';
    },
    isRestart(code) {
      return code === 'KeyR' || code === 'Space' || code === 'Pointer';
    },
  };
}
