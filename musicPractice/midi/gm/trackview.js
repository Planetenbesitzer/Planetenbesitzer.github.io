/* midi/gm/trackview.js — LMMS-style mini piano-roll per track lane.
   Draws melodic note blocks (note-on→note-off), drum ticks (ch9), and a
   playhead. Depends on nothing (pure draw given a track + opts). Classic script. */
(function () {
  // note range for pitch mapping (falls back if events outside)
  var LO = 36, HI = 84;

  function yFor(note, H) {
    var n = Math.max(LO, Math.min(HI, note));
    return H - ((n - LO) / (HI - LO)) * (H - 6) - 3;
  }

  function drawLane(canvas, track, opts) {
    opts = opts || {};
    var ctx = canvas.getContext('2d');
    var W = canvas.width, H = canvas.height;
    ctx.clearRect(0, 0, W, H);
    // background
    ctx.fillStyle = 'rgba(0,0,0,0.28)';
    ctx.fillRect(0, 0, W, H);
    // center pitch reference line
    ctx.strokeStyle = 'rgba(255,255,255,0.06)';
    ctx.beginPath(); ctx.moveTo(0, H / 2); ctx.lineTo(W, H / 2); ctx.stroke();

    var dur = opts.loopLen || Math.max(track.duration, 0.5);
    if (!isFinite(dur) || dur <= 0) dur = 1;
    var ev = track.events;
    var playing = !!opts.playing;

    // bar + beat grid
    if (opts.barDur && opts.barDur > 0) {
      var bd = opts.barDur, bpb = opts.beatsPerBar || 4, beat = bd / bpb;
      ctx.strokeStyle = 'rgba(255,255,255,0.05)';
      for (var xg = 0; xg <= dur + 0.0001; xg += beat) {
        var xb = (xg / dur) * W;
        ctx.beginPath(); ctx.moveTo(xb, 0); ctx.lineTo(xb, H); ctx.stroke();
      }
      ctx.strokeStyle = 'rgba(255,255,255,0.16)';
      for (var xbar = 0; xbar <= dur + 0.0001; xbar += bd) {
        var xbb = (xbar / dur) * W;
        ctx.beginPath(); ctx.moveTo(xbb, 0); ctx.lineTo(xbb, H); ctx.stroke();
      }
    }

    // gather note-ons / note-offs
    var ons = [], offs = [];
    for (var i = 0; i < ev.length; i++) {
      var e = ev[i];
      if (e.status === 0x90 && e.d2 > 0) ons.push(e);
      else if (e.status === 0x80 || (e.status === 0x90 && e.d2 === 0)) offs.push(e);
    }

    // melodic blocks (ch !== 9)
    for (var k = 0; k < ons.length; k++) {
      var on = ons[k];
      if (on.ch === 9) continue;                 // drum — drawn as tick below
      var offDt = track.duration;
      for (var m = 0; m < offs.length; m++) {
        var off = offs[m];
        if (off.ch === on.ch && off.d1 === on.d1 && off.dt >= on.dt) { offDt = off.dt; break; }
      }
      var x1 = (on.dt / dur) * W, x2 = Math.max(x1 + 2, (offDt / dur) * W);
      var y = yFor(on.d1, H);
      ctx.fillStyle = playing ? 'rgba(142,255,176,0.85)' : 'rgba(185,140,255,0.55)';
      ctx.fillRect(x1, y - 2.5, x2 - x1, 5);
    }

    // drum ticks (ch === 9)
    for (var d = 0; d < ons.length; d++) {
      if (ons[d].ch !== 9) continue;
      var x = (ons[d].dt / dur) * W;
      ctx.fillStyle = 'rgba(255,213,107,0.85)';
      ctx.fillRect(x - 1, 0, 2, H);
    }

    // playhead
    if (playing) {
      var px = (opts.pos || 0) * W;
      ctx.fillStyle = 'rgba(255,139,216,0.9)';
      ctx.fillRect(px - 1, 0, 2, H);
    }
  }

  window.TrackView = { drawLane: drawLane, LO: LO, HI: HI };
})();
