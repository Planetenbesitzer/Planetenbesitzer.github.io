/* midi/gm/midiwriter.js — Standard MIDI File (format 1) writer.
   Converts looper tracks (events with absolute ticks) into a .mid Uint8Array.
   Classic script. ticks = seconds × BPM × PPQ / 60. */
(function () {
  function vlq(n) {                       // variable-length quantity (delta-time)
    if (n < 0) n = 0;
    var b = [n & 0x7f]; n >>= 7;
    while (n > 0) { b.unshift((n & 0x7f) | 0x80); n >>= 7; }
    return b;
  }
  function pushBytes(arr, bytes) { for (var i = 0; i < bytes.length; i++) arr.push(bytes[i] & 0xff); }
  function u32(v) { return [(v >>> 24) & 0xff, (v >>> 16) & 0xff, (v >>> 8) & 0xff, v & 0xff]; }
  function u16(v) { return [(v >>> 8) & 0xff, v & 0xff]; }

  // tracks: [{channel, program|null, events:[{tick, status, d1, d2, ch}]}]  (ch = 0-based per-event)
  function write(tracks, bpm, ppq) {
    ppq = ppq || 480; bpm = bpm || 120;
    var tempoUs = Math.round(60000000 / bpm);
    var out = [];
    pushBytes(out, [0x4d, 0x54, 0x68, 0x64]);          // "MThd"
    pushBytes(out, u32(6));
    pushBytes(out, u16(1));                             // format 1 (parallel tracks)
    pushBytes(out, u16(tracks.length));
    pushBytes(out, u16(ppq));
    for (var ti = 0; ti < tracks.length; ti++) {
      var trk = tracks[ti];
      var data = [];
      var prevTick = 0;
      if (ti === 0) {                                   // tempo + 4/4 time sig on first track
        pushBytes(data, vlq(0));
        pushBytes(data, [0xff, 0x51, 0x03, (tempoUs >> 16) & 0xff, (tempoUs >> 8) & 0xff, tempoUs & 0xff]);
        pushBytes(data, vlq(0));
        pushBytes(data, [0xff, 0x58, 0x04, 0x04, 0x02, 0x18, 0x08]);
      }
      if (trk.program != null && trk.channel !== 9) {   // program change (melodic only)
        pushBytes(data, vlq(0));
        pushBytes(data, [0xc0 | (trk.channel & 0x0f), trk.program & 0x7f]);
      }
      var evs = trk.events.slice().sort(function (a, b) { return a.tick - b.tick; });
      for (var ei = 0; ei < evs.length; ei++) {
        var e = evs[ei];
        var delta = e.tick - prevTick; if (delta < 0) delta = 0;
        pushBytes(data, vlq(delta));
        var ch = ((e.ch != null ? e.ch : trk.channel) & 0x0f);
        var st = e.status & 0xf0;
        pushBytes(data, [st | ch, e.d1 & 0x7f]);
        if (st === 0x90 || st === 0x80 || st === 0xb0 || st === 0xe0 || st === 0xa0) pushBytes(data, [e.d2 & 0x7f]);
        prevTick = e.tick;
      }
      pushBytes(data, vlq(0)); pushBytes(data, [0xff, 0x2f, 0x00]);   // end of track
      pushBytes(out, [0x4d, 0x54, 0x72, 0x6b]);          // "MTrk"
      pushBytes(out, u32(data.length));
      pushBytes(out, data);
    }
    return new Uint8Array(out);
  }

  window.MidiWriter = { write: write };
})();
