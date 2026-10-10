# ISSUE-001 — Implementation evidence, 2026-10-10

Branch `codex/video-concepts`, baseline `d28151f`; checkout was clean before edits.
No commit, push or merge. No OpenMontage code copied. No AI video/image/TTS provider added.
QA artifacts and helpers: `output/20261010-issue001-direction/` (local, ignored by Git).

## News survey before implementation

Historical design: `51dcebd` (kinetic typography / four body layouts), `7f4e6d1`
(template dispatch), `cde47b2` (outro hold). Current retained source:

- `src/render/html-composer.ts`: `renderHookInner`, `renderComparisonInner`,
  `renderStatHeroInner`, `renderFeatureListInner`, `renderCalloutInner`, `renderScene`.
  Keep large headlines, paired cards, data hierarchy and template-specific layout dispatch.
- `src/render/templates/animations.js`: `animateComparison` and `animateFeatureList`:
  opposing card motion, rule reveal and ordered information. Keep the paused GSAP timeline.
- `src/render/templates/styles.css`: hook/comparison/stat/list/callout layout families.
- Do not import the news scene count, duration bounds, TikTok follow card, background image
  provider, shimmer or SFX into a math lesson. Legacy news code remains unchanged.

## Implemented direction

`math-direction.ts` selects five scene roles, each with concept-specific layout:

| Role | News | Detective | Neon Lab |
|---|---|---|---|
| Bookend | large editorial headline | case cover | lab title |
| Problem | data brief with ruled text | dossier with document panel | input cell |
| Reasoning | numbered analysis cards | evidence rail with pinned cards | connected process cells |
| Check | editorial comparison column | double-rule evidence ledger | test chamber |
| Result/practice | takeaway panel | case summary | output cell |

Meaningful paired operation: use only the same explicitly supplied signed integer tail
in a simple equality. For the audited guided subtraction fixture, `−5` lands at the same
time on both sides. News brings it from opposing margins, Detective pins it from above,
Neon materializes it in operand cells. No result is computed. Complex LaTeX stays intact.
Neon SVG strokes use the existing geometry and declared order, not invented assumptions.

`scene-plan.json` is emitted by production pipeline and rerender using measured audio.
Plans include subject, role/layout, treatment, initial/change/emphasis/exit and timing.
QA comparison plans are explicitly `simulated-no-TTS`, five seconds per scene.
Final timing is a proportional schedule inside each measured audio slot, not word alignment.

## Evidence by layer

- Typecheck passed; Vitest 16 files / 157 tests passed (`typecheck.log`, `tests.log`).
- HTTP tests: all six offered concepts; unknown/classic selection rejected; only
  `visualConcept` changes; custom metadata preserved; stale script returns 409;
  cross-origin save rejected; solution/audit/script/traversal paths return 404.
- Guided render tests: no final answer field/scene, no inferred object count, no `x = 6`.
  Production audit and mock TTS/cache regression tests remain passing. These are fixture/API
  evidence, not a universal proof that arbitrary free text cannot reveal an answer.
- Audited guided fixture was copied from the existing `guided-no-leak` session. Its live
  pass was checked against current fingerprint for all three concepts with nock networking
  disabled. Zero new audit or TTS requests; a cache miss would fail instead of charging.
- Real Codex browser: desktop 1280×1000, mobile 390×844; switched scene tab, sought preview,
  selected/saved Neon Lab, saw success; saved JSON has `visualConcept: neon`.
  `gallery-desktop.jpg`, `gallery-mobile.jpg` preserve visible evidence.
- Browser backward seek Home → End → Home: both operation nodes have opacity 0 → 1 → 0
  for every concept; transforms reset to each concept's distinct initial pose.
  `browser-seek.json` contains DOM evidence. Reads follow AX observation so iframe
  postMessage has been delivered before asserting state.
- HyperFrames **0.8.143**, current according to check metadata. News/Detective/Neon each:
  12 actual layout samples including operation boundaries, zero runtime/layout errors,
  57/57 contrast checks. Each has **9 lint warnings**: one `timeline_track_too_dense`
  plus eight `nested_structure_needs_subcomposition`. Full `check.json` read.
  `motion.enabled=false`, so zero motion errors is **not** a motion-assertion pass.
- Separate geometry renderer fixture: four diagram timestamps, zero runtime/layout
  errors, 48/48 contrast checks, nine organization warnings; progressive stroke PNGs
  inspected. This is schema/renderer QA only, not a newly audited production lesson.
