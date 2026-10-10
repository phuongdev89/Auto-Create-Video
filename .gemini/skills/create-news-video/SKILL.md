---
name: create-news-video
description: "Tạo video tin tức ngắn 9:16 (~60s) từ URL bài báo hoặc file .txt tiếng Việt. Trigger khi user yêu cầu tạo video tin tức, làm short news, làm bản tin video, render tin thành video, làm TikTok tin tức. Output: video.mp4 + voice.mp3 + script.txt cho CapCut."
---

# Create News Video Skill

Legacy news workflow. For math lessons, use create-math-video and docs/math-video-workflow.md with the version 2.0 schema; this is the primary workflow of the project.

Generate a Vietnamese 9:16 motion-graphic news video from a URL or .txt file.

## Input

Single argument: a news article URL (starts with `http://` or `https://`) OR a path to a `.txt` file.

## Workflow (MUST follow these steps in order)

### Step 1: Detect input type

- Starts with `http://` or `https://` → URL mode
- Otherwise → file mode

### Step 2: Fetch content

**URL mode:**
- Use `WebFetch` or the agent's available web-fetch tool with prompt:
  ```
  Trích xuất từ trang này:
  - title (string): tiêu đề bài báo
  - content (string): nội dung chính, ~500-1500 từ
  - ogImage (string|null): URL ảnh og:image (meta og:image hoặc ảnh đầu bài)
  - domain (string): domain của URL (vd "vnexpress.net")
  Trả về JSON với 4 field trên.
  ```
- If WebFetch fails (paywall, JS-rendered, 4xx) → tell user to save content to a .txt file and pass that instead. Stop.

**File mode:**
- Use `Read` or the agent's available file-reading tool to read the .txt file
- Title = first non-empty line (strip whitespace, max 80 chars)
- Content = remaining lines joined
- ogImage = `null`
- domain = `"local"`

### Step 3: Create session + output directory

- slug = lowercase ASCII (strip Vietnamese diacritics, đ→d), replace non-alphanumeric with `-`, trim dashes, max 40 chars
- timestamp = current local time as `YYYYMMDD-HHmmss`
- session = `<timestamp>-<slug>`; if that directory already exists, append a unique suffix for this task run. When resuming the same run, reuse its session.
- outputDir = `output/<session>/` relative to the project root.
- Create this directory before writing any run-specific files.
- **All one-off files for this video task MUST stay under `<outputDir>`**, including executable helper scripts (`.py`, `.ts`, `.js`, `.ps1`, `.sh`), generated HTML/compositions, JSON/config/input copies, downloaded task assets, temporary files, logs, previews, and intermediate audio/video. Subdirectories such as `scripts/`, `assets/`, and `tmp/` inside the session are allowed.
- When video creation requires coding a script file, write it to `<outputDir>/scripts/` and execute it from there. Set its outputs, temporary files, and caches to paths inside the same session; resolve shared project inputs from the project root explicitly.
- Do not put one-off files in the project root, the shared `scripts/` directory, source directories, or skill folders. Reusable project code belongs in those locations only when the task explicitly calls for a reusable change.
- Leave existing user files and shared assets in place; read them or copy needed inputs into the session.

### Step 4: Generate script.json

Following the schema in `docs/superpowers/specs/2026-04-29-auto-news-video-design.md` Section 4. Key rules:

**Script content (Vietnamese):**
- Typical Vietnamese voiceText: ~150–200 words → ~55–65s spoken at speed 1.0. Mandatory greetings, English problem reading, translation, and closing wishes take priority over this target; extend duration when needed.
- Typically **5–8** scenes (1 opening/hook + 3–6 body + 1 outro); add scenes as needed for the complete English problem and Vietnamese translation.
- Each scene voiceText is 1-3 short sentences, văn nói (spoken style, not formal)
- No emoji, no markdown in voiceText
- **Persona & Đại từ nhân xưng**: Giọng TTS được cố định là giọng nam. LUÔN LUÔN dùng đại từ nhân xưng **"thầy"** (khi xưng hô hướng dẫn/giảng dạy), **TUYỆT ĐỐI KHÔNG dùng "cô"**. Gọi người xem là "các bạn nhỏ", "các em" hoặc "các con".

