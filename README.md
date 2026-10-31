# Shu-Tao Zhang — academic homepage

A research-first personal site for QCD, energy correlators, spin-dependent
fragmentation, and collider phenomenology. Hosted on GitHub Pages at
[pkuhep.top](https://pkuhep.top).

## Structure

- `index.html`: profile, research overview, and recent slides.
- `assets/css/site.css`: shared responsive styles.
- `assets/img/`: small title-slide previews; full presentations load only when opened.
- `DiFF4Yukawa.html` and `fecpheno.html`: original standalone presentations.
- `interests/notes/`: physics and mathematics notes, writing, and source files.
- `interests/music/`: piano and MIDI tools.
- `interests/playground/`: small web experiments.

Retained notes, tools, and slides keep their existing URLs. The directory pages
provide navigation to the material selected for the site.

## Preview and maintenance

Run `python3 -m http.server 8000` in this directory, then visit
`http://localhost:8000`. The homepage and interest directories use plain HTML/CSS
and need no installation or build. GitHub Pages continues to render the existing
Markdown pages through Jekyll. `CNAME` retains the custom domain.

To add a talk, edit the `slides` section in `index.html`, add its standalone
presentation and a small preview image. Dates on the existing entries are
conference periods. The profile and talk details come from the original slides;
the research overview also reflects the author's current research notes.

Keep Codex sessions, caches, browser output, and local development files in
`.codex/` or `.cache/`. These and nested agent-state directories are ignored by
Git and excluded from the Jekyll site. Do not force-add local state.

## Template

Adapted from [Minimal Light](https://github.com/yaoyao-liu/minimal-light)
by Yaoyao Liu (CC0-1.0). See
[the attribution and license](assets/vendor/minimal-light/README.md).
