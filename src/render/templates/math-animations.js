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
    if (preview) {
      scene.style.opacity = scene.id === preview ? '1' : '0';
      return;
    }
    const start = Number(scene.dataset.start), duration = Number(scene.dataset.duration);
    timeline.set(scene, { opacity: 1 }, start);
    timeline.set(scene, { opacity: 0 }, start + duration);
    timeline.fromTo(board, { y: 16, opacity: 0 }, { y: 0, opacity: 1, duration: Math.min(.35, duration / 4), ease: 'power1.out' }, start);
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
  if (preview) document.body.dataset.previewReady = 'true';
})();
