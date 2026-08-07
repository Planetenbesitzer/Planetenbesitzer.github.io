/* midi/gm/programs.js — GM program names, families, and engine/params table.
   Pure data. Engine names are resolved by midi/gm/engines.js. */
(function () {
  var PROGRAM_NAMES = [
    // 0-7 Piano
    'Acoustic Grand Piano','Bright Acoustic Piano','Electric Grand Piano','Honky-tonk Piano',
    'Electric Piano 1','Electric Piano 2','Harpsichord','Clavinet',
    // 8-15 Chromatic Percussion
    'Celesta','Glockenspiel','Music Box','Vibraphone','Marimba','Xylophone','Tubular Bells','Dulcimer',
    // 16-23 Organ
    'Drawbar Organ','Percussive Organ','Rock Organ','Church Organ','Reed Organ','Accordion','Harmonica','Tango Accordion',
    // 24-31 Guitar
    'Acoustic Guitar (nylon)','Acoustic Guitar (steel)','Electric Guitar (jazz)','Electric Guitar (clean)',
    'Electric Guitar (muted)','Overdriven Guitar','Distortion Guitar','Guitar harmonics',
    // 32-39 Bass
    'Acoustic Bass','Electric Bass (finger)','Electric Bass (pick)','Fretless Bass',
    'Slap Bass 1','Slap Bass 2','Synth Bass 1','Synth Bass 2',
    // 40-47 Strings
    'Violin','Viola','Cello','Contrabass','Tremolo Strings','Pizzicato Strings','Orchestral Harp','Timpani',
    // 48-55 Ensemble
    'String Ensemble 1','String Ensemble 2','Synth Strings 1','Synth Strings 2','Choir Aahs','Voice Oohs','Synth Voice','Orchestra Hit',
    // 56-63 Brass
    'Trumpet','Trombone','Tuba','Muted Trumpet','French Horns','Brass Section','Synth Brass 1','Synth Brass 2',
    // 64-71 Reed
    'Soprano Sax','Alto Sax','Tenor Sax','Baritone Sax','Oboe','English Horn','Bassoon','Clarinet',
    // 72-79 Pipe (Flute)
    'Piccolo','Flute','Recorder','Pan Flute','Blown Bottle','Shakuhachi','Whistle','Ocarina',
    // 80-87 Synth Lead
    'Lead 1 (square)','Lead 2 (sawtooth)','Lead 3 (calliope)','Lead 4 (chiff)','Lead 5 (charang)','Lead 6 (voice)','Lead 7 (fifths)','Lead 8 (bass+lead)',
    // 88-95 Synth Pad
    'Pad 1 (new age)','Pad 2 (warm)','Pad 3 (polysynth)','Pad 4 (choir)','Pad 5 (bowed)','Pad 6 (metallic)','Pad 7 (halo)','Pad 8 (sweep)',
    // 96-103 Synth Effects
    'FX 1 (rain)','FX 2 (soundtrack)','FX 3 (crystal)','FX 4 (atmosphere)','FX 5 (brightness)','FX 6 (goblins)','FX 7 (echoes)','FX 8 (sci-fi)',
    // 104-111 Ethnic
    'Sitar','Banjo','Shamisen','Koto','Kalimba','Bag pipe','Fiddle','Shanai',
    // 112-119 Percussive
    'Tinkle Bell','Agogo','Steel Drums','Woodblock','Taiko Drum','Melodic Tom','Synth Drum','Reverse Cymbal',
    // 120-127 Sound effects
    'Guitar Fret Noise','Breath Noise','Seashore','Bird Tweet','Telephone Ring','Helicopter','Applause','Gun Shot'
  ];

  var FAMILIES = [
    { name: 'Piano', range: [0, 7] },
    { name: 'Chromatic Percussion', range: [8, 15] },
    { name: 'Organ', range: [16, 23] },
    { name: 'Guitar', range: [24, 31] },
    { name: 'Bass', range: [32, 39] },
    { name: 'Strings', range: [40, 47] },
    { name: 'Ensemble', range: [48, 55] },
    { name: 'Brass', range: [56, 63] },
    { name: 'Reed', range: [64, 71] },
    { name: 'Pipe (Flute)', range: [72, 79] },
    { name: 'Synth Lead', range: [80, 87] },
    { name: 'Synth Pad', range: [88, 95] },
    { name: 'Synth Effects', range: [96, 103] },
    { name: 'Ethnic', range: [104, 111] },
    { name: 'Percussive', range: [112, 119] },
    { name: 'Sound Effects', range: [120, 127] }
  ];

  var TABLE = new Array(128);
  function set(i, engine, params) { TABLE[i] = { engine: engine, params: params || {} }; }

  // ---- Piano (0-7) ----
  set(0, 'piano', { partials: 'piano8', bright: 1.0, decay: 1.0 });
  set(1, 'piano', { partials: 'piano8', bright: 1.4, decay: 0.95 });
  set(2, 'piano', { partials: 'piano8', tine: true, decay: 0.9 });
  set(3, 'piano', { partials: 'piano8', detune: 1.4, decay: 0.85 });
  set(4, 'piano', { partials: 'ep1', decay: 0.9 });
  set(5, 'piano', { partials: 'ep2', decay: 0.95 });
  set(6, 'piano', { partials: 'harpsichord', decay: 0.55, click: true });
  set(7, 'piano', { partials: 'clavinet', wave: 'sawtooth', decay: 0.6 });
  // ---- Chromatic Percussion (8-15) ----
  set(8, 'piano', { partials: 'celesta', decay: 1.2, bright: 1.2 });
  set(9, 'piano', { partials: 'bell', decay: 2.2, bright: 1.6 });
  set(10, 'piano', { partials: 'musicbox', decay: 0.9, bright: 1.3 });
  set(11, 'piano', { partials: 'vibes', decay: 1.6, tremolo: true });
  set(12, 'piano', { partials: 'marimba', decay: 0.5 });
  set(13, 'piano', { partials: 'xylophone', decay: 0.35, click: true, bright: 1.5 });
  set(14, 'piano', { partials: 'tubular', decay: 2.5, inharmonic: true });
  set(15, 'piano', { partials: 'dulcimer', decay: 0.7, click: true });
  // ---- Organ (16-23) ----
  set(16, 'organ', { drawbars: [1, 2, 3, 4, 6, 8], decay: 0, sustain: true });
  set(17, 'organ', { drawbars: [1, 2, 3], decay: 0.6, sustain: false, perc: true });
  set(18, 'organ', { drawbars: [1, 2, 4, 8], decay: 0, sustain: true, bright: 1.3 });
  set(19, 'organ', { drawbars: [1, 2, 3, 4, 6, 8, 12], decay: 0, sustain: true, slow: true });
  set(20, 'organ', { drawbars: [1, 2, 3, 4], decay: 0, sustain: true, wave: 'sawtooth', bright: 0.8 });
  set(21, 'organ', { drawbars: [1, 2, 3], decay: 0, sustain: true, detune: 6 });
  set(22, 'organ', { drawbars: [1, 2], decay: 0, sustain: true, wave: 'sawtooth' });
  set(23, 'organ', { drawbars: [1, 2, 3, 4, 6], decay: 0, sustain: true, detune: 4 });
  // ---- Guitar (24-31) ----
  set(24, 'guitar', { wave: 'triangle', decay: 0.8, cutoff: 1800, bright: 0.7 });
  set(25, 'guitar', { wave: 'sawtooth', decay: 0.7, cutoff: 2600, bright: 1.0 });
  set(26, 'guitar', { wave: 'sawtooth', decay: 0.7, cutoff: 3000, bright: 1.1 });
  set(27, 'guitar', { wave: 'sawtooth', decay: 0.7, cutoff: 3200, bright: 1.2 });
  set(28, 'guitar', { wave: 'sawtooth', decay: 0.25, cutoff: 1600, bright: 0.6, muted: true });
  set(29, 'guitar', { wave: 'sawtooth', decay: 0.6, shape: 0.4, cutoff: 4000 });
  set(30, 'guitar', { wave: 'sawtooth', decay: 0.6, shape: 1.0, cutoff: 4000 });
  set(31, 'guitar', { wave: 'sine', decay: 1.0, partials: 'harm', bright: 1.4 });
  // ---- Bass (32-39) ---- (boosted: low register reads quieter, +gain to cut through)
  set(32, 'bass', { wave: 'triangle', decay: 0.6, cutoff: 1200, gain: 1.6 });
  set(33, 'bass', { wave: 'sawtooth', decay: 0.5, cutoff: 1400, gain: 1.6 });
  set(34, 'bass', { wave: 'sawtooth', decay: 0.4, cutoff: 2000, bright: 1.3, gain: 1.6 });
  set(35, 'bass', { wave: 'sine', decay: 0.7, cutoff: 900, glide: true, gain: 1.7 });
  set(36, 'bass', { wave: 'sawtooth', decay: 0.3, cutoff: 1800, click: true, gain: 1.6 });
  set(37, 'bass', { wave: 'square', decay: 0.3, cutoff: 1600, click: true, gain: 1.5 });
  set(38, 'bass', { wave: 'sawtooth', decay: 0.5, cutoff: 1200, sustain: true, gain: 1.6 });
  set(39, 'bass', { wave: 'square', decay: 0.5, cutoff: 1200, sustain: true, gain: 1.5 });
  // ---- Strings (40-47) ----
  set(40, 'strings', { wave: 'sawtooth', attack: 0.12, decay: 0.0, sustain: true, cutoff: 3000, vibrato: true });
  set(41, 'strings', { wave: 'sawtooth', attack: 0.14, sustain: true, cutoff: 2200, vibrato: true, low: true });
  set(42, 'strings', { wave: 'sawtooth', attack: 0.16, sustain: true, cutoff: 1800, vibrato: true, low: true });
  set(43, 'strings', { wave: 'sawtooth', attack: 0.18, sustain: true, cutoff: 1400, vibrato: true, low: true });
  set(44, 'strings', { wave: 'sawtooth', attack: 0.06, sustain: true, cutoff: 2600, tremolo: true });
  set(45, 'strings', { wave: 'triangle', decay: 0.35, cutoff: 2600, pluck: true });
  set(46, 'strings', { wave: 'triangle', decay: 1.2, partials: 'harp' });
  set(47, 'piano', { partials: 'timpani', decay: 1.4, low: true });
  // ---- Ensemble (48-55) ----
  set(48, 'ensemble', { oscs: 3, wave: 'sawtooth', attack: 0.2, sustain: true, cutoff: 2800, detune: 7 });
  set(49, 'ensemble', { oscs: 4, wave: 'sawtooth', attack: 0.22, sustain: true, cutoff: 2400, detune: 8 });
  set(50, 'ensemble', { oscs: 3, wave: 'sawtooth', attack: 0.18, sustain: true, cutoff: 3000, detune: 6 });
  set(51, 'ensemble', { oscs: 4, wave: 'sawtooth', attack: 0.2, sustain: true, cutoff: 2600, detune: 9 });
  set(52, 'ensemble', { oscs: 3, wave: 'sawtooth', attack: 0.25, sustain: true, cutoff: 3200, detune: 6, formant: true });
  set(53, 'ensemble', { oscs: 3, wave: 'sawtooth', attack: 0.25, sustain: true, cutoff: 2800, detune: 6, formant: true });
  set(54, 'ensemble', { oscs: 3, wave: 'sawtooth', attack: 0.25, sustain: true, cutoff: 2600, detune: 6, formant: true });
  set(55, 'ensemble', { oscs: 5, wave: 'sawtooth', decay: 0.5, cutoff: 2200, detune: 10, hit: true });
  // ---- Brass (56-63) ----
  set(56, 'brass', { wave: 'sawtooth', attack: 0.05, sustain: true, cutoff: 2600, bright: 1.2 });
  set(57, 'brass', { wave: 'sawtooth', attack: 0.06, sustain: true, cutoff: 2200, bright: 1.0, low: true });
  set(58, 'brass', { wave: 'sawtooth', attack: 0.08, sustain: true, cutoff: 1600, bright: 0.8, low: true });
  set(59, 'brass', { wave: 'sawtooth', attack: 0.05, sustain: true, cutoff: 1800, bright: 0.7, muted: true });
  set(60, 'brass', { wave: 'sawtooth', attack: 0.1, sustain: true, cutoff: 2000, bright: 0.9, low: true });
  set(61, 'brass', { oscs: 2, wave: 'sawtooth', attack: 0.08, sustain: true, cutoff: 2400, detune: 8 });
  set(62, 'brass', { oscs: 2, wave: 'sawtooth', attack: 0.06, sustain: true, cutoff: 2600, detune: 6 });
  set(63, 'brass', { oscs: 2, wave: 'sawtooth', attack: 0.07, sustain: true, cutoff: 2200, detune: 9 });
  // ---- Reed (64-71) ----
  set(64, 'reed', { wave: 'sawtooth', attack: 0.04, sustain: true, cutoff: 2800, bright: 1.3, vibrato: true });
  set(65, 'reed', { wave: 'sawtooth', attack: 0.04, sustain: true, cutoff: 2600, bright: 1.1, vibrato: true });
  set(66, 'reed', { wave: 'sawtooth', attack: 0.04, sustain: true, cutoff: 2400, bright: 1.0, vibrato: true });
  set(67, 'reed', { wave: 'sawtooth', attack: 0.05, sustain: true, cutoff: 2000, bright: 0.8, vibrato: true, low: true });
  set(68, 'reed', { wave: 'square', attack: 0.03, sustain: true, cutoff: 2400, bright: 1.3 });
  set(69, 'reed', { wave: 'square', attack: 0.04, sustain: true, cutoff: 2000, bright: 1.0 });
  set(70, 'reed', { wave: 'sawtooth', attack: 0.05, sustain: true, cutoff: 1500, bright: 0.7, low: true });
  set(71, 'reed', { wave: 'square', attack: 0.03, sustain: true, cutoff: 2200, bright: 1.0, hollow: true });
  // ---- Pipe / Flute (72-79) ----
  set(72, 'pipe', { wave: 'sine', attack: 0.04, sustain: true, breath: true, vibrato: true, high: true });
  set(73, 'pipe', { wave: 'sine', attack: 0.06, sustain: true, breath: true, vibrato: true });
  set(74, 'pipe', { wave: 'triangle', attack: 0.04, sustain: true, breath: true, vibrato: true });
  set(75, 'pipe', { wave: 'sine', attack: 0.08, sustain: true, breath: true, vibrato: true });
  set(76, 'pipe', { wave: 'sine', attack: 0.1, sustain: true, breath: true });
  set(77, 'pipe', { wave: 'sine', attack: 0.12, sustain: true, breath: true, vibrato: true });
  set(78, 'pipe', { wave: 'sine', attack: 0.04, sustain: true, breath: true });
  set(79, 'pipe', { wave: 'sine', attack: 0.06, sustain: true, breath: true, vibrato: true });
  // ---- Synth Lead (80-87) ----
  set(80, 'lead', { wave: 'square', attack: 0.005, sustain: true, cutoff: 3000, q: 4 });
  set(81, 'lead', { wave: 'sawtooth', attack: 0.005, sustain: true, cutoff: 2800, q: 3 });
  set(82, 'lead', { partials: 'calliope', attack: 0.005, sustain: true });
  set(83, 'lead', { wave: 'sawtooth', attack: 0.005, sustain: true, cutoff: 3200, q: 2, bright: 1.3 });
  set(84, 'lead', { wave: 'sawtooth', attack: 0.005, sustain: true, cutoff: 2600, q: 5, shape: 0.2 });
  set(85, 'lead', { oscs: 2, wave: 'sawtooth', attack: 0.01, sustain: true, cutoff: 2400, detune: 8, formant: true });
  set(86, 'lead', { oscs: 2, wave: 'sawtooth', attack: 0.005, sustain: true, cutoff: 3000, detune: 7, fifth: true });
  set(87, 'lead', { oscs: 2, wave: 'sawtooth', attack: 0.005, sustain: true, cutoff: 2200, detune: 6, low: true });
  // ---- Synth Pad (88-95) ----
  set(88, 'pad', { oscs: 3, wave: 'sawtooth', attack: 0.4, sustain: true, cutoff: 2400, detune: 7, sweep: 0.6 });
  set(89, 'pad', { oscs: 3, wave: 'sawtooth', attack: 0.3, sustain: true, cutoff: 2000, detune: 6, sweep: 0.4 });
  set(90, 'pad', { oscs: 4, wave: 'sawtooth', attack: 0.25, sustain: true, cutoff: 2600, detune: 8, sweep: 0.5 });
  set(91, 'pad', { oscs: 3, wave: 'sawtooth', attack: 0.4, sustain: true, cutoff: 2200, detune: 6, sweep: 0.3, formant: true });
  set(92, 'pad', { oscs: 3, wave: 'sawtooth', attack: 0.5, sustain: true, cutoff: 1800, detune: 5, sweep: 0.3 });
  set(93, 'pad', { oscs: 4, wave: 'square', attack: 0.4, sustain: true, cutoff: 3000, detune: 9, sweep: 0.5 });
  set(94, 'pad', { oscs: 3, wave: 'sawtooth', attack: 0.5, sustain: true, cutoff: 2600, detune: 6, sweep: 0.7 });
  set(95, 'pad', { oscs: 4, wave: 'sawtooth', attack: 0.4, sustain: true, cutoff: 2400, detune: 8, sweep: 1.0 });
  // ---- Synth Effects (96-103) — approximations ----
  set(96, 'fx', { kind: 'noise', color: 'hpf', decay: 1.5 });
  set(97, 'fx', { kind: 'noise', color: 'lpf', decay: 1.8 });
  set(98, 'fx', { partials: 'bell', decay: 2.0, bright: 1.6 });
  set(99, 'fx', { oscs: 2, wave: 'sawtooth', attack: 0.6, sustain: true, cutoff: 1600, detune: 10, sweep: 0.8 });
  set(100, 'fx', { oscs: 3, wave: 'sawtooth', attack: 0.1, sustain: true, cutoff: 3600, detune: 8, sweep: 0.5, bright: 1.4 });
  set(101, 'fx', { oscs: 2, wave: 'square', attack: 0.05, sustain: true, cutoff: 1800, detune: 14, pitch: true });
  set(102, 'fx', { kind: 'noise', color: 'hpf', decay: 1.0, sweep: true });
  set(103, 'fx', { oscs: 2, wave: 'sawtooth', attack: 0.01, sustain: true, cutoff: 2000, detune: 20, sweep: 1.2 });
  // ---- Ethnic (104-111) — approximations ----
  set(104, 'strings', { wave: 'sawtooth', attack: 0.02, decay: 0.6, cutoff: 3000, detune: 12, buzz: true });
  set(105, 'guitar', { wave: 'sawtooth', decay: 0.5, cutoff: 2600, bright: 1.2 });
  set(106, 'guitar', { wave: 'sawtooth', decay: 0.5, cutoff: 2400, bright: 1.0 });
  set(107, 'guitar', { wave: 'sawtooth', decay: 0.8, cutoff: 2600, detune: 8 });
  set(108, 'piano', { partials: 'marimba', decay: 0.6, bright: 1.1 });
  set(109, 'reed', { wave: 'sawtooth', attack: 0.05, sustain: true, cutoff: 1800, detune: 4, drone: true });
  set(110, 'strings', { wave: 'sawtooth', attack: 0.05, decay: 0.3, cutoff: 2800, bright: 1.2 });
  set(111, 'reed', { wave: 'square', attack: 0.03, sustain: true, cutoff: 2000, bright: 1.2, buzz: true });
  // ---- Percussive (112-119) ----
  set(112, 'piano', { partials: 'bell', decay: 1.2, bright: 1.6 });
  set(113, 'piano', { partials: 'bell', decay: 0.8, bright: 1.4 });
  set(114, 'piano', { partials: 'marimba', decay: 0.6, bright: 1.2 });
  set(115, 'piano', { partials: 'xylophone', decay: 0.3, click: true, bright: 1.4 });
  set(116, 'piano', { partials: 'timpani', decay: 1.0, low: true });
  set(117, 'piano', { partials: 'timpani', decay: 0.6 });
  set(118, 'fx', { kind: 'noise', color: 'bpf', decay: 0.4, pitch: true });
  set(119, 'fx', { kind: 'noise', color: 'hpf', decay: 1.5, reverse: true });
  // ---- Sound effects (120-127) — approximations ----
  set(120, 'fx', { kind: 'noise', color: 'bpf', decay: 0.15 });
  set(121, 'fx', { kind: 'noise', color: 'bpf', decay: 0.3, freq: 1200 });
  set(122, 'fx', { kind: 'noise', color: 'lpf', decay: 2.0 });
  set(123, 'fx', { kind: 'noise', color: 'bpf', decay: 0.4, freq: 4000, sweep: true });
  set(124, 'fx', { kind: 'tone', wave: 'square', decay: 0.6, freq: 440 });
  set(125, 'fx', { kind: 'noise', color: 'lpf', decay: 1.5, mod: true });
  set(126, 'fx', { kind: 'noise', color: 'lpf', decay: 1.2 });
  set(127, 'fx', { kind: 'noise', color: 'bpf', decay: 0.25, freq: 200 });

  window.GM = { PROGRAM_NAMES: PROGRAM_NAMES, FAMILIES: FAMILIES, TABLE: TABLE };

  // SELF-CHECK
  (function () {
    var ok = true, log = function (m) { console.log('[programs] ' + m); };
    if (PROGRAM_NAMES.length !== 128) { ok = false; log('FAIL names length ' + PROGRAM_NAMES.length); }
    if (FAMILIES.length !== 16) { ok = false; log('FAIL families length ' + FAMILIES.length); }
    if (TABLE[0].engine !== 'piano') { ok = false; log('FAIL table[0]'); }
    for (var i = 0; i < 128; i++) {
      if (!TABLE[i] || !TABLE[i].engine) { ok = false; log('FAIL table[' + i + '] unset'); break; }
      if (!PROGRAM_NAMES[i]) { ok = false; log('FAIL name[' + i + ']'); break; }
    }
    if (ok) log('SELF-CHECK PASS');
  })();
})();
