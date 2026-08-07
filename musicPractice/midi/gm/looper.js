/* midi/gm/looper.js — fixed-length global loop station (rewrite).
   One master loop of N bars; every track phase-locked to a single loopOrigin.
   Flow: set each track's timbre → Record (count-in) → play one cycle → auto-stop
   and IMMEDIATELY loop → next empty track auto-selected → overdub on the next
   boundary, hearing the loop the whole time. Drum track (ch10) is independent.

   Depends on TL (audio-core), Router, Engines. Classic script.
   Channels 0-based (0=ch1..9=ch10=drums). Tracks 0-7 melodic ch1-8, track 8 drums ch10. */
(function () {
  var TL = window.TL, Router = window.Router, Engines = window.Engines, Drums = window.Drums;

  var NTRACKS = 9;                     // 8 melodic (ch1-8) + 1 drum (ch10)
  var tracks = [];
  for (var i = 0; i < NTRACKS; i++) tracks.push({
    id: i, melCh: i < 8 ? i : 9, isDrum: (i === 8),
    program: null, events: [], duration: 0,
    muted: false, vol: 1, state: 'idle', cursor: 0,
    recStart: null                       // AudioContext time this take began recording (== a loop boundary)
  });

  var armed = -1, playing = false, schedTimer = null;
  var loopStarts = new Array(NTRACKS);
  var loopOrigin = null;                 // AudioContext time of cycle-0 downbeat (null until first take)
  var onTrackState = function () {}, onLog = function () {};

  // tempo + fixed-length loop
  var bpm = 80, beatsPerBar = 4, metronomeOn = true, quantizeBeats = 0;
  var loopBars = 4;                       // 1 / 2 / 4 / 8
  function beatDur() { return 60 / bpm; }
  function barDur() { return beatsPerBar * beatDur(); }
  function loopDur() { return loopBars * barDur(); }
  // first-take count-in: a full bar — accent on beat 1, then 嗒嗒嗒, then the next
  // downbeat (= loopOrigin) is where recording starts. Only when the metronome is on.
  function countInDur() { return metronomeOn ? barDur() : 0; }

  function setBpm(v) { bpm = Math.max(20, Math.min(300, v || 80)); }
  function setLoopBars(n) { n = parseInt(n, 10) || 4; if (n < 2) n = 2; if (n > 16) n = 16; loopBars = n; }
  function setMetronomeOn(on) { metronomeOn = !!on; if (!metronomeOn) stopMetro(); }
  function setQuantize(b) { quantizeBeats = Math.max(0, b || 0); }
  function quantizeDt(dt) { if (quantizeBeats <= 0) return dt; var gs = quantizeBeats * beatDur(); return Math.round(dt / gs) * gs; }

  // metronome — sample-accurate clicks. clickStart = when clicks begin (the count-in
  // start for a first take, loopOrigin for plain playback). barOrigin = the loop's
  // downbeat reference; a click is accented when it lands on a bar downbeat measured
  // from barOrigin — so the count-in is "重 嗒 嗒 嗒 → 重(进)", every bar beat 1 accented.
  // Metro has its OWN gain node (metroGain → master), so its level is adjustable
  // independently of the instruments via setMetroVol().
  var metroTimer = null, metroStart = 0, metroNext = 0;
  var metroGain = null, metroVol = 0.4;
  function metroBus() {
    if (!metroGain) {
      try { metroGain = TL.ctx.createGain(); metroGain.gain.value = metroVol; metroGain.connect(TL.master); } catch (e) {}
    }
    return metroGain || TL.master;
  }
  function setMetroVol(v) {
    metroVol = Math.max(0, Math.min(1, v || 0));
    if (metroGain) { try { metroGain.gain.value = metroVol; } catch (e) {} }
  }
  function clickAt(time, accent) {
    try {
      var o = TL.ctx.createOscillator(); o.type = 'sine'; o.frequency.value = accent ? 1500 : 1000;
      var g = TL.ctx.createGain();
      g.gain.setValueAtTime(0.0001, time);
      g.gain.linearRampToValueAtTime(accent ? 0.25 : 0.12, time + 0.001);
      g.gain.exponentialRampToValueAtTime(0.0001, time + 0.04);
      o.connect(g); g.connect(metroBus()); o.start(time); o.stop(time + 0.05);
    } catch (e) {}
  }
  function startMetro(clickStart, barOrigin) {
    if (!metronomeOn || metroTimer) return;
    metroStart = clickStart;
    if (barOrigin == null) barOrigin = clickStart;
    metroNext = Math.floor((TL.ctx.currentTime - clickStart) / beatDur());
    if (metroNext < 0) metroNext = 0;
    metroTimer = setInterval(function () {
      var now = TL.ctx.currentTime;
      var bd = barDur();
      while (metroStart + metroNext * beatDur() < now + 0.06) {
        var bt = metroStart + metroNext * beatDur();
        if (bt >= now - 0.05) {
          var dm = (((bt - barOrigin) % bd) + bd) % bd;     // 0..bd, distance to the nearest downbeat
          var downbeat = dm < 0.02 || dm > bd - 0.02;
          clickAt(bt, downbeat);
        }
        metroNext++;
      }
    }, 10);
  }
  function stopMetro() { if (metroTimer) { clearInterval(metroTimer); metroTimer = null; } }

  function isArmed() { return armed >= 0; }
  function nextEmpty() { for (var i = 0; i < NTRACKS; i++) if (tracks[i].events.length === 0) return i; return 0; }
  function anyRecorded() { for (var i = 0; i < NTRACKS; i++) if (tracks[i].events.length) return true; return false; }

  function synthData(ev) {
    var ch = ev.ch & 0x0f;
    if (ev.status === 0xE0) return new Uint8Array([0xE0 | ch, ev.d1 & 0x7f, ev.d2 & 0x7f]);
    if (ev.status === 0xD0) return new Uint8Array([0xD0 | ch, ev.d1 & 0x7f]);
    return new Uint8Array([ev.status | ch, ev.d1, ev.d2]);
  }
  // monitor = play an event live through the synth without logging
  function monitor(ev) {
    var prev = Router.onLog; Router.onLog = function () {};
    try { Router.handleMessage(synthData(ev)); } finally { Router.onLog = prev; }
  }

  // per-track timbre (set from the UI before recording). Drum track is fixed.
  function setTrackProgram(id, prog) {
    var t = tracks[id]; if (!t || t.isDrum) return;
    t.program = Math.max(0, Math.min(127, prog | 0));
    try { Router.setProgram(t.melCh, t.program); } catch (e) {}
  }

  function recordEvent(data) {
    if (armed < 0 || !data || data.length < 2 || data[0] === 0xF0) return;
    var status = data[0] & 0xf0, srcCh = data[0] & 0x0f;
    if (status !== 0x80 && status !== 0x90 && status !== 0xB0 && status !== 0xE0 && status !== 0xD0 && status !== 0xA0) return;
    var t = tracks[armed];
    // channel-vs-track nature guard: a drum track only records ch10 (drum) input;
    // a melodic track only records non-ch10 input. Mismatched input is a live
    // one-shot only — never stored, never re-channelized into the wrong timbre.
    if (t.isDrum && srcCh !== 9) return;
    if (!t.isDrum && srcCh === 9) { try { Drums.play(data[1], data.length > 2 ? data[2] : 0); } catch (e) {} return; }
    var now = TL.ctx.currentTime;
    var replayCh = t.isDrum ? 9 : t.melCh;            // re-channelize onto this track's channel
    var ev = { dt: 0, ch: replayCh, status: status, d1: data[1], d2: data.length > 2 ? data[2] : 0 };
    monitor(ev);                                       // always monitor — hear yourself while recording
    if (t.recStart == null || now < t.recStart) return;   // count-in / waiting for boundary: don't store yet
    var dur = loopDur();
    var dt = now - t.recStart;
    dt = ((dt % dur) + dur) % dur;                      // wrap into the loop window
    ev.dt = quantizeDt(dt);
    t.events.push(ev);
  }

  function ensureSched() { if (!schedTimer) schedTimer = setInterval(schedTick, 10); }
  function stopSched() { if (schedTimer) { clearInterval(schedTimer); schedTimer = null; } }

  function recordArm(id) {
    id = (id === undefined || id < 0) ? nextEmpty() : Math.max(0, Math.min(NTRACKS - 1, id));
    var t = tracks[id];
    var now = TL.ctx.currentTime;
    t.events = []; t.duration = 0; t.cursor = 0; t.state = 'rec'; t.recStart = null;
    if (!t.isDrum) {
      if (t.program == null) t.program = 0;
      try { Router.setProgram(t.melCh, t.program); } catch (e) {}
    } else t.program = null;

    if (loopOrigin == null) {
      // FIRST TAKE: count-in, then record one full loop, then auto-loop.
      loopOrigin = now + countInDur();
      t.recStart = loopOrigin;
      startMetro(now, loopOrigin);
      onLog('🔴 录 ch' + (t.isDrum ? '10' : (t.melCh + 1)) + ' …(预备拍后开始,录满 ' + loopBars + ' 小节自动循环)');
    } else {
      // OVERDUB: align to the next loop boundary; start the loop if it isn't running.
      if (!playing) play();
      var dur = loopDur();
      var nextBoundary = loopOrigin + Math.ceil((now - loopOrigin) / dur) * dur;
      if (nextBoundary < now) nextBoundary = now;
      t.recStart = nextBoundary;
      if (!metroTimer) startMetro(loopOrigin, loopOrigin);
      onLog('🔴 录 ch' + (t.isDrum ? '10' : (t.melCh + 1)) + ' …(下个小节起点开始)');
    }
    armed = id;
    ensureSched();
    onTrackState();
  }

  function finalizeTake(id) {
    var t = tracks[id];
    armed = -1;
    // empty take — discard, never become a 0-event play track (would poison the master)
    if (t.events.length === 0) {
      t.state = 'idle'; t.recStart = null; t.duration = 0;
      if (!anyRecorded()) { loopOrigin = null; playing = false; stopSched(); stopMetro(); }
      onLog('⏹ 空录,已丢弃');
      onTrackState();
      return;
    }
    t.state = 'play'; t.cursor = 0;
    loopStarts[id] = t.recStart;                       // a loop boundary → phase-aligned with everything
    t.duration = loopDur();                            // fixed length
    if (!playing) playing = true;                      // the loop is now running
    onLog('✓ ch' + (t.isDrum ? '10' : (t.melCh + 1)) + ' 录完 · ' + t.events.length + ' 事件 · 开始循环');
    onTrackState();
  }
  function cancelTake() {
    if (armed < 0) return;
    var t = tracks[armed];
    var hadEvents = t.events.length > 0;
    t.events = []; t.duration = 0; t.state = 'idle'; t.recStart = null;
    armed = -1;
    // a canceled FIRST take must reset the master so the next arm isn't a phantom overdub
    if (!anyRecorded()) { loopOrigin = null; playing = false; stopSched(); stopMetro(); }
    onLog(hadEvents ? '⏹ 取消录制(已丢弃)' : '⏹ 取消录制');
    onTrackState();
  }

  // per-track loop length for playback (new takes = loopDur; imported tracks keep their own bars)
  function loopLen(i) {
    var t = tracks[i];
    var d = t.events.length ? t.duration : 0;
    var bars = Math.max(1, Math.ceil(d / barDur()));
    return bars * barDur();
  }

  function schedTick() {
    var now = TL.ctx.currentTime;
    // recording auto-stop
    if (armed >= 0) {
      var rt = tracks[armed];
      if (rt.recStart != null && now >= rt.recStart + loopDur()) finalizeTake(armed);
    }
    if (!playing) { if (armed < 0) stopSched(); return; }
    // playback
    for (var i = 0; i < NTRACKS; i++) {
      var t = tracks[i];
      if (t.state !== 'play' || t.events.length === 0) continue;
      var dur = loopLen(i);
      var into = now - loopStarts[i];
      if (into >= dur) {
        if (into >= dur * 2) loopStarts[i] = now;       // backgrounded catch-up: resync, no burst
        else loopStarts[i] += dur;
        t.cursor = 0; into = now - loopStarts[i];
      }
      while (t.cursor < t.events.length && t.events[t.cursor].dt <= into) {
        monitor(t.events[t.cursor++]);
      }
    }
  }

  function play() {
    if (playing) return;
    var any = false;
    var now = TL.ctx.currentTime;
    if (loopOrigin == null) {
      var has = false;
      for (var i = 0; i < NTRACKS; i++) if (tracks[i].events.length) { has = true; break; }
      if (!has) { onLog('⚠ 先录一段再播放'); return; }
      loopOrigin = now;                                 // plain play of existing tracks: no count-in
    }
    var dur0 = loopDur();
    var cycleStart = loopOrigin + Math.floor((now - loopOrigin) / dur0) * dur0;
    for (var i = 0; i < NTRACKS; i++) {
      var t = tracks[i];
      if (t.events.length === 0 || t.muted) { t.state = 'idle'; continue; }
      if (!t.isDrum && t.program != null) { try { Router.setProgram(t.melCh, t.program); } catch (e) {} }
      t.state = 'play'; t.cursor = 0; loopStarts[i] = cycleStart;
      var into = now - cycleStart;
      while (t.cursor < t.events.length && t.events[t.cursor].dt <= into) t.cursor++;   // skip passed events (no burst)
      any = true;
    }
    if (!any) { onLog('⚠ 无可播放声轨'); return; }
    playing = true;
    ensureSched();
    startMetro(loopOrigin, loopOrigin);
    onLog('▶ 播放循环');
    onTrackState();
  }

  function stop() {
    if (armed >= 0) cancelTake();
    stopSched(); stopMetro();
    playing = false;
    for (var i = 0; i < NTRACKS; i++) { tracks[i].state = 'idle'; tracks[i].cursor = 0; }
    for (var c = 0; c < 16; c++) { try { Engines.killAll(c); } catch (e) {} }
    if (!anyRecorded()) loopOrigin = null;             // nothing recorded → next arm is a fresh first take
    onLog('⏹ 停止(轨道保留,播放会从循环起点续上)');
    onTrackState();
  }

  function clearAll() {
    stop();
    loopOrigin = null;
    for (var i = 0; i < NTRACKS; i++) {
      tracks[i].events = []; tracks[i].duration = 0; tracks[i].state = 'idle';
      tracks[i].cursor = 0; tracks[i].recStart = null;
    }
    onLog('🗑 已清空所有轨道');
    onTrackState();
  }

  function setMute(id, m) {
    var t = tracks[id]; if (!t) return;
    t.muted = m;
    if (playing && t.events.length) {
      if (m) { t.state = 'idle'; try { Engines.killAll(t.melCh); } catch (e) {} }
      else {
        t.state = 'play'; t.cursor = 0; loopStarts[id] = TL.ctx.currentTime;
        if (!t.isDrum && t.program != null) { try { Router.setProgram(t.melCh, t.program); } catch (e) {} }
      }
    }
    onTrackState();
  }
  function setVol(id, v) { if (tracks[id]) { tracks[id].vol = v; try { TL.nowChannel(tracks[id].melCh).setVolume(v); } catch (e) {} } }

  // playhead for UI: {pos:0..1} while playing OR recording; null otherwise
  function loopPos(i) {
    var t = tracks[i];
    if (!t || t.events.length === 0) return null;
    var dur = loopLen(i);
    if (dur <= 0) return null;
    var now = TL.ctx.currentTime;
    if (t.state === 'play') {
      if (loopStarts[i] == null) return null;
      var into = ((now - loopStarts[i]) % dur + dur) % dur;
      return { pos: into / dur };
    }
    if (t.state === 'rec' && t.recStart != null && now >= t.recStart) {
      var r = ((now - t.recStart) % dur + dur) % dur;
      return { pos: r / dur };
    }
    return null;
  }

  function serialize() {
    return { loopBars: loopBars, tracks: tracks.map(function (t) {
      return { program: t.program, events: t.events, duration: t.duration, muted: t.muted, vol: t.vol };
    }) };
  }
  function deserialize(data) {
    if (!data) return false;
    var arr = Array.isArray(data) ? data : data.tracks;
    if (!arr) return false;
    if (!Array.isArray(data) && data.loopBars) setLoopBars(data.loopBars);
    for (var i = 0; i < NTRACKS; i++) {
      var s = arr[i]; if (!s) continue;
      if (s.melCh != null) tracks[i].melCh = s.melCh;
      if (s.isDrum != null) tracks[i].isDrum = !!s.isDrum;
      tracks[i].program = (s.program != null) ? s.program : null;
      var ev = Array.isArray(s.events) ? s.events.slice() : [];
      ev.sort(function (a, b) { return a.dt - b.dt; });
      tracks[i].events = ev;
      tracks[i].duration = s.duration || 0;
      tracks[i].muted = !!s.muted;
      tracks[i].vol = (s.vol != null) ? s.vol : 1;
      tracks[i].state = 'idle'; tracks[i].cursor = 0; tracks[i].recStart = null;
    }
    loopOrigin = null;                                  // audio time is meaningless across reloads
    onTrackState();
    return true;
  }

  window.Looper = {
    tracks: tracks, isArmed: isArmed, nextEmpty: nextEmpty,
    recordArm: recordArm, recordStop: cancelTake, cancelTake: cancelTake,
    recordEvent: recordEvent, play: play, stop: stop, clearAll: clearAll,
    setMute: setMute, setVol: setVol, loopPos: loopPos, loopLen: loopLen,
    setBpm: setBpm, setLoopBars: setLoopBars, setMetronomeOn: setMetronomeOn, setQuantize: setQuantize,
    setMetroVol: setMetroVol, setTrackProgram: setTrackProgram, barDur: barDur, beatDur: beatDur, loopDur: loopDur,
    serialize: serialize, deserialize: deserialize,
    get onTrackState() { return onTrackState; }, set onTrackState(fn) { onTrackState = fn || function () {}; },
    get onLog() { return onLog; }, set onLog(fn) { onLog = fn || function () {}; }
  };

  // SELF-CHECK
  (function () {
    var ok = true, log = function (m) { console.log('[looper] ' + m); };
    if (tracks.length !== NTRACKS) { ok = false; log('FAIL track count'); }
    for (var i = 0; i < 8; i++) if (tracks[i].melCh !== i) { ok = false; log('FAIL melCh ' + i + ' = ' + tracks[i].melCh); }
    if (!tracks[8] || !tracks[8].isDrum || tracks[8].melCh !== 9) { ok = false; log('FAIL drum track'); }
    if (loopBars !== 4) { ok = false; log('FAIL default loopBars'); }
    if (typeof window.Looper.play !== 'function' || typeof window.Looper.clearAll !== 'function') { ok = false; log('FAIL API'); }
    if (ok) log('SELF-CHECK PASS (' + NTRACKS + ' tracks: 8 melodic ch1-8 + 1 drum ch10, fixed-length ' + loopBars + '-bar loop)');
  })();
})();
