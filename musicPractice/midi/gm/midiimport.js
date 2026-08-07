/* midi/gm/midiimport.js — Standard MIDI File parser (format 0/1).
   Returns [{channel(0-based), program, events:[{dt(seconds), ch, status, d1, d2}]}].
   Uses tempo meta to convert ticks → seconds. */
(function () {
  function parse(bytes) {
    var b = bytes, i = 0, tracks = [];
    function u32() { return (b[i++] << 24) | (b[i++] << 16) | (b[i++] << 8) | b[i++]; }
    function u16() { return (b[i++] << 8) | b[i++]; }
    function vlq() { var v = 0, c; do { c = b[i++]; v = (v << 7) | (c & 0x7f); } while (c & 0x80); return v; }
    if (String.fromCharCode(b[0], b[1], b[2], b[3]) !== 'MThd') return null;
    i = 4; u32(); var fmt = u16(); var ntr = u16(); var ppq = u16();
    var tempo = 500000;  // default 120 BPM (us/quarter)
    for (var t = 0; t < ntr; t++) {
      if (String.fromCharCode(b[i], b[i + 1], b[i + 2], b[i + 3]) !== 'MTrk') break;
      i += 4; var tlen = u32(); var end = i + tlen;
      var tick = 0, evs = [], program = null, runningStatus = 0;
      while (i < end) {
        tick += vlq();
        var st = b[i];
        if (st === 0xff) {                       // meta event
          i++; var mt = b[i++]; var ml = vlq(); var mb = b.subarray(i, i + ml); i += ml;
          if (mt === 0x2f) break;               // end of track
          if (mt === 0x51 && ml >= 3) tempo = (mb[0] << 16) | (mb[1] << 8) | mb[2];
          continue;
        }
        var statusByte;
        if (st & 0x80) { statusByte = st; i++; }   // new status
        else { statusByte = runningStatus; if (!statusByte) break; }  // running status
        runningStatus = statusByte;
        var ch = statusByte & 0x0f, stat = statusByte & 0xf0;
        if (stat === 0xc0) { program = b[i++]; evs.push({ tick: tick, ch: ch, status: 0xc0, d1: program, d2: 0 }); continue; }
        if (stat === 0xd0) { var p = b[i++]; evs.push({ tick: tick, ch: ch, status: 0xd0, d1: p, d2: 0 }); continue; }
        var d1 = b[i++], d2 = b[i++];
        evs.push({ tick: tick, ch: ch, status: stat, d1: d1, d2: d2 });
      }
      var events = evs.map(function (e) { return { dt: e.tick * tempo / (ppq * 1000000), ch: e.ch, status: e.status, d1: e.d1, d2: e.d2 }; });
      if (events.length) { var first = events[0].dt; for (var k = 0; k < events.length; k++) { events[k].dt -= first; if (events[k].dt < 0) events[k].dt = 0; } }
      var chCounts = {}, mainCh = 0, mx = 0;
      for (var c = 0; c < events.length; c++) { chCounts[events[c].ch] = (chCounts[events[c].ch] || 0) + 1; if (chCounts[events[c].ch] > mx) { mx = chCounts[events[c].ch]; mainCh = events[c].ch; } }
      tracks.push({ channel: mainCh, program: program, events: events });
    }
    return tracks;
  }
  window.MidiImporter = { parse: parse };
})();
