/* midi/gm/engines.js — 12 synthesis engines + voice pool.
   Depends on TL (audio-core) and GM (programs). Engine names: piano, organ,
   guitar, bass, strings, ensemble, brass, reed, pipe, lead, pad, fx.
   Each voice: oscillator(s) -> (filter?) -> (shaper?) -> env gain -> channel bus. */
(function () {
  var TL = window.TL, GM = window.GM;
  var pool = new Map();
  function keyOf(ch, midi) { return ch + ':' + midi; }

  function velGain(v) { v = Math.max(0, Math.min(127, v || 90)); return 0.05 + (v / 127) * 0.5; }
  function decayScale(midi) { var reg = (108 - midi) / 88; return 0.7 + reg * 0.9; } // longer in low register

  // ---- shared building blocks ----
  function noiseBuffer(dur) {
    var n = Math.floor(TL.ctx.sampleRate * dur);
    var b = TL.ctx.createBuffer(1, n, TL.ctx.sampleRate);
    var d = b.getChannelData(0);
    for (var i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
    return b;
  }
  function noiseSource(dur) {
    var s = TL.ctx.createBufferSource(); s.buffer = noiseBuffer(dur); s.loop = true; s.start();
    return s;
  }
  function distCurve(amount) {
    var k = amount * 80, n = 2048, c = new Float32Array(n);
    for (var i = 0; i < n; i++) { var x = i * 2 / n - 1; c[i] = (1 + k) * x / (1 + k * Math.abs(x)); }
    return c;
  }

  function Voice(bus) { this.bus = bus; this.oscs = []; this.detunes = []; this.alive = true; this.releaseDur = 0.4; }
  Voice.prototype.setDetune = function (c) { for (var i = 0; i < this.detunes.length; i++) this.detunes[i].detune.value = c; };
  Voice.prototype.release = function (dur) {
    if (!this.alive) return;
    var t = TL.ctx.currentTime, d = dur || this.releaseDur || 0.4;
    this.eg.gain.cancelScheduledValues(t);
    this.eg.gain.setValueAtTime(Math.max(this.eg.gain.value, 0.0008), t);
    this.eg.gain.exponentialRampToValueAtTime(0.0008, t + d);
    var self = this; setTimeout(function () { self.kill(); }, d * 1000 + 80);
  };
  Voice.prototype.kill = function () {
    if (!this.alive) return; this.alive = false;
    try { for (var i = 0; i < this.oscs.length; i++) { try { this.oscs[i].stop(); } catch (e) {} } } catch (e) {}
    try { this.eg.disconnect(); } catch (e) {}
    try { if (this.fxInsert) this.fxInsert.disconnect(); } catch (e) {}
  };

  // ---- ENGINE: piano / chromatic-perc / percussive-tuned (partial stacks) ----
  var PARTIALS = {
    piano8:       [{m:1,a:1},{m:2,a:0.55},{m:3,a:0.34},{m:4,a:0.22},{m:5,a:0.14},{m:6,a:0.09},{m:7,a:0.06},{m:8,a:0.04}],
    ep1:          [{m:1,a:1},{m:2,a:0.4},{m:3,a:0.2},{m:4,a:0.1},{m:6,a:0.08}],
    ep2:          [{m:1,a:1},{m:2,a:0.45},{m:3,a:0.25},{m:4,a:0.12},{m:5,a:0.06}],
    harpsichord:  [{m:1,a:1},{m:2,a:0.8},{m:3,a:0.6},{m:4,a:0.4},{m:5,a:0.3},{m:6,a:0.2},{m:7,a:0.12},{m:8,a:0.08}],
    clavinet:     [{m:1,a:1},{m:2,a:0.7},{m:3,a:0.5},{m:4,a:0.3}],
    celesta:      [{m:1,a:1},{m:2,a:0.3},{m:3,a:0.15},{m:4,a:0.08}],
    bell:         [{m:1,a:1},{m:2.7,a:0.5},{m:5.4,a:0.3},{m:8.1,a:0.15}],
    musicbox:     [{m:1,a:1},{m:2,a:0.6},{m:3,a:0.2},{m:4,a:0.1}],
    vibes:        [{m:1,a:1},{m:2,a:0.5},{m:3,a:0.25},{m:4,a:0.12}],
    marimba:      [{m:1,a:1},{m:2,a:0.6},{m:3,a:0.1},{m:4,a:0.04}],
    xylophone:    [{m:1,a:1},{m:3,a:0.7},{m:5,a:0.3},{m:7,a:0.1}],
    tubular:      [{m:1,a:1},{m:2.76,a:0.6},{m:5.4,a:0.4},{m:8.9,a:0.2}],
    dulcimer:     [{m:1,a:1},{m:2,a:0.6},{m:3,a:0.4},{m:4,a:0.2},{m:5,a:0.12}],
    timpani:      [{m:1,a:1},{m:2,a:0.5},{m:3,a:0.2},{m:4,a:0.08}],
    harp:         [{m:1,a:1},{m:2,a:0.5},{m:3,a:0.3},{m:4,a:0.15}],
    harm:         [{m:1,a:1},{m:2,a:0.3},{m:3,a:0.25},{m:4,a:0.1}],
    calliope:     [{m:1,a:1},{m:2,a:0.7},{m:3,a:0.5},{m:4,a:0.3}]
  };

  function enginePiano(bus, midi, vel, p) {
    var v = new Voice(bus); v.peak = velGain(vel) * (p.bright ? p.bright * 0.8 + 0.2 : 1) * (p.gain || 1);
    var t = TL.ctx.currentTime, atk = 0.006, dec = p.decay != null ? p.decay : 0.9;
    v.eg = TL.ctx.createGain(); v.eg.gain.value = 0; v.eg.connect(bus.gain);
    v.eg.gain.setValueAtTime(0, t); v.eg.gain.linearRampToValueAtTime(v.peak, t + atk);
    var rel = Math.max(dec * 0.9, 0.2) * decayScale(midi);
    v.eg.gain.exponentialRampToValueAtTime(0.0008, t + atk + rel * 1.8);
    v.releaseDur = 0.25;
    var freq = TL.midiToFreq(midi);
    var parts = PARTIALS[p.partials] || PARTIALS.piano8;
    if (p.inharmonic) parts = parts.map(function (x) { return { m: x.m * 1.01, a: x.a }; });
    if (p.detune) parts = parts.map(function (x) { return { m: x.m, a: x.a, d: (Math.random() - 0.5) * p.detune * 0.01 }; });
    for (var i = 0; i < parts.length; i++) {
      var o = TL.ctx.createOscillator(); o.type = p.wave || 'sine';
      o.frequency.value = freq * parts[i].m * (1 + 0.0006 * parts[i].m * parts[i].m);
      if (parts[i].d) o.detune.value = parts[i].d * 100;
      var og = TL.ctx.createGain(); og.gain.value = parts[i].a * (p.bright ? Math.min(1, 1.4 / (i + 1) * p.bright) : 1);
      if (p.tine && i === 1) { o.type = 'triangle'; }
      o.connect(og); og.connect(v.eg); o.start();
      v.oscs.push(o); v.detunes.push(o);
    }
    // tine FM-ish layer for electric pianos
    if (p.tine) {
      var mod = TL.ctx.createOscillator(); mod.type = 'sine'; mod.frequency.value = freq * 14;
      var mg = TL.ctx.createGain(); mg.gain.value = freq * 2;
      var car = TL.ctx.createOscillator(); car.type = 'sine'; car.frequency.value = freq * 2;
      mod.connect(mg); mg.connect(car.frequency);
      var cg = TL.ctx.createGain(); cg.gain.value = 0.15; car.connect(cg); cg.connect(v.eg);
      mod.start(); car.start(); v.oscs.push(mod, car); v.detunes.push(car);
    }
    if (p.click) {
      var ns = noiseSource(0.05); var ng = TL.ctx.createGain(); ng.gain.value = 0.12;
      var hp = TL.ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 2000;
      ns.connect(hp); hp.connect(ng); ng.connect(v.eg); ng.gain.setValueAtTime(0.12, t);
      ng.gain.exponentialRampToValueAtTime(0.0008, t + 0.05);
      v.oscs.push(ns);
    }
    return v;
  }

  // ---- ENGINE: organ (sustained drawbar sine stack + key click) ----
  function engineOrgan(bus, midi, vel, p) {
    var v = new Voice(bus); v.peak = velGain(vel) * 0.7 * (p.gain || 1);
    var t = TL.ctx.currentTime, atk = p.slow ? 0.05 : 0.005;
    v.eg = TL.ctx.createGain(); v.eg.gain.value = 0; v.eg.connect(bus.gain);
    v.eg.gain.setValueAtTime(0, t); v.eg.gain.linearRampToValueAtTime(v.peak, t + atk);
    v.releaseDur = 0.08;
    var freq = TL.midiToFreq(midi);
    var bars = p.drawbars || [1, 2, 3, 4, 6, 8];
    for (var i = 0; i < bars.length; i++) {
      var o = TL.ctx.createOscillator(); o.type = p.wave || 'sine';
      o.frequency.value = freq * bars[i];
      if (p.detune) o.detune.value = (i - bars.length / 2) * p.detune;
      var og = TL.ctx.createGain(); og.gain.value = 1 / (i + 1) * (p.bright || 1);
      o.connect(og); og.connect(v.eg); o.start();
      v.oscs.push(o); v.detunes.push(o);
    }
    // key click
    var ns = noiseSource(0.03); var ng = TL.ctx.createGain(); ng.gain.value = 0.06;
    var hp = TL.ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 3000;
    ns.connect(hp); hp.connect(ng); ng.connect(v.eg); ng.gain.exponentialRampToValueAtTime(0.0008, t + 0.03);
    v.oscs.push(ns);
    return v;
  }

  // ---- SAW/FILTER ENGINE: guitar, bass, strings, brass, reed, ensemble, lead, pad ----
  function engineSaw(bus, midi, vel, p) {
    var v = new Voice(bus); v.peak = velGain(vel) * (p.low ? 0.7 : 1) * (p.hit ? 1.1 : 1) * (p.gain || 1);
    var t = TL.ctx.currentTime, atk = p.attack != null ? p.attack : 0.005;
    var sus = p.sustain || false;
    v.eg = TL.ctx.createGain(); v.eg.gain.value = 0; v.eg.connect(bus.gain);
    v.eg.gain.setValueAtTime(0, t); v.eg.gain.linearRampToValueAtTime(v.peak, t + atk);
    v.releaseDur = sus ? 0.3 : 0.2;
    if (!sus) {
      var dec = p.decay != null ? p.decay : 0.6;
      var rel = Math.max(dec * 0.9, 0.15) * decayScale(midi);
      v.eg.gain.exponentialRampToValueAtTime(0.0008, t + atk + rel * 1.6);
      v.releaseDur = Math.max(0.1, rel * 0.5);
    }
    var freq = TL.midiToFreq(midi);
    var n = p.oscs || 1, det = p.detune || 0, wave = p.wave || 'sawtooth';
    var filt = null;
    if (p.cutoff) {
      filt = TL.ctx.createBiquadFilter(); filt.type = 'lowpass'; filt.Q.value = p.q || 1;
      var c0 = p.cutoff * (p.bright || 1), c1 = sus ? c0 * 0.7 : Math.max(300, c0 * 0.4);
      filt.frequency.setValueAtTime(c0, t);
      filt.frequency.exponentialRampToValueAtTime(c1, t + (sus ? 0.6 : (p.decay || 0.6) * 1.2));
      filt.connect(v.eg);
    }
    if (p.sweep) { // filter opens for pads
      filt = filt || TL.ctx.createBiquadFilter(); filt.type = 'lowpass';
      filt.frequency.setValueAtTime(Math.max(200, p.cutoff * 0.3), t);
      filt.frequency.exponentialRampToValueAtTime(p.cutoff, t + 0.8 * p.sweep);
      filt.Q.value = p.q || 2; filt.connect(v.eg);
    }
    var shaper = null;
    if (p.shape) { shaper = TL.ctx.createWaveShaper(); shaper.curve = distCurve(p.shape); shaper.connect(v.eg); }
    var sink = shaper || filt || v.eg;
    for (var i = 0; i < n; i++) {
      var o = TL.ctx.createOscillator(); o.type = wave; o.frequency.value = freq;
      if (n > 1) o.detune.value = (i - (n - 1) / 2) * det;
      if (p.fifth && i === 1) o.frequency.value = freq * 1.5;
      o.connect(sink); o.start(); v.oscs.push(o); v.detunes.push(o);
    }
    // vibrato
    if (p.vibrato) {
      var lfo = TL.ctx.createOscillator(); lfo.frequency.value = 5.5;
      var lg = TL.ctx.createGain(); lg.gain.value = 6;
      lfo.connect(lg); lg.connect(v.detunes[0].detune); lfo.start(); v.oscs.push(lfo);
    }
    if (p.tremolo) {
      var tlfo = TL.ctx.createOscillator(); tlfo.frequency.value = 6; var tg = TL.ctx.createGain(); tg.gain.value = 0.2;
      var tg2 = TL.ctx.createGain(); tg2.gain.value = 1; tlfo.connect(tg); tg.connect(tg2.gain);
      v.eg.disconnect(); v.eg.connect(tg2); tg2.connect(bus.gain); tlfo.start(); v.oscs.push(tlfo);
      v.fxInsert = tg2;
    }
    if (p.breath) {
      var ns = noiseSource(0.4); var ng = TL.ctx.createGain(); ng.gain.value = 0.04;
      var hp = TL.ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 3000;
      ns.connect(hp); hp.connect(ng); ng.connect(v.eg); v.oscs.push(ns);
    }
    if (p.click) {
      var ns2 = noiseSource(0.04); var ng2 = TL.ctx.createGain(); ng2.gain.value = 0.1;
      ns2.connect(ng2); ng2.connect(v.eg); ng2.gain.exponentialRampToValueAtTime(0.0008, t + 0.04);
      v.oscs.push(ns2);
    }
    return v;
  }

  // ---- ENGINE: pipe / flute (sine/triangle + breath + vibrato) ----
  function enginePipe(bus, midi, vel, p) {
    p.wave = p.wave || 'sine'; p.sustain = true; p.attack = p.attack || 0.05; p.cutoff = 9999; p.breath = true;
    return engineSaw(bus, midi, vel, p);
  }

  // ---- ENGINE: fx (noise / tone approximations) ----
  function engineFx(bus, midi, vel, p) {
    var v = new Voice(bus); v.peak = velGain(vel) * 0.6 * (p.gain || 1);
    var t = TL.ctx.currentTime;
    v.eg = TL.ctx.createGain(); v.eg.gain.value = 0; v.eg.connect(bus.gain);
    v.eg.gain.setValueAtTime(0, t); v.eg.gain.linearRampToValueAtTime(v.peak, t + 0.02);
    var dec = p.decay || 1.0;
    v.eg.gain.exponentialRampToValueAtTime(0.0008, t + dec);
    v.releaseDur = 0.1;
    if (p.kind === 'noise') {
      var ns = noiseSource(dec + 0.2);
      var f = TL.ctx.createBiquadFilter();
      f.type = p.color === 'hpf' ? 'highpass' : p.color === 'bpf' ? 'bandpass' : 'lowpass';
      f.frequency.value = p.freq || 1500; f.Q.value = p.color === 'bpf' ? 4 : 1;
      if (p.sweep) f.frequency.exponentialRampToValueAtTime((p.freq || 1500) * 4, t + dec);
      ns.connect(f); f.connect(v.eg); v.oscs.push(ns);
      if (p.mod) { var lfo = TL.ctx.createOscillator(); lfo.frequency.value = 6; var lg = TL.ctx.createGain(); lg.gain.value = 400; lfo.connect(lg); lg.connect(f.frequency); lfo.start(); v.oscs.push(lfo); }
    } else if (p.kind === 'tone') {
      var o = TL.ctx.createOscillator(); o.type = p.wave || 'square'; o.frequency.value = p.freq || TL.midiToFreq(midi);
      o.connect(v.eg); o.start(); v.oscs.push(o); v.detunes.push(o);
    } else {
      v.eg.disconnect();
      return engineSaw(bus, midi, vel, p);
    }
    return v;
  }

  var BY_NAME = {
    piano: enginePiano, organ: engineOrgan,
    guitar: engineSaw, bass: engineSaw, strings: engineSaw, ensemble: engineSaw,
    brass: engineSaw, reed: engineSaw, pipe: enginePipe,
    lead: engineSaw, pad: engineSaw, fx: engineFx
  };

  function currentProgram(ch) {
    if (window.Router && Router.channels && Router.channels[ch]) return Router.channels[ch].program;
    return 0;
  }

  function play(ch, midi, vel) {
    if (midi < TL.MIDI_START || midi > TL.MIDI_END) return null;
    var prog = GM.TABLE[currentProgram(ch)] || GM.TABLE[0];
    var bus = TL.nowChannel(ch);
    var fn = BY_NAME[prog.engine] || enginePiano;
    var v;
    try { v = fn(bus, midi, vel, prog.params); } catch (e) { console.warn('engine', prog.engine, e); v = enginePiano(bus, midi, vel, {}); }
    var k = keyOf(ch, midi);
    if (pool.has(k)) { try { pool.get(k).kill(); } catch (e) {} }
    pool.set(k, v);
    return v;
  }
  function release(ch, midi) {
    var k = keyOf(ch, midi), v = pool.get(k);
    if (v) { v.release(v.releaseDur); pool.delete(k); }
  }
  function killAll(ch) {
    pool.forEach(function (v, k) { if (k.indexOf(ch + ':') === 0) { v.kill(); pool.delete(k); } });
  }
  function setDetune(ch, cents) {
    pool.forEach(function (v, k) { if (k.indexOf(ch + ':') === 0 && v.setDetune) v.setDetune(cents); });
  }
  function setBrightness(ch, x) { /* optional; left for future CC74 brightness */ }

  window.Engines = { play: play, release: release, killAll: killAll, setDetune: setDetune, setBrightness: setBrightness };

  // SELF-CHECK
  (function () {
    var ok = true, log = function (m) { console.log('[engines] ' + m); };
    TL.resume();
    var heard = 0;
    for (var i = 0; i < 128; i++) {
      var prog = GM.TABLE[i];
      if (window.Router) { Router.channels = Router.channels || []; Router.channels[0] = { program: i }; }
      else window.Router = { channels: [{ program: i }] };
      try {
        var v = play(0, 60, 90);
        if (!v) { ok = false; log('FAIL no voice for program ' + i); break; }
        v.release(0.05); heard++;
      } catch (e) { ok = false; log('FAIL throw on program ' + i + ' engine ' + prog.engine + ': ' + e.message); break; }
    }
    if (ok && heard === 128) log('SELF-CHECK PASS (128 voices built, no throws)');
  })();
})();
