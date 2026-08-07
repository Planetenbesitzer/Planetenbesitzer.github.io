/* midi/gm/drums.js — GM channel-10 drum kit (synthesized).
   Depends on TL (audio-core). One-shot voices connected to TL.master. */
(function () {
  var TL = window.TL;
  function noiseBuffer(dur) {
    var n = Math.floor(TL.ctx.sampleRate * dur);
    var b = TL.ctx.createBuffer(1, n, TL.ctx.sampleRate);
    var d = b.getChannelData(0);
    for (var i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
    return b;
  }
  function vel(v) { v = Math.max(0, Math.min(127, v || 100)); return 0.1 + (v / 127) * 0.7; }

  function noise(dur, type, freq, q) {
    var s = TL.ctx.createBufferSource(); s.buffer = noiseBuffer(dur);
    var f = TL.ctx.createBiquadFilter(); f.type = type || 'highpass'; f.frequency.value = freq || 4000; f.Q.value = q || 1;
    s.connect(f); return { head: f, src: s };
  }
  function tone(type, freq) {
    var o = TL.ctx.createOscillator(); o.type = type || 'sine'; o.frequency.value = freq || 200; return o;
  }
  function env(node, peak, dur) {
    var t = TL.ctx.currentTime;
    node.gain.setValueAtTime(0, t);
    node.gain.linearRampToValueAtTime(peak, t + 0.002);
    node.gain.exponentialRampToValueAtTime(0.0008, t + dur);
  }

  function Kick(v) {
    var t = TL.ctx.currentTime;
    var o = tone('sine', 140); var g = TL.ctx.createGain(); g.gain.value = 0;
    o.frequency.setValueAtTime(140, t); o.frequency.exponentialRampToValueAtTime(45, t + 0.12);
    o.connect(g); g.connect(TL.master); o.start(); env(g, v, 0.4); stop(o, g, 0.5);
  }
  function Snare(v) {
    var n = noise(0.25, 'highpass', 1500); var ng = TL.ctx.createGain(); ng.gain.value = 0;
    n.head.connect(ng); ng.connect(TL.master); n.src.start(); env(ng, v * 0.7, 0.18);
    var o = tone('triangle', 180); var g = TL.ctx.createGain(); g.gain.value = 0;
    o.connect(g); g.connect(TL.master); o.start(); env(g, v * 0.4, 0.12); stop(o, g, 0.2);
    stop(n.src, ng, 0.3);
  }
  function Hat(v, dur, freq) {
    var n = noise(dur, 'highpass', freq || 7000); var g = TL.ctx.createGain(); g.gain.value = 0;
    n.head.connect(g); g.connect(TL.master); n.src.start(); env(g, v * 0.4, dur);
    stop(n.src, g, dur + 0.05);
  }
  function Tom(v, freq) {
    var t = TL.ctx.currentTime;
    var o = tone('sine', freq); var g = TL.ctx.createGain(); g.gain.value = 0;
    o.frequency.setValueAtTime(freq, t); o.frequency.exponentialRampToValueAtTime(freq * 0.5, t + 0.2);
    o.connect(g); g.connect(TL.master); o.start(); env(g, v, 0.4); stop(o, g, 0.45);
  }
  function Cymbal(v, dur) {
    var n = noise(dur, 'highpass', 5000); var g = TL.ctx.createGain(); g.gain.value = 0;
    n.head.connect(g); g.connect(TL.master); n.src.start();
    var t = TL.ctx.currentTime; g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(v * 0.5, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0008, t + dur);
    stop(n.src, g, dur + 0.1);
  }
  function Ride(v) {
    var n = noise(0.8, 'bandpass', 6000, 3); var g = TL.ctx.createGain(); g.gain.value = 0;
    n.head.connect(g); g.connect(TL.master); n.src.start();
    var o = tone('square', 600); var og = TL.ctx.createGain(); og.gain.value = 0;
    o.connect(og); og.connect(TL.master); o.start();
    env(g, v * 0.3, 0.8); env(og, v * 0.1, 0.5);
    stop(n.src, g, 0.9); stop(o, og, 0.6);
  }
  function Clap(v) {
    var t = TL.ctx.currentTime;
    for (var k = 0; k < 3; k++) {
      var n = noise(0.12, 'bandpass', 1500, 2); var g = TL.ctx.createGain(); g.gain.value = 0;
      n.head.connect(g); g.connect(TL.master); n.src.start();
      var st = t + k * 0.012;
      g.gain.setValueAtTime(0, st); g.gain.linearRampToValueAtTime(v * 0.5, st + 0.001);
      g.gain.exponentialRampToValueAtTime(0.0008, st + 0.1);
      stop(n.src, g, 0.13);
    }
  }
  function Cowbell(v) {
    var o1 = tone('square', 540), o2 = tone('square', 800); var g = TL.ctx.createGain(); g.gain.value = 0;
    o1.connect(g); o2.connect(g); g.connect(TL.master); o1.start(); o2.start(); env(g, v * 0.3, 0.3);
    stop(o1, g, 0.35); stop(o2, null, 0.35);
  }
  function Wood(freq, v) {
    var o = tone('square', freq); var g = TL.ctx.createGain(); g.gain.value = 0;
    o.connect(g); g.connect(TL.master); o.start(); env(g, v * 0.4, 0.08); stop(o, g, 0.1);
  }
  function Conga(freq, v) {
    var o = tone('sine', freq); var g = TL.ctx.createGain(); g.gain.value = 0;
    o.connect(g); g.connect(TL.master); o.start(); env(g, v * 0.5, 0.25); stop(o, g, 0.3);
  }
  function Fallback(v) {
    var n = noise(0.08, 'highpass', 2000); var g = TL.ctx.createGain(); g.gain.value = 0;
    n.head.connect(g); g.connect(TL.master); n.src.start(); env(g, v * 0.3, 0.08); stop(n.src, g, 0.1);
  }

  function stop(src, gain, dur) {
    setTimeout(function () { try { src.stop(); } catch (e) {} if (gain) try { gain.disconnect(); } catch (e) {} }, dur * 1000 + 60);
  }

  // GM standard percussion note map (subset; rest hit Fallback so nothing is silent)
  var MAP = {
    35: Kick, 36: Kick, 37: function (v) { Wood(800, v); }, // sidestick-ish
    38: Snare, 40: Snare,
    41: function (v) { Tom(v, 90); }, 42: function (v) { Hat(v, 0.05, 7000); },  // closed
    43: function (v) { Tom(v, 70); }, 44: function (v) { Hat(v, 0.05, 7000); },  // pedal
    45: function (v) { Tom(v, 110); }, 46: function (v) { Hat(v, 0.4, 7000); },  // open
    47: function (v) { Tom(v, 150); }, 48: function (v) { Tom(v, 180); },
    49: function (v) { Cymbal(v, 1.2); }, 50: function (v) { Tom(v, 220); },  // high
    51: Ride, 52: function (v) { Cymbal(v, 0.8); }, 53: function (v) { Cymbal(v, 0.6); },
    54: function (v) { Cowbell(v); }, 55: function (v) { Cowbell(v); }, 56: Cowbell,
    57: function (v) { Cymbal(v, 1.5); }, 58: function (v) { Wood(800, v); },  // vibraslap-ish
    60: function (v) { Conga(180, v); }, 61: function (v) { Conga(150, v); }, // hi bongo
    62: function (v) { Conga(130, v); }, 63: function (v) { Conga(200, v); }, // open conga
    64: function (v) { Conga(160, v); }, 65: function (v) { Conga(110, v); }, // low timbale
    66: function (v) { Conga(90, v); }, 67: function (v) { Conga(220, v); },
    68: function (v) { Conga(180, v); }, 69: function (v) { Conga(140, v); },
    70: function (v) { Wood(600, v); }, 71: function (v) { Wood(700, v); },  // maraca-ish (short)
    72: function (v) { Wood(750, v); }, 73: function (v) { Wood(820, v); },
    74: function (v) { Wood(660, v); }, 75: function (v) { Wood(700, v); },
    76: function (v) { Wood(800, v); }, 77: function (v) { Wood(600, v); },  // woodblocks
    78: function (v) { Wood(900, v); }, 79: function (v) { Wood(1000, v); }, // cuica-ish
    80: function (v) { Wood(1200, v); }, 81: function (v) { Cymbal(v, 0.3); },
    39: Clap
  };

  function play(note, velocity) {
    TL.resume();
    var v = vel(velocity);
    var fn = MAP[note] || Fallback;
    try { fn(v); } catch (e) { console.warn('drum', note, e); Fallback(v); }
  }

  window.Drums = { play: play };

  // SELF-CHECK: build a handful of drum voices; ensure no throw.
  (function () {
    var ok = true, log = function (m) { console.log('[drums] ' + m); };
    var test = [35, 38, 42, 46, 41, 49, 51, 39, 56, 76, 99];
    for (var i = 0; i < test.length; i++) {
      try { play(test[i], 100); } catch (e) { ok = false; log('FAIL note ' + test[i] + ': ' + e.message); break; }
    }
    if (ok) log('SELF-CHECK PASS (' + test.length + ' drum voices)');
  })();
})();
