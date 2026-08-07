/* shared/audio-core.js — TL namespace: shared AudioContext + helpers.
   Reusable across pages (midi.html / piano.html / index.html could adopt later).
   Classic script (NOT an ES module) so file:// double-click works. */
(function () {
  var Ctx = window.AudioContext || window.webkitAudioContext;
  var ctx = new Ctx();
  var master = ctx.createGain(); master.gain.value = 0.85;
  var comp = ctx.createDynamicsCompressor();
  comp.threshold.value = -14; comp.knee.value = 24; comp.ratio.value = 4;
  comp.attack.value = 0.003; comp.release.value = 0.12;
  master.connect(comp); comp.connect(ctx.destination);   // dry path

  // Chorus send — CC93 "Effects 3 Depth" is the GM-standard meaning of CC93.
  // master -> LFO-modulated delay -> wetGain -> comp. wetGain=0 = pure dry.
  var chorusDelay = ctx.createDelay(0.1); chorusDelay.delayTime.value = 0.025;
  var chorusLfo = ctx.createOscillator(); chorusLfo.type = 'sine'; chorusLfo.frequency.value = 0.9;
  var chorusLfoGain = ctx.createGain(); chorusLfoGain.gain.value = 0.004;   // ±4 ms
  chorusLfo.connect(chorusLfoGain); chorusLfoGain.connect(chorusDelay.delayTime); chorusLfo.start();
  var chorusWet = ctx.createGain(); chorusWet.gain.value = 0;
  master.connect(chorusDelay); chorusDelay.connect(chorusWet); chorusWet.connect(comp);
  function setChorus(amount) { chorusWet.gain.value = Math.max(0, Math.min(1, amount)) * 0.5; }

  // Reverb send — CC91 "Effects 1 (Reverb) depth". Convolver with a synthetic
  // decaying-noise impulse response. master -> convolver -> wetGain -> comp.
  function makeIR(dur, decay) {
    var n = Math.floor(ctx.sampleRate * dur);
    var b = ctx.createBuffer(2, n, ctx.sampleRate);
    for (var cidx = 0; cidx < 2; cidx++) {
      var d = b.getChannelData(cidx);
      for (var i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, decay);
    }
    return b;
  }
  var reverb = ctx.createConvolver(); reverb.buffer = makeIR(1.8, 2.2);
  var reverbWet = ctx.createGain(); reverbWet.gain.value = 0;
  master.connect(reverb); reverb.connect(reverbWet); reverbWet.connect(comp);
  function setReverb(amount) { reverbWet.gain.value = Math.max(0, Math.min(1, amount)) * 0.4; }

  var NOTE_NAMES = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
  var MIDI_START = 21, MIDI_END = 108;          // A0 ~ C8

  function midiToFreq(m) { return 440 * Math.pow(2, (m - 69) / 12); }
  function noteLabel(m) {
    var n = NOTE_NAMES[((m % 12) + 12) % 12];
    var oct = Math.floor(m / 12) - 1;
    return n + oct;
  }

  // per-channel bus cache: gain (CC7) + stereo panner (CC10), connected to master
  var buses = new Array(16);
  function nowChannel(ch) {
    ch = ((ch % 16) + 16) % 16;
    if (buses[ch]) return buses[ch];
    var gain = ctx.createGain(); gain.gain.value = 1.0;
    // CC74 (Brightness) = lowpass cutoff; CC71 (Harmonic Content) = resonance.
    // GM defaults 64 = neutral pass-through (no filtering).
    var filter = ctx.createBiquadFilter(); filter.type = 'lowpass';
    filter.frequency.value = 20000; filter.Q.value = 0;
    gain.connect(filter);
    var panner = (typeof ctx.createStereoPanner === 'function') ? ctx.createStereoPanner() : null;
    var tail = filter;
    if (panner) { filter.connect(panner); tail = panner; }
    tail.connect(master);
    function cutoffFor(v) { v = Math.max(0, Math.min(127, v)); return v >= 64 ? 20000 : 150 * Math.pow(20000 / 150, v / 64); }
    function qFor(v) { v = Math.max(0, Math.min(127, v)); return v <= 64 ? 0 : ((v - 64) / 63) * 12; }
    buses[ch] = {
      gain: gain, panner: panner, filter: filter,
      setVolume: function (v) { gain.gain.value = v; },     // v already a 0..~1 gain
      setPan: function (p) { if (panner) panner.pan.value = p; }, // p in [-1,1]
      setBrightness: function (cc) { filter.frequency.value = cutoffFor(cc); },
      setResonance: function (cc) { filter.Q.value = qFor(cc); }
    };
    return buses[ch];
  }

  function resume() { if (ctx.state === 'suspended') ctx.resume(); }

  window.TL = {
    ctx: ctx, master: master, comp: comp,
    NOTE_NAMES: NOTE_NAMES, MIDI_START: MIDI_START, MIDI_END: MIDI_END,
    midiToFreq: midiToFreq, noteLabel: noteLabel,
    nowChannel: nowChannel, resume: resume, setChorus: setChorus, setReverb: setReverb
  };

  // SELF-CHECK (dev): assert invariants on load. Harmless in production.
  (function selfCheck() {
    var ok = true, log = function (m) { console.log('[audio-core] ' + m); };
    if (midiToFreq(69) !== 440) { ok = false; log('FAIL midiToFreq(69)=' + midiToFreq(69)); }
    if (noteLabel(60) !== 'C4') { ok = false; log('FAIL noteLabel(60)=' + noteLabel(60)); }
    if (noteLabel(21) !== 'A0' || noteLabel(108) !== 'C8') { ok = false; log('FAIL range labels'); }
    var b = nowChannel(0); if (!b.gain || typeof b.setVolume !== 'function') { ok = false; log('FAIL bus'); }
    if (nowChannel(0) !== b) { ok = false; log('FAIL bus cache'); }
    if (ok) log('SELF-CHECK PASS');
  })();
})();