- Three real local MP4s: `news/sample.mp4`, `detective/sample.mp4`, `neon/sample.mp4`.
  H.264 1080×1920, 15 fps, 45.133 seconds (root 45.1; frame rounding), AAC synthetic
  silence. Render summary: screenshot capture / hardware GPU. Encoded frame at 19s
  extracted and visually inspected for all three, not just HTML screenshots.
- Real `rerender.ts` on a **copy** of the existing growing-triangle session, changed only
  visual concept to Neon. Original untouched. Current audit and per-scene voice cache
  accepted with HTTP networking blocked. `scene-plan.json` uses measured cached audio.
  H.264 1080×1920, 30 fps, 137.233 seconds versus root 137.2195, AAC audio.
  Render summary: drawElement capture / hardware GPU. Nine sample check: zero runtime /
  layout errors, 59/59 contrast; **14 lint warnings** (12 nested scene warnings,
  one dense track, one `composition_heavy_overlay_count_high`). Full report retained.
  Audio decodes with nonzero signal (`audio-check.log`). Rebuilt `voice.mp3` SHA256 is
  identical to the original session (`F91A80FD002EE6016178AA6FE4BEDC91A5451BCAB09E6F7A4D81A0B7D40F8ABB`). No new TTS call and no claim
  of a fresh listening/linguistic review of the entire existing narration.

## Remaining limits / not accepted as evidence

- Aesthetic excellence is not established by tests. The gallery and MP4s are ready for
  human visual review; this issue is not declared fully aesthetically accepted.
- No newly generated live TTS or independent live audit in this run. Existing live audit
  and audio caches were reused and checked; the three comparison samples use silence.
- Word/sentence cue alignment is not implemented. Current motion follows measured scene
  slots and content order; inspect rhythm with each real lesson before production delivery.
- Paired algebra action covers explicit simple equalities with matching signed integer
  tails. Fractions, nested/aligned equations, cancellation, grouping and division need
  future explicit teaching-data animation. They currently receive readable ordered reveals.
- Dense single-file timeline warnings remain to preserve current pipeline compatibility.
  The 12-scene cached rerender also has the heavy-overlay warning. No unrelated
  sub-composition refactor was performed; do not call check warning-free.
- No character acting, AI video, Manim, Blender, paid retries/fallbacks or new providers.

NO EVIDENCE = NO PASS: browser/HTTP, mock providers, cached real audit/audio and local
encoded MP4 evidence are explicitly distinguished above.

## Bổ sung theo yêu cầu: duyệt lời giải/audit và progress realtime (2026-10-10)

- Workflow/AGENTS và hai skill Codex/Claude đã đồng bộ: chọn solutionMode → giải đầy đủ → audit → hiện lời giải cùng báo cáo thực tế cho người tạo → concept → TTS/render. Guided vẫn giữ đáp án ngoài lesson/gallery; trang progress là phần duyệt riêng có khóa.
- `npm run progress -- output/<session>` mở server loopback trước khi có script. Giữ terminal xuyên suốt task, URL lưu trong `progress.url`; nhận/giải cập nhật bằng progress CLI, audit/concept/pipeline/rerender tự cập nhật các giai đoạn khi session bật progress. Server không gọi provider.
- SSE cập nhật mỗi 500 ms và tự reconnect; tự nhận solution.md, verification.md, composition preview phát/dừng/seek, frames/latest.png và video.mp4. Cập nhật frame không reset iframe preview. Server đọc theo allowlist, kiểm tra realpath/Host/origin, yêu cầu khóa riêng/cookie, không cho tải raw solution/audit/script qua media URL.
- Typecheck pass; 18 file / 162 tests pass. Skill validation Codex/Claude pass. `git diff --check` pass (chỉ thông báo LF/CRLF). Logs: `output/20261010-progress-review/typecheck.log`, `tests.log`.
- HTTP thực tế trong test: khởi động chưa có script, truy cập không khóa 403, origin khác 403, private media/traversal 404, SSE nhận lời giải + fail audit + trạng thái dừng, MP4 byte range 206/416, frame 200.
- Browser thật: stage/lời giải/audit/frame/MP4 xuất hiện sau khi mở trang mà không reload; seek 380/1000 hiện cảnh trừ ở hai vế, Phát/Dừng hoạt động. Video mẫu hiện metadata 1080×1920, 45.133333 giây, readyState 4. Thay frame vẫn giữ iframe src. Screenshot: `output/20261010-progress-review/progress-browser.jpg`. Nội dung audit trên trang QA được gắn unverified, không dùng làm bằng chứng đúng toán.
- CLI audit thực tế offline: chặn toàn bộ networking bằng nock; bản sao lesson/cache có sẵn pass, in đầy đủ lời giải và audit, ghi rõ dùng lại cache pass khớp. Khi thiếu ảnh gốc, verifier ghi unverified, in lỗi ENOENT và CLI dừng. Logs riêng `cached-audit/audit-cli.log`, `cached-audit/audit-missing-input.log` dưới session QA. Không có audit provider/TTS mới, không tiêu credit.
- Giới hạn: chưa stream frame trực tiếp từ HyperFrames, chưa có phần trăm render đo từ renderer; hiện preview timeline và frame thực tế do task xuất. Giai đoạn nhận/giải do agent chủ động cập nhật, không tự phân tích nội dung chat. Không có live audit/provider mới trong lượt QA này; MP4/frame dùng lại bằng chứng render đợt trước. Trang riêng có thể chứa đáp án guided, không chia sẻ với học sinh.

