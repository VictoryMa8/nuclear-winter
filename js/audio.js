// ============ NUCLEAR WINTER — synthesized audio ============
// Everything is generated with the Web Audio API: no sound files.

const AudioSys = (() => {
  let ctx = null;
  let master = null;
  let noiseBuf = null;
  let muted = false;
  let musicNodes = [];
  let melodyTimer = null;
  let pulseTimer = null;

  function ensure() {
    if (!ctx) {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      master = ctx.createGain();
      master.gain.value = 0.5;
      master.connect(ctx.destination);
      // 2 seconds of white noise, reused by every noise-based effect
      const len = ctx.sampleRate * 2;
      noiseBuf = ctx.createBuffer(1, len, ctx.sampleRate);
      const d = noiseBuf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  // Simple tone: freq -> optional slide, with quick attack / exponential decay
  function tone(freq, dur, { type = 'square', vol = 0.2, slideTo = null, delay = 0 } = {}) {
    if (muted || !ctx) return;
    const t = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(Math.max(20, slideTo), t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(vol, t + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(g).connect(master);
    osc.start(t);
    osc.stop(t + dur + 0.05);
  }

  // Filtered noise burst: the backbone of gunshots, steps, hits
  function noise(dur, { vol = 0.3, freq = 1000, type = 'lowpass', q = 1, slideTo = null, delay = 0 } = {}) {
    if (muted || !ctx) return;
    const t = ctx.currentTime + delay;
    const src = ctx.createBufferSource();
    src.buffer = noiseBuf;
    src.loop = true;
    const f = ctx.createBiquadFilter();
    f.type = type;
    f.frequency.setValueAtTime(freq, t);
    if (slideTo) f.frequency.exponentialRampToValueAtTime(Math.max(20, slideTo), t + dur);
    f.Q.value = q;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(vol, t + 0.005);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f).connect(g).connect(master);
    src.start(t, Math.random());
    src.stop(t + dur + 0.05);
  }

  // ---------------- sound effects ----------------
  const sfx = {
    click()   { tone(680, 0.05, { type: 'square', vol: 0.08 }); },
    denied()  { tone(150, 0.15, { type: 'sawtooth', vol: 0.1, slideTo: 90 }); },
    step()    { noise(0.06, { vol: 0.05, freq: 420, slideTo: 180 }); },
    talk()    { tone(300 + Math.random() * 180, 0.03, { type: 'square', vol: 0.03 }); },

    pickup()  { tone(520, 0.08, { vol: 0.12 }); tone(780, 0.12, { vol: 0.12, delay: 0.07 }); },
    coin()    { tone(900, 0.06, { vol: 0.1 }); tone(1350, 0.14, { vol: 0.1, delay: 0.05 }); },
    heal()    { tone(400, 0.1, { type: 'triangle', vol: 0.14 }); tone(600, 0.1, { type: 'triangle', vol: 0.14, delay: 0.09 }); tone(800, 0.18, { type: 'triangle', vol: 0.14, delay: 0.18 }); },
    unlock()  { tone(220, 0.06, { vol: 0.12 }); tone(330, 0.06, { vol: 0.12, delay: 0.08 }); noise(0.2, { vol: 0.12, freq: 900, delay: 0.16, slideTo: 300 }); },
    burn()    { noise(0.7, { vol: 0.2, freq: 2500, slideTo: 400 }); noise(0.5, { vol: 0.1, freq: 500, delay: 0.1 }); },
    flash()   { noise(0.5, { vol: 0.35, freq: 6000, type: 'highpass' }); tone(2400, 0.5, { type: 'sine', vol: 0.15 }); },

    levelup() {
      [262, 330, 392, 523].forEach((f, i) => tone(f, 0.14, { type: 'square', vol: 0.12, delay: i * 0.09 }));
    },
    victory() {
      [196, 262, 330, 392, 523].forEach((f, i) => tone(f, 0.2, { type: 'triangle', vol: 0.14, delay: i * 0.12 }));
    },
    death() {
      tone(220, 0.5, { type: 'sawtooth', vol: 0.15, slideTo: 55 });
      tone(165, 0.8, { type: 'sawtooth', vol: 0.12, slideTo: 40, delay: 0.3 });
      noise(1.2, { vol: 0.1, freq: 400, slideTo: 60, delay: 0.2 });
    },

    hurt()     { noise(0.15, { vol: 0.22, freq: 700, slideTo: 200 }); tone(160, 0.12, { type: 'sawtooth', vol: 0.14, slideTo: 90 }); },
    enemyHit() { noise(0.12, { vol: 0.2, freq: 1200, slideTo: 300 }); tone(110, 0.1, { type: 'square', vol: 0.12, slideTo: 70 }); },
    growl()    { tone(90, 0.4, { type: 'sawtooth', vol: 0.16, slideTo: 60 }); noise(0.35, { vol: 0.1, freq: 250 }); },

    // weapon fire, keyed by weapon sound class
    fire(kind) {
      switch (kind) {
        case 'rifle':
          noise(0.28, { vol: 0.4, freq: 2200, slideTo: 150 });
          tone(120, 0.2, { type: 'sawtooth', vol: 0.2, slideTo: 50 });
          break;
        case 'shotgun':
          noise(0.4, { vol: 0.5, freq: 1400, slideTo: 90 });
          tone(90, 0.3, { type: 'sawtooth', vol: 0.25, slideTo: 40 });
          break;
        case 'smg':
          for (let i = 0; i < 3; i++) {
            noise(0.09, { vol: 0.3, freq: 1900, slideTo: 300, delay: i * 0.09 });
            tone(140, 0.07, { type: 'square', vol: 0.12, slideTo: 70, delay: i * 0.09 });
          }
          break;
        case 'revolver':
          noise(0.22, { vol: 0.38, freq: 1800, slideTo: 120 });
          tone(150, 0.15, { type: 'square', vol: 0.16, slideTo: 60 });
          break;
        default: // melee
          noise(0.1, { vol: 0.12, freq: 800, type: 'highpass' });
          noise(0.12, { vol: 0.25, freq: 500, slideTo: 120, delay: 0.06 });
      }
    }
  };

  // ---------------- ambient music ----------------
  // A cold wind loop, a low detuned drone, and sparse minor-key notes with echo.
  const SCALE = [73.42, 87.31, 98.0, 110.0, 130.81, 146.83]; // D2 F2 G2 A2 C3 D3

  function startAmbient() {
    if (!ctx || musicNodes.length) return;

    // wind: band-passed noise with a slow wandering LFO on the filter
    const wind = ctx.createBufferSource();
    wind.buffer = noiseBuf; wind.loop = true;
    const wf = ctx.createBiquadFilter();
    wf.type = 'bandpass'; wf.frequency.value = 320; wf.Q.value = 0.6;
    const wg = ctx.createGain(); wg.gain.value = 0.045;
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.07;
    const lfoG = ctx.createGain(); lfoG.gain.value = 180;
    lfo.connect(lfoG).connect(wf.frequency);
    wind.connect(wf).connect(wg).connect(master);
    wind.start(); lfo.start();
    musicNodes.push(wind, lfo);

    // drone: two slightly detuned low triangles that breathe
    const dg = ctx.createGain(); dg.gain.value = 0.05;
    const breathe = ctx.createOscillator();
    breathe.frequency.value = 0.05;
    const bg = ctx.createGain(); bg.gain.value = 0.03;
    breathe.connect(bg).connect(dg.gain);
    [55, 55.6].forEach(f => {
      const o = ctx.createOscillator();
      o.type = 'triangle'; o.frequency.value = f;
      o.connect(dg);
      o.start();
      musicNodes.push(o);
    });
    dg.connect(master);
    breathe.start();
    musicNodes.push(breathe);

    // echo bus for the sparse melody
    const delay = ctx.createDelay(2.0); delay.delayTime.value = 0.55;
    const fb = ctx.createGain(); fb.gain.value = 0.45;
    const mix = ctx.createGain(); mix.gain.value = 0.5;
    delay.connect(fb).connect(delay);
    delay.connect(mix).connect(master);
    musicNodes._melodyBus = delay;

    melodyTimer = setInterval(() => {
      if (muted || !ctx || Math.random() < 0.35) return;
      const f = SCALE[Math.floor(Math.random() * SCALE.length)] * (Math.random() < 0.3 ? 2 : 1);
      const t = ctx.currentTime;
      const o = ctx.createOscillator();
      o.type = 'triangle'; o.frequency.value = f;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(0.07, t + 0.4);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 2.8);
      o.connect(g);
      g.connect(master);
      g.connect(delay);
      o.start(t); o.stop(t + 3);
    }, 2600);
  }

  function stopAmbient() {
    musicNodes.forEach(n => { try { n.stop(); } catch (e) { /* gain nodes */ } });
    musicNodes = [];
    if (melodyTimer) { clearInterval(melodyTimer); melodyTimer = null; }
  }

  // low war-drum pulse while in combat
  function startCombatPulse() {
    if (pulseTimer || !ctx) return;
    let beat = 0;
    pulseTimer = setInterval(() => {
      if (muted) return;
      tone(65, 0.22, { type: 'sine', vol: beat % 4 === 0 ? 0.3 : 0.18, slideTo: 40 });
      if (beat % 4 === 2) noise(0.08, { vol: 0.07, freq: 3000, type: 'highpass' });
      beat++;
    }, 480);
  }
  function stopCombatPulse() {
    if (pulseTimer) { clearInterval(pulseTimer); pulseTimer = null; }
  }

  function toggleMute() {
    muted = !muted;
    if (master) master.gain.value = muted ? 0 : 0.5;
    return muted;
  }

  return { ensure, sfx, startAmbient, stopAmbient, startCombatPulse, stopCombatPulse, toggleMute, get muted() { return muted; } };
})();