### Mandatory rules for `voiceText`

Before generating or editing narration, **read and follow [voice-text-rules.md](../../../docs/voice-text-rules.md)**. Apply these rules to every scene, including the hook and outro, and check them again before writing `script.json`.

**Opening / hook (mandatory order):**
- Always greet the audience first, then state what today's video will do before starting its content.
- A claim, statistic, or curious question may follow the greeting and purpose; never skip or replace them to prioritize the hook.
- If the problem is in English, follow the shared rules: announce the English reading, read the original verbatim using Vbee English TTS (`VBEE_VOICE_CODE_EN=am_echo`) at `0.9×`, read the full Vietnamese translation, then begin the lesson/solution. Generate and place the English audio separately; do not pass it to Vietnamese TTS.
- Include at least 1 effect: `flash-white-3f` or `particle-burst`.

**Visual rules:**
- For image scenes: `background.src = "$source.image"` (literal — CLI substitutes)
- Vary `kenBurns` across scenes (don't use `zoom-in` for every scene)
- Vary text `animation` (don't use `slide-up` for every line)
- Each line ≤ 25 characters
- Each scene 1-3 lines

**Outro (always finish with a wish; CTA comes before it):**
```json
{
  "id": "outro",
  "type": "outro",
  "voiceText": "Theo dõi Công nghệ hai mươi tư giờ để xem bản tin mới mỗi ngày. Thầy chúc các con học tốt và luôn vui vẻ.",
  "visual": {
    "background": { "type": "gradient", "preset": "outro-purple" },
    "text": {
      "position": "center",
      "style": "outro-card",
      "lines": [
        { "content": "Xem bản tin mới mỗi ngày", "emphasis": "primary", "animation": "fade-in" },
        { "content": "Công nghệ 24h",            "emphasis": "channel", "animation": "scale-pop" },
        { "content": "Nguồn: <DOMAIN>",          "emphasis": "muted",   "animation": "fade-in-late" }
      ]
    }
  }
}
```
Replace `<DOMAIN>` with the actual domain string. Note: outro line 1 is shortened to fit 25-char schema rule (full CTA "Theo dõi để xem bản tin mới mỗi ngày" is 36 chars).

### Step 5: Self-validate before writing

Check:
- Typical Vietnamese word count ~150-200; extend for mandatory opening, full problem/translation, and closing wish
- Every line.content ≤ 25 chars
- Typically 5-8 scenes; allow extra scenes for the complete problem/translation
- scenes[0].type === "hook"
- last scene type === "outro"
- Opening greets viewers and states today's purpose before content; final spoken sentence is a wish
- For English problems: announcement → verbatim Vbee TTS (`VBEE_VOICE_CODE_EN`) English audio at `0.9×` → full Vietnamese translation → lesson/solution; timeline includes each segment in full
- All enum values valid (see spec Section 4.2)
- Every `voiceText` follows `../../../docs/voice-text-rules.md` (including fully spelled-out numbers and male persona)
- Every one-off file is inside this run's `output/<session>/`

If invalid, fix yourself silently. Up to 2 self-correction passes. Never proceed with a known violation of the mandatory `voiceText` or session-file rules; report any unresolved violation. For remaining schema errors, the CLI's Zod validation will produce a precise error message that the user can act on.

### Step 6: Write script.json

Use the agent's file-writing/editing tool to write the validated JSON to `<outputDir>/script.json`.

### Step 7: Run the pipeline

Use the agent's shell tool, **foreground** (not background), stream output:

```bash
npm run pipeline -- <outputDir>/script.json
```

If exit code != 0:
- Report the error message clearly
- Tell user the output dir path so they can inspect intermediate files

### Step 8: Report success

If successful, report to user with markdown links:

```markdown
✓ Video:  [video.mp4](output/<session>/video.mp4)
✓ Audio:  [voice.mp3](output/<session>/voice.mp3) — for CapCut
✓ Script: [script.txt](output/<session>/script.txt) — for CapCut auto-caption
Tổng thời lượng: XX.Xs
```

## Examples

### Example 1: URL with image (vnexpress)

User: `/create-news-video https://vnexpress.net/iphone-17-200mp`

Generated `script.json` (excerpt):
```json
{
  "version": "1.0",
  "metadata": {
    "title": "Apple ra mắt iPhone 17 với camera 200MP",
    "source": {
      "url": "https://vnexpress.net/iphone-17-200mp",
      "domain": "vnexpress.net",
      "image": "https://i1-vnexpress.vnecdn.net/iphone17.jpg"
    },
    "channel": "Công nghệ 24h"
  },
  "voice": { "provider": "lucylab", "voiceId": "${VIETNAMESE_VOICEID}", "speed": 1.0 },
  "scenes": [
    {
      "id": "hook", "type": "hook",
      "voiceText": "Thầy chào các bạn nhỏ. Hôm nay thầy cùng các con tìm hiểu iPhone mười bảy. Apple vừa ra mắt iPhone mười bảy với camera hai trăm megapixel.",
      "visual": {
        "background": { "type": "image", "src": "$source.image", "kenBurns": "zoom-in" },
        "overlay":    { "darkness": 0.4 },
        "text": {
          "position": "center", "style": "hook-large",
          "lines": [
            { "content": "iPhone 17",     "emphasis": "primary", "animation": "scale-pop" },
            { "content": "Camera 200MP!", "emphasis": "accent",  "animation": "slide-up-bounce" }
          ]
        },
        "effects": ["flash-white-3f", "particle-burst"]
      }
    }
    /* ... 3 body scenes + outro ... */
  ]
}
```

### Example 2: .txt file with no image (local)

User: `/create-news-video news/agi-update.txt`

Generated `script.json` (excerpt):
```json
{
  "metadata": {
    "title": "OpenAI công bố mô hình mới với khả năng lập luận",
    "source": { "url": "local", "domain": "local", "image": null },
    "channel": "Công nghệ 24h"
  },
  "scenes": [
    {
      "id": "hook", "type": "hook",
      "voiceText": "Thầy chào các bạn nhỏ. Hôm nay thầy cùng các con tìm hiểu mô hình mới của OpenAI. OpenAI vừa công bố mô hình mới có khả năng lập luận như con người.",
      "visual": {
        "background": { "type": "gradient", "preset": "news-dark" },
        "text": {
          "position": "center", "style": "hook-large",
          "lines": [
            { "content": "Mô hình mới", "emphasis": "primary", "animation": "scale-pop" },
            { "content": "Lập luận!",  "emphasis": "accent",  "animation": "slide-up-bounce" }
          ]
        },
        "effects": ["flash-white-3f"]
      }
    }
    /* ... outro line 3 = "Nguồn: local" ... */
  ]
}
```
Note: when source has no image, every scene uses `background.type = "gradient"` (no image fallback at composer level needed).

## Sound Effects (SFX)

**You almost never need to set the `sfx` field.** The pipeline has a smart 3-tier selector that picks the right SFX for each scene automatically:

1. **If `scene.sfx` is set** → use exactly that (override).
2. **Else, scan `voiceText` for semantic keywords**:
   - `cảnh báo / rủi ro / nguy hiểm / warning` → `alert/`
   - `kỷ lục / vượt / xuất sắc / breakthrough / success` → `success/`
   - `thất bại / sai / lỗi / fail / wrong` → `fail/`
   - `ra mắt / công bố / lần đầu / launch / unveil` → `reveal/`
   - `đếm ngược / tích tắc / countdown` → `countdown/`
   - `hùng vĩ / hoành tráng / cinematic / epic` → `cinematic/`
   - `hồi hộp / chờ đợi / drumroll / suspense` → `drumroll/`
3. **Else, fall back to template default category**:
   - `hook` → `transition/` or `cinematic/`
   - `comparison` → `transition/` or `emphasis/`
   - `stat-hero` → `emphasis/` or `success/`
   - `feature-list` → `transition/` or `emphasis/`
   - `callout` → `alert/` or `drumroll/`
   - `outro` → `outro/` or `success/`

Within a category, the actual file is picked **deterministically** by hashing the scene id — same script gives same SFX (idempotent), but different scenes in the same video get different files (variety).

**This means:** in 95% of cases you should OMIT the `sfx` field entirely. Just write good Vietnamese voiceText with natural keywords (warning, breakthrough, launch, etc.) and the pipeline will pick the right sound.

### When to add explicit `sfx` override

Only when you want to FORCE a specific sound that the keyword matcher won't infer:
- Scene needs a particular signature sound (e.g., always a gong on important scenes)
- Disable SFX for a particular scene: `"sfx": { "name": "none" }`
- Use a specific file: `"sfx": { "name": "transition/whoosh-sfx", "volume": 0.4 }`

Example (rarely needed):
```json
{
  "id": "body-3",
  "voiceText": "...",
  "templateData": { ... },
  "sfx": { "name": "drumroll/snare-roll", "volume": 0.5, "startOffsetSec": 0.2 }
}
```

The pipeline auto-mixes a sound effect at each scene start based on the template type:

| Template | Default SFX | Sound character |
|---|---|---|
| `hook` | `transition/whoosh-soft` | Dramatic entrance |
| `comparison` | `transition/swoosh` | Side-by-side reveal |
| `stat-hero` | `emphasis/ding` | Number reveal |
| `feature-list` | `transition/pop` | Bullet appearance |
| `callout` | `alert/notification` | Important info |
| `outro` | `outro/tada` | Ending signature |

**You usually do NOT need to add a `sfx` field** — defaults work for 95% of cases.

**ONLY add an explicit `sfx` override when content STRONGLY suggests a different mood:**

| Content cue (in voiceText) | Override |
|---|---|
| "cảnh báo", "rủi ro", "đáng lo", "nguy hiểm" | `{ "name": "alert/notification", "volume": 0.4 }` |
| "vượt", "kỷ lục", "xuất sắc", "tăng mạnh" (positive stat) | `{ "name": "emphasis/chime", "volume": 0.35 }` |
| Want to disable SFX for this scene | `{ "name": "none" }` |

Place `sfx` at the same level as `voiceText` and `templateData`:

```json
{
  "id": "body-3",
  "type": "body",
  "voiceText": "Cảnh báo: AI tự chủ có thể đặt ra rủi ro về an ninh mạng.",
  "templateData": { "template": "callout", ... },
  "sfx": { "name": "alert/notification", "volume": 0.4 }
}
```

Available SFX categories (any `<name>` subfolder in `assets/sfx/<category>/<name>.mp3`):
- `transition/` — whoosh, swoosh, swish, pop, punch, page-flip, slide, riser
- `emphasis/` — ding, tick, chime, ping, bong, pop, punch
- `alert/` — notification, alert, alarm, warning
- `success/` — applepay, achievement, win, xbox, steam, jet-set
- `fail/` — wrong-answer-buzzer, incorrect, error, dank-meme
- `outro/` — tada, win31, noooo
- `reveal/` — magic-fairy, anime-girl, hey-female-voice
- `drumroll/` — snare, drum-roll, boom
- `countdown/` — beep, timer
- `cinematic/` — rise, impact

Browse `assets/sfx/<category>/` to see exact filenames. Reference WITHOUT the `.mp3` extension. Example:
```json
{ "sfx": { "name": "success/xbox-360-achievement-sound", "volume": 0.4 } }
```

## Edge cases

| Situation | Action |
|---|---|
| URL paywall / JS-rendered → WebFetch returns no content | Tell user: "Không đọc được URL (có thể do paywall hoặc JS). Hãy lưu nội dung vào file .txt rồi gọi lại." Stop. |
| URL content < 200 words | Warn "Tin gốc ngắn, video có thể không đủ chất liệu", continue anyway |
| URL content > 2000 words | Summarize to key points, fit ~150-200 words script |
| File mode + file empty/missing | Error message, don't create output dir |
| Pipeline fails | Report error message + output dir path; user can re-try `npm run pipeline -- <path>` after fixing |
