export type VideoOrientation = "portrait" | "landscape";

/** Keep export dimensions explicit, while fitting the canvas to any preview viewport. */
export function responsiveComposition(html: string, orientation: VideoOrientation = "portrait", math = false): string {
  const width = orientation === "landscape" ? 1920 : 1080;
  const height = orientation === "landscape" ? 1080 : 1920;
  html = html.replace(/data-width="1080"/, `data-width="${width}"`).replace(/data-height="1920"/, `data-height="${height}"`);
  html = html.replace(/<body([^>]*)>/, `<body$1 data-orientation="${orientation}">`);
  // Legacy news layouts retain their portrait stage within a horizontal canvas.
  // Math lessons use the dedicated horizontal reflow in math-styles.css.
  if (!math && orientation === "landscape") {
    html = html.replace(/(<div id="stage"[\s\S]*?>)/, '$1<div class="legacy-canvas">')
      .replace(/<\/div>\s*<script>/, '</div></div><script>');
  }
  const legacy = !math && orientation === "landscape" ? `<style>#stage{width:1920px!important;height:1080px!important}.legacy-canvas{position:absolute;left:656px;top:0;width:1080px;height:1920px;transform:scale(.5625);transform-origin:top left}</style>` : "";
  html = html.replace(/<meta name="viewport"[^>]*>/g, "");
  const style = `<meta name="viewport" content="width=device-width, initial-scale=1"><style>html{width:100%!important;height:100%!important;overflow:hidden}body{width:${width}px!important;height:${height}px!important;transform-origin:top left;margin:0!important}</style>${legacy}`;
  const fit = `<script>(()=>{const w=${width},h=${height};function fit(){document.body.style.transform='scale('+Math.min(innerWidth/w,innerHeight/h)+')';}fit();addEventListener('resize',fit);})();</script>`;
  return html.replace('</head>', style+'</head>').replace('</body>',fit+'</body>');
}