## Bổ sung: HTML responsive và đầu ra dọc/ngang (2026-10-10)

- AGENTS/workflow/skill Codex và Claude yêu cầu HTML fit viewport/resize, luôn giao video-portrait.mp4 (1080×1920) và video-landscape.mp4 (1920×1080); video.mp4 giữ alias dọc. Pipeline/rerender dùng chung audit/audio/timing, chuẩn bị landscape/index.html cùng assets và formats.json. Chỉ Done sau khi render đủ hai bản; --no-render chỉ tạo composition, không gọi là có MP4.
- Composition toán ngang reflow: rail tiêu đề bên trái, vùng làm bài bên phải. HTML vẫn giữ kích thước export cố định; responsive fit toàn canvas trên màn hình nhỏ, không phải đổi lời giải theo viewport. Legacy news giữ canvas dọc trong khung ngang (pillarbox); chưa kiểm chứng render legacy ngang và chưa có thiết kế ngang riêng cho news legacy.
- Typecheck và 19 file /164 tests pass. Test orchestration giữ guided không có answer scene ở cả hai HTML; test dual renderer xác nhận dùng chung audio, hai export, alias dọc và lỗi horizontal khiến cặp chưa hoàn tất. Logs output/20261010-responsive-dual/typecheck.log và tests.log.
- Render thực tế Neon guided fixture có sẵn, timing QA rút ngắn, audio im lặng tự tạo: video-portrait.mp4 và video-landscape.mp4 đều H264/15fps, AAC, thời lượng 11.133333 giây; ffprobe xác nhận lần lượt 1080×1920 và 1920×1080. Cùng voice.mp3, không có TTS/audit provider mới hoặc credit. Đây là renderer QA, không phải bài giảng sản xuất có lời đọc mới. Render log và probe JSON nằm trong session.
- HyperFrames check cho hai bản Neon trong lượt dual render đạt; kiểm tra riêng horizontal Neon/News/Detective tám mốc thời gian đạt 0 runtime/layout errors, mỗi bản còn 9 lint warnings về cấu trúc timeline. Không tuyên bố warning-free hoặc thẩm mỹ đã được người dùng duyệt. Asset guard từng chặn helper QA dùng ../voice.mp3; đã sửa helper/copy audio vào từng project, kiểm tra lại đạt. Production dual helper luôn copy assets/audio nội bộ.
- Browser thật: progress hiện đồng thời hai iframe/video, seek chung tới bước trừ hai vế; video readyState 4, metadata khớp ffprobe. Mô phỏng mobile 390×844 bằng CDP xác nhận innerWidth=scrollWidth=390, iframe dọc 270px, ngang 318px; resize không crop canvas. API viewport thông thường không áp dụng được trên IAB lượt này, nên dùng CDP rồi clear override. Screenshot dual-preview.jpg và mobile-preview.jpg trong session.
- Chưa kiểm chứng cặp rerender sản xuất mới với lời đọc thật trong lượt này; bằng chứng audio cache thật ở phần trước vẫn riêng. Bài dài/dense cần check/duyệt cả hai bố cục cho từng bài; check không tự đảm bảo mọi bài toán tương lai sẽ fit hoặc đẹp.
