// Fit the full problem before binding a deterministic, seekable timeline.
// If it cannot fit at a readable size, fail instead of truncating the problem.
(async function () {
  await document.fonts.ready;
  const timeline = gsap.timeline({ paused: true });
  document.querySelectorAll('.math-scene').forEach(scene => {
    const board = scene.querySelector('.math-board');
    const content = scene.querySelector('.math-content');
    let size = 42;
    while (size > 28 && (content.scrollWidth > content.clientWidth + 2 || board.scrollHeight > board.clientHeight + 2)) {
      content.style.fontSize = (--size) + 'px';
    }
    if (content.scrollWidth > content.clientWidth + 2 || board.scrollHeight > board.clientHeight + 2)
      throw new Error('Math scene overflows; split this passage into more scenes: ' + scene.id);
    const start = Number(scene.dataset.start), duration = Number(scene.dataset.duration);
    timeline.set(scene, { opacity: 1 }, start);
    timeline.set(scene, { opacity: 0 }, start + duration);
    timeline.fromTo(board, { y: 16, opacity: 0 }, { y: 0, opacity: 1, duration: Math.min(.35, duration / 4), ease: 'power1.out' }, start);
  });
  window.__timelines = window.__timelines || {};
  window.__timelines['math-video'] = timeline;
})();
