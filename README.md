# Auto Math Video

Animated step-by-step mathematics lessons with Vietnamese male narration, LaTeX formulas, declarative diagrams and English problem reading. The primary workflow supports all grade levels and mathematical topics the agent can solve and independently verify.

[Hướng dẫn tiếng Việt](README.vi.md) · [Math workflow](docs/math-video-workflow.md) · [Narration rules](docs/voice-text-rules.md)

## How it works

Problem text/file/image/URL → agent solves and checks → v2 script.json → per-scene speech → actual audio timing → HTML/CSS/GSAP + KaTeX → HyperFrames check → 1080×1920 MP4 at 30 fps.

The agent is responsible for mathematical correctness. Schema validation checks structure, formulas, narration and reading order; it does not prove the solution.

## Setup

Use Node.js 22+ and FFmpeg/ffprobe. Run `npm install`, copy `.env.example` to `.env.local`, and configure a supported male voice in LucyLab, ElevenLabs or Vbee. Existing `.env` remains a fallback. Never put credentials in scripts.

Use `/create-math-video` from an agent opened in this repository. Skills are provided for Codex, Claude and Gemini. See `examples/math/algebra.json`, `geometry-english.json` and `calculus.json` for reusable input examples. Copy an example to a unique `output/<session>/script.json` before running:

```powershell
npm run pipeline -- output/<session>/script.json --validate
npm run pipeline -- output/<session>/script.json
npm run rerender -- output/<session>
```

`--validate` does not call TTS. `--no-render` prepares audio and HTML and may call TTS. Cache fingerprints prevent stale narration from being reused after text or voice changes.

## Lessons

Greeting and purpose → full problem → strategy → solution steps → verification → answer → closing wish. For English problems, first read the original verbatim with Vbee English TTS (`VBEE_VOICE_CODE_EN=am_echo`) at 0.9×, then its complete Vietnamese translation, then solve. Missing Vbee English configuration is an explicit error, never a provider fallback.

Use `englishText` separately from Vietnamese `voiceText`. Write Vietnamese numbers/operators in words. Visuals retain math notation. Duration follows actual audio, without a one-minute limit. The schema supports 6–100 scenes.

Templates: math-intro, math-problem, math-step, math-diagram, math-answer, math-closing. KaTeX renders fractions, roots, powers, systems, matrices, sums and integrals. Diagrams use lines, circles, polygons and labels; advanced figures require renderer extensions. All math fonts and GSAP assets are local. Sound effects are off by default.

Keep run-specific scripts, input copies, audio, logs and compositions under the same `output/<session>/`; helper scripts belong in its `scripts/` directory. Preserve user originals.

## Development

`npm run typecheck`, `npm test`, `npm run build`.

HyperFrames is pinned to 0.8.143. Math rendering runs `hyperframes check` before encoding. Legacy v1 news scripts remain supported; the previous README is preserved in [docs/legacy-news-README.md](docs/legacy-news-README.md).
