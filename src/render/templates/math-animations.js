// Fit the full problem before binding a deterministic, seekable timeline.
// If it cannot fit at a readable size, fail instead of truncating the problem.
(async function () {
  await document.fonts.ready;
  const timeline = gsap.timeline({ paused: true });
  const concept = document.body.dataset.concept;
  const preview = document.body.dataset.previewScene;
  document.querySelectorAll('.math-scene').forEach(scene => {
    const board = scene.querySelector('.math-board');
    const content = scene.querySelector('.math-content');
    let size = 42;
    while (size > 28 && (content.scrollWidth > content.clientWidth + 2 || board.scrollHeight > board.clientHeight + 2)) {
      content.style.fontSize = (--size) + 'px';
    }
    if (content.scrollWidth > content.clientWidth + 2 || board.scrollHeight > board.clientHeight + 2)
      throw new Error('Math scene overflows; split this passage into more scenes: ' + scene.id);
    if (preview && !document.body.dataset.previewMotion) {
      scene.style.opacity = scene.id === preview ? '1' : '0';
      return;
    }
    const start = Number(scene.dataset.start), duration = Number(scene.dataset.duration);
    timeline.set(scene, { opacity: 1 }, start);
    timeline.set(scene, { opacity: 0 }, start + duration);
    timeline.fromTo(board, { y: 16, opacity: 0 }, { y: 0, opacity: 1, duration: Math.min(.35, duration / 4), ease: 'power1.out' }, start);
    const directed = ['news', 'detective', 'neon'].includes(concept);
    if (directed) {
      const rule = board.querySelector('.direction-rule');
      if (rule) timeline.fromTo(rule, { scaleX: 0 }, { scaleX: 1, duration: Math.min(.45, duration * .08) }, start);
      const elements = [...content.children];
      const interval = duration * .5 / Math.max(1, elements.length);
      elements.forEach((element, i) => {
        const at = start + duration * .08 + i * interval;
        const from = concept === 'news' ? { opacity: 0, x: i % 2 ? 38 : -38 }
          : concept === 'detective' ? { opacity: 0, y: 24, rotation: i % 2 ? 2 : -2 }
          : { opacity: 0, scale: .97 };
        timeline.fromTo(element, from, { opacity: 1, x: 0, y: 0, rotation: 0, scale: 1, duration: Math.min(.4, interval * .5), ease: 'power1.out' }, at);
        // Both supplied sides receive the same emphasis at the same instant.
        // We never calculate a result or infer an operation from the expression.
        const sides = element.querySelectorAll('.equation-side');
        if (sides.length) timeline.fromTo(sides, { backgroundColor: 'transparent' }, { backgroundColor: concept === 'neon' ? '#234959' : '#f3dba8', duration: Math.min(.35, interval * .3) }, at + Math.min(.4, interval * .5));
        const operations = element.querySelectorAll('.equation-operation');
        if (operations.length === 2) {
          operations.forEach((operation, side) => {
            // Editorial cards slide in from opposite margins; evidence is pinned
            // down on both sides; lab terms materialize in the two operand cells.
            const origin = concept === 'news' ? { opacity: 0, x: side ? 36 : -36 }
              : concept === 'detective' ? { opacity: 0, y: -30, rotation: side ? 8 : -8 }
              : { opacity: 0, scale: .65 };
            timeline.fromTo(operation, origin, { opacity: 1, x: 0, y: 0, rotation: 0, scale: 1, duration: Math.min(.5, interval * .3), ease: 'power1.out' }, at + interval * .4);
          });
        }
        if (concept === 'neon' && element.matches('.math-diagram')) {
          element.querySelectorAll('line, circle, polygon').forEach((shape, j, shapes) => {
            const length = shape.getTotalLength();
            shape.style.strokeDasharray = String(length);
            timeline.fromTo(shape, { strokeDashoffset: length }, { strokeDashoffset: 0, duration: interval / Math.max(1, shapes.length) }, at + j * interval / Math.max(1, shapes.length));
          });
        }
      });
      return;
    }
    const items = board.querySelectorAll('.math-equation, .math-note, .math-object-group, .math-diagram');
    if (concept !== 'classic' && items.length) {
      const reveal = Math.min(.4, duration / 8);
      const stagger = Math.min(.3, duration / (items.length * 8));
      const from = concept === 'chalkboard' ? { opacity: 0, x: -12 }
        : concept === 'notebook' ? { opacity: 0, y: 18 } : { opacity: 0, scale: .94 };
      timeline.fromTo(items, from, { opacity: 1, x: 0, y: 0, scale: 1, duration: reveal, stagger, ease: 'power1.out' }, start + Math.min(.35, duration / 4));
    }
  });
  window.__timelines = window.__timelines || {};
  window.__timelines['math-video'] = timeline;
  if (preview) {
    document.body.dataset.previewReady = 'true';
    if (document.body.dataset.previewMotion) {
      const scene = document.getElementById(preview);
      const start = Number(scene.dataset.start), duration = Number(scene.dataset.duration);
      // Gallery-only driver; export uses the same paused deterministic timeline.
      timeline.seek(start);
      let elapsed = 0;
      gsap.ticker.add((_time, deltaMs) => {
        if (!document.body.dataset.previewPaused) {
          elapsed = (elapsed + deltaMs / 1000) % duration;
          timeline.seek(start + elapsed);
        }
      });
      window.addEventListener('message', event => {
        if (event.source !== parent || event.origin !== location.origin) return;
        if (event.data?.type === 'preview-pause') document.body.dataset.previewPaused = 'true';
        if (event.data?.type === 'preview-play') delete document.body.dataset.previewPaused;
        if (event.data?.type === 'preview-seek' && Number.isFinite(event.data.progress)) {
          document.body.dataset.previewPaused = 'true';
          elapsed = Math.max(0, Math.min(.999, event.data.progress)) * duration;
          timeline.seek(start + elapsed);
        }
      });
    }
  }
})();
