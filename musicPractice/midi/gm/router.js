/* midi/gm/router.js — MIDI message router + 16-channel state.
   Depends on Engines, Drums, TL. Host (midiplus.html) sets onLog/onProgramChange/onNote. */
(function () {
  var NOTE_NAMES = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
  function label(m) { var n = NOTE_NAMES[((m % 12) + 12) % 12]; return n + (Math.floor(m / 12) - 1); }

  var channels = [];
  for (var i = 0; i < 16; i++) channels.push({ program: 0, volume: 100, pan: 0.5, sustain: false, pitchBend: 0, pending: [] });

  // callbacks (host overrides)
  var onLog = function () {}, onProgramChange = function () {}, onNote = function () {}, onTransport = function () {};

  function progName(p) { return (window.GM && GM.PROGRAM_NAMES) ? GM.PROGRAM_NAMES[p] : ('Program ' + p); }

  function setProgram(ch, prog) {
    ch = ch & 15; if (ch === 9) { onProgramChange(ch, prog, 'Drum Kit'); return; } // ch10 fixed
    prog = Math.max(0, Math.min(127, prog | 0));
    channels[ch].program = prog;
    if (TL && TL.nowChannel) TL.nowChannel(ch); // ensure bus exists
    onProgramChange(ch, prog, progName(prog));
  }
  function setVolume(ch, cc7) {
    ch = ch & 15; cc7 = Math.max(0, Math.min(127, cc7 | 0)); channels[ch].volume = cc7;
    var g = cc7 / 127; // linear-ish; tune if needed
    if (TL.nowChannel) TL.nowChannel(ch).setVolume(g);
  }
  function setPan(ch, cc10) {
    ch = ch & 15; cc10 = Math.max(0, Math.min(127, cc10 | 0)); channels[ch].pan = cc10 / 127;
    if (TL.nowChannel) TL.nowChannel(ch).setPan((cc10 / 127) * 2 - 1);
  }
  function setSustain(ch, bool) {
    ch = ch & 15; var prev = channels[ch].sustain; channels[ch].sustain = !!bool;
    if (prev && !channels[ch].sustain) {
      // pedal release: kill queued notes
      channels[ch].pending.forEach(function (m) { Engines.release(ch, m); });
      channels[ch].pending = [];
    }
  }
  function setPitchBend(ch, val) { // val -8192..8191
    ch = ch & 15; channels[ch].pitchBend = val;
    var cents = (val / 8192) * 200; // ±2 semitones
    Engines.setDetune(ch, cents);
  }
  function noteOn(ch, midi, vel) {
    ch = ch & 15;
    if (ch === 9) { Drums.play(midi, vel); onNote(midi, true); return; }
    Engines.play(ch, midi, vel); onNote(midi, true);
  }
  function noteOff(ch, midi) {
    ch = ch & 15;
    if (ch === 9) { onNote(midi, false); return; }
    if (channels[ch].sustain) { channels[ch].pending.push(midi); }
    else { Engines.release(ch, midi); }
    onNote(midi, false);
  }
  function killChannel(ch) { Engines.killAll(ch); }

  function handleMessage(data) {
    if (!data || data.length === 0) return;
    var hex = Array.prototype.map.call(data, function (b) { return ('0' + b.toString(16)).slice(-2); }).join(' ');
    if (data.length === 1) {                       // System Real-Time / Common (single byte)
      var b = data[0];
      if (b === 0xFA) onLog('[Transport] Start    fa');
      else if (b === 0xFB) onLog('[Transport] Continue fb');
      else if (b === 0xFC) onLog('[Transport] Stop     fc');
      else if (b === 0xF8 || b === 0xFE || b === 0xFF) { /* clock / active-sensing / reset: ignore (high-rate) */ }
      else onLog('[Other]    ' + hex);
      return;
    }
    var status = data[0] & 0xf0, ch = (data[0] & 0x0f), d1 = data[1], d2 = data.length > 2 ? data[2] : 0;
    if (data[0] === 0xF0) {                       // System Exclusive — needs sysex:true
      // MIDI Machine Control: F0 7F <dev> 06 <cmd> [F7] (F7=0xF7)
      if (data.length >= 5 && data[1] === 0x7F && data[3] === 0x06) {
        var cmd = data[4];
        var MMC = { 0x01:'Stop', 0x02:'Play', 0x03:'Play(deferred)', 0x06:'Record',
          0x07:'Record off', 0x09:'Pause', 0x0A:'Resume(Play)', 0x0B:'Chase',
          0x40:'Punch In', 0x41:'Punch Out', 0x7F:'Reset' };
        var mmcLabel = MMC[cmd] || ('cmd ' + cmd);
        onLog('[MMC] ' + mmcLabel + '   ' + hex);
        if (onTransport) onTransport(mmcLabel);
      } else {
        onLog('[SysEx] ' + (hex.length > 48 ? hex.slice(0, 48) + ' …(' + data.length + 'B)' : hex));
      }
      return;
    }
    if (status === 0x90 && d2 > 0) { noteOn(ch, d1, d2); onLog('[Note On]  ' + hex + '  ch' + (ch + 1) + '  ' + label(d1) + (ch === 9 ? '  (drum)' : '') + '  vel=' + d2); }
    else if (status === 0x80 || (status === 0x90 && d2 === 0)) { noteOff(ch, d1); onLog('[Note Off] ' + hex + '  ch' + (ch + 1) + '  ' + label(d1)); }
    else if (status === 0xC0) { setProgram(ch, d1); onLog('[Program]  ' + hex + '  ch' + (ch + 1) + ' -> ' + progName(d1)); }
    else if (status === 0xB0) {
      if (d1 === 7) { setVolume(ch, d2); onLog('[CC7 vol]  ' + hex + '  ch' + (ch + 1) + '=' + d2); }
      else if (d1 === 10) { setPan(ch, d2); onLog('[CC10 pan] ' + hex + '  ch' + (ch + 1) + '=' + d2); }
      else if (d1 === 64) { setSustain(ch, d2 >= 64); onLog('[CC64 sus]  ' + hex + '  ch' + (ch + 1) + '=' + (d2 >= 64 ? 'on' : 'off')); }
      else if (d1 === 74) { if (TL && TL.nowChannel) TL.nowChannel(ch).setBrightness(d2); onLog('[CC74 bright] ' + hex + '  ch' + (ch + 1) + '=' + d2); }
      else if (d1 === 71) { if (TL && TL.nowChannel) TL.nowChannel(ch).setResonance(d2); onLog('[CC71 harm]  ' + hex + '  ch' + (ch + 1) + '=' + d2); }
      else if (d1 === 91) { var r = d2 / 127; if (TL && TL.setReverb) TL.setReverb(r); onLog('[CC91 reverb] ' + hex + '  ch' + (ch + 1) + '=' + d2 + '  depth=' + Math.round(r * 100) + '%'); }
      else if (d1 === 93) { var amt = d2 / 127; if (TL && TL.setChorus) TL.setChorus(amt); onLog('[CC93 chorus] ' + hex + '  ch' + (ch + 1) + '=' + d2 + '  depth=' + Math.round(amt * 100) + '%'); }
      else if (d1 === 120 || d1 === 123) { killChannel(ch); onLog('[CC' + d1 + ']   ' + hex + '  ch' + (ch + 1) + ' all-notes-off'); }
      else onLog('[CC' + d1 + ']    ' + hex + '  ch' + (ch + 1) + '=' + d2);
    }
    else if (status === 0xE0) { var v = ((d2 << 7) | d1) - 8192; setPitchBend(ch, v); onLog('[Bend]     ' + hex + '  ch' + (ch + 1) + '=' + v); }
    else if (status === 0xD0) { onLog('[ChPress]  ' + hex + '  ch' + (ch + 1) + '=' + d1); }
    else { onLog('[Other]    ' + hex); }
  }

  window.Router = {
    channels: channels,
    handleMessage: handleMessage, noteOn: noteOn, noteOff: noteOff,
    setProgram: setProgram, setVolume: setVolume, setPan: setPan, setSustain: setSustain,
    get onLog() { return onLog; }, set onLog(fn) { onLog = fn || function () {}; },
    get onProgramChange() { return onProgramChange; }, set onProgramChange(fn) { onProgramChange = fn || function () {}; },
    get onNote() { return onNote; }, set onNote(fn) { onNote = fn || function () {}; },
    get onTransport() { return onTransport; }, set onTransport(fn) { onTransport = fn || function () {}; }
  };

  // SELF-CHECK: parse synthetic messages, assert channel state + callbacks.
  (function () {
    var ok = true, log = function (m) { console.log('[router] ' + m); };
    var logged = [], pcs = [], notes = [];
    onLog = function (l) { logged.push(l); };
    onProgramChange = function (c, p, n) { pcs.push([c, p, n]); };
    onNote = function (m, on) { notes.push([m, on]); };
    handleMessage([0x90, 60, 92]);            // ch1 Note On C4
    handleMessage([0xC0, 24]);               // ch1 Program -> guitar
    handleMessage([0xB0, 7, 95]);             // ch1 vol
    handleMessage([0xB0, 64, 127]);           // ch1 sustain on
    handleMessage([0x80, 60, 0]);            // ch1 Note Off (held)
    handleMessage([0xB0, 64, 0]);            // sustain off -> release queued
    handleMessage([0x99, 38, 100]);           // ch10 Note On -> drum
    handleMessage([0xE0, 0, 64]);            // ch1 pitch bend
    if (channels[0].program !== 24) { ok = false; log('FAIL program=' + channels[0].program); }
    if (channels[0].volume !== 95) { ok = false; log('FAIL volume=' + channels[0].volume); }
    if (channels[0].sustain !== false) { ok = false; log('FAIL sustain'); }
    if (!pcs.length || pcs[0][2] !== 'Acoustic Guitar (nylon)') { ok = false; log('FAIL pc name'); }
    if (notes.length !== 3) { ok = false; log('FAIL notes count=' + notes.length); }
    if (ok) log('SELF-CHECK PASS');
    // reset callbacks to no-op for production host override
    onLog = function () {}; onProgramChange = function () {}; onNote = function () {};
  })();
})();
