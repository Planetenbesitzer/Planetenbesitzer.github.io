/* shared/keyboard.js — TL.makeKeyboard: 88-key renderer, clickable+touch, highlight.
   Depends on TL (audio-core.js). CSS classes (.key.white/.black/.playing/.kb-label/.kb-inner)
   are defined by the host page (midiplus.html). */
(function () {
  window.TL = window.TL || {};
  TL.makeKeyboard = function (container, opts) {
    opts = opts || {};
    var WHITE_W = 34, BLACK_W = 22;
    var kb = document.createElement('div'); kb.className = 'kb-inner';
    var keyEls = {};
    var whiteCount = 0;
    var N = TL.MIDI_END - TL.MIDI_START + 1;
    for (let i = 0; i < N; i++) {
      let midi = TL.MIDI_START + i;
      var name = TL.NOTE_NAMES[((midi % 12) + 12) % 12];
      var isBlack = name.indexOf('#') !== -1;
      let el = document.createElement('div');
      el.className = 'key ' + (isBlack ? 'black' : 'white');
      el.dataset.midi = midi;
      if (isBlack) {
        el.style.left = (whiteCount * WHITE_W - BLACK_W / 2) + 'px';
      } else {
        el.style.left = (whiteCount * WHITE_W) + 'px';
        var lbl = document.createElement('span');
        lbl.className = 'kb-label'; lbl.textContent = TL.noteLabel(midi);
        el.appendChild(lbl); whiteCount++;
      }
      let active = false;
      var press = function (e) {
        e.preventDefault();
        if (active) return; active = true;
        el.classList.add('playing');
        if (opts.onNoteDown) opts.onNoteDown(midi, 90);
      };
      var release = function () {
        if (!active) return; active = false;
        el.classList.remove('playing');
        if (opts.onNoteUp) opts.onNoteUp(midi);
      };
      el.addEventListener('pointerdown', press);
      el.addEventListener('pointerup', release);
      el.addEventListener('pointerleave', release);
      el.addEventListener('pointercancel', release);
      kb.appendChild(el); keyEls[midi] = el;
    }
    kb.style.width = (whiteCount * WHITE_W) + 'px';
    container.innerHTML = ''; container.appendChild(kb);

    return {
      el: function (midi) { return keyEls[midi]; },
      highlight: function (midi, on) {
        var el = keyEls[midi]; if (!el) return;
        if (on) el.classList.add('playing'); else el.classList.remove('playing');
      },
      setScroll: function (midi) {
        var el = keyEls[midi]; if (el) container.scrollLeft = (el.offsetLeft - 300);
      }
    };
  };
})();
