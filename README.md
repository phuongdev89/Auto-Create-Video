# Auto Math Video — Giải toán và hướng dẫn giải

Nhận bài toán từ văn bản, file, ảnh hoặc URL; giải và kiểm chứng, rồi tạo video
giảng bài bằng giọng nam tiếng Việt, công thức LaTeX và sơ đồ. Hỗ trợ từ tiểu học
đến các chủ đề nâng cao mà agent có thể giải và kiểm chứng.

## Chọn cách giải

Khi nhận bài toán, agent hiển thị câu hỏi **Bạn muốn giải bài toán theo cách nào?**
với hai lựa chọn để bạn bấm:

| Lựa chọn | Nội dung bài giảng | `solutionMode` |
|---|---|---|
| **Giải ra đáp án** | Giải từng bước, kiểm tra, công bố kết quả | `answer` |
| **Hướng dẫn giải và để ngỏ đáp án** | Giải thích cách làm, hướng dẫn các bước và cách tự kiểm tra; để người học tự hoàn thành đáp án cuối | `guided` |

Agent chờ bạn chọn trước khi giải hoặc viết kịch bản. Chế độ hướng dẫn không
tiết lộ đáp án cuối trong lời đọc, hình, phụ đề hay phản hồi. Agent vẫn giải và
kiểm chứng nội bộ. Với bài đang làm tiếp, giữ lựa chọn đã chọn; bài mới sẽ hỏi lại.

## Bắt đầu

Yêu cầu Node.js từ version 22, FFmpeg và ffprobe trong PATH. HyperFrames dùng
Chromium để dựng video. Cài dependencies và tạo cấu hình:

```powershell
npm install
Copy-Item .env.example .env.local
```

Trong agent mở tại dự án:

```text
/create-math-video Giải bài toán: Tìm x biết 2x + 5 = 17.
```

Skill hiện có tại `.agents/skills/create-math-video/` và
`.claude/skills/create-math-video/`. Nếu chưa thấy skill, mở phiên mới trong dự án.
Xem [workflow chi tiết](docs/math-video-workflow.md) và
[quy tắc lời thoại](docs/voice-text-rules.md). Nội dung giảng tuân thủ
[quy tắc sư phạm toán](docs/math-pedagogy-rules.md): phù hợp kiến thức nền,
giải thích lý do từng bước, gợi ý vừa đủ và hướng dẫn tự kiểm tra. Tài liệu có ví dụ
cho cả hai chế độ và các điểm cần rà soát trước khi trả bài hoặc gọi TTS.

## Cấu hình giọng đọc

Điền `.env.local`, chọn `TTS_PROVIDER` và một giọng **nam** thực tế từ thư viện
provider. Giọng giảng xưng **thầy**, gọi người học là các em, các con hoặc các bạn
nhỏ. Không ghi API key vào kịch bản. CLI đọc `.env.local`, dùng `.env` làm cấu hình
nền; biến môi trường đã đặt bên ngoài có ưu tiên cao hơn.

| Provider tiếng Việt | Biến bắt buộc |
|---|---|
| `lucylab` | `VIETNAMESE_API_KEY`, `VIETNAMESE_VOICEID` |
| `elevenlabs` | `ELEVENLABS_API_KEY`, `ELEVENLABS_VOICE_ID` |
| `vbee` | `VBEE_APP_ID`, `VBEE_ACCESS_TOKEN`, `VBEE_CALLBACK_URL` |

Với Vbee, chọn `VBEE_VOICE_CODE_VI` (ví dụ
`n_hanoi_male_sizonguyen_education_vc`) và `VBEE_SPEED`. Callback phải là URL
webhook HTTP(S) công khai; pipeline tự polling trạng thái để tải MP3.
`TTS_CONCURRENCY=1` là cấu hình mặc định.

Đề tiếng Anh dùng Vbee riêng: cấu hình App ID, token, callback và
`VBEE_VOICE_CODE_EN=am_echo`, kể cả khi lời Việt dùng LucyLab hoặc ElevenLabs.
Tiếng Anh đọc nguyên văn ở tốc độ `0.9×`; thiếu cấu hình sẽ dừng trước TTS tiếng
Việt. LucyLab có thể trả SRT; ElevenLabs và Vbee không trả SRT trong luồng hiện tại.

## Nội dung và kịch bản

Luồng tạo video: đề bài → chọn cách giải → agent giải và kiểm chứng nội bộ →
`script.json` version `2.0` → TTS từng cảnh → timeline theo audio → HTML/CSS/GSAP
và KaTeX → HyperFrames check → MP4 dọc 1080×1920, 30 fps.

- Mở đầu bằng lời chào, sau đó nói hôm nay học gì.
- Đọc đầy đủ đề, giữ giả thiết, đơn vị, điều kiện xác định và các trường hợp.
- Chế độ đáp án: hướng giải → lời giải → kiểm tra → đáp án.
- Chế độ hướng dẫn: hướng giải → các bước gợi ý → cách tự kiểm tra → câu hỏi/bước để người học tự hoàn thành.
- Câu cuối là lời chúc của thầy; nếu có CTA thì đặt trước lời chúc.

Đề tiếng Anh: chào và giới thiệu → thông báo đọc đề → nguyên văn tiếng Anh →
bản dịch Việt đầy đủ → giảng bài. Đoạn gốc dùng `englishText`, riêng với
`voiceText` tiếng Việt. Số và phép toán trong lời Việt viết bằng chữ; trên hình
có thể giữ ký hiệu toán. Không ép bài giảng vào một phút hoặc tám cảnh; hỗ trợ
6–100 cảnh với thời lượng theo audio thực tế.

Agent chịu trách nhiệm tính đúng của lời giải. Schema kiểm tra cấu trúc, LaTeX,
lời thoại và thứ tự cảnh; không chứng minh toán học và không tự phát hiện mọi
gợi ý làm lộ đáp án. Agent phải rà soát nội dung chế độ hướng dẫn trước TTS.

| Template | Công dụng |
|---|---|
| `math-intro` | Giới thiệu bài |
| `math-problem` | Đề gốc, bản dịch và công thức |
| `math-step` | Hướng giải, bước giải, kiểm tra hoặc cảnh `practice` |
| `math-diagram` | Đường thẳng, đường tròn, đa giác, nhãn |
| `math-answer` | Đáp án; chỉ dùng với `solutionMode: "answer"` |
| `math-closing` | Lời chúc cuối |

Ví dụ: [phương trình](examples/math/algebra.json),
[hướng dẫn để ngỏ đáp án](examples/math/algebra-guided.json),
[hình học tiếng Anh](examples/math/geometry-english.json),
[tích phân](examples/math/calculus.json).
KaTeX hỗ trợ phân số, căn, số mũ, hệ phương trình, ma trận, tổng và tích phân.
Sơ đồ khai báo trong khung 900×500; hình phức tạp hơn cần mở rộng renderer.

## Chạy pipeline

Trước TTS/render, API kiểm chứng phải đạt. Điền `AUDIT_AI_CHAT_URL`, `AUDIT_AI_KEY`,
`AUDIT_AI_MODEL`, `AUDIT_AI_STREAM` và `AUDIT_AI_TIMEOUT` (giây) trong cấu hình.
Hai lượt API lần lượt giải từ đề gốc và đối chiếu lời giải/kịch bản. Xem
[quy tắc kiểm chứng](docs/math-verification-rules.md). Lỗi, bất đồng hoặc thiếu
bằng chứng chặn sản xuất; không tự cho qua. Báo cáo AI không phải chứng minh hình thức.

Tạo session riêng và sao chép ví dụ phù hợp với lựa chọn:

```powershell
$mathRun = Join-Path 'output' ((Get-Date -Format 'yyyyMMdd-HHmmss') + '-huong-dan-phuong-trinh')
New-Item -ItemType Directory -Path $mathRun
Copy-Item examples/math/algebra-guided.json (Join-Path $mathRun 'script.json')
Copy-Item examples/math/algebra-solution.md (Join-Path $mathRun 'solution.md')
npm run pipeline -- "$mathRun/script.json" --validate
npm run pipeline -- "$mathRun/script.json" --audit
npm run pipeline -- "$mathRun/script.json"
```

`--validate` không gọi TTS và không cần API key. `--no-render` tạo audio/composition
để preview, vẫn yêu cầu audit đạt và gọi TTS khi chưa có audio hợp lệ. `--audit`
chỉ kiểm chứng, không gọi TTS/render; `--audit --force-audit` chạy lại dù có cache.
Pipeline và `rerender` chỉ tái sử dụng pass khớp nội dung hiện tại. CLI nhận kịch bản đã chuẩn bị;
lựa chọn bấm được hiển thị bởi agent trong chat.

```powershell
npm run pipeline -- output/<session>/script.json --no-render
npm run rerender -- output/<session>
```

`rerender` dùng audio cache khớp nội dung và cấu hình giọng. Khi sửa lời đọc,
giọng hoặc provider, chạy pipeline để cập nhật audio; chỉ các cảnh cần đổi được
tạo lại. HyperFrames được cố định ở version 0.8.143 và check trước render video toán.

## Đầu ra và kiểm tra

`output/<session>/` chứa đề gốc, `script.json`, `script.txt`, `voice/`, `voice.mp3`,
`index.html`, `math-styles.css`, `math-assets/` và `video.mp4`. Tệp helper nằm trong
`scripts/` của session. Mọi file tạm, cache và log cùng lượt chạy nằm trong session;
giữ nguyên tệp người dùng và các lượt chạy khác. SFX mặc định tắt.

`solution.md` ghi lời giải và kiểm chứng nội bộ. Trong chế độ hướng dẫn, không
chia sẻ file này hoặc `verification.json`/`verification.md` với người xem vì chứa
đáp án. Các báo cáo ghi lời giải độc lập, bằng chứng đối chiếu, trạng thái và
fingerprint để tránh dùng lại kết quả cũ sau khi sửa bài. Đầu ra công bố chỉ gồm tài liệu
hướng dẫn, lời đọc và video đã kiểm tra không lộ kết quả cuối.

Kiểm tra chữ/công thức, thứ tự đọc, độ đọc được và audio trên MP4 cuối. Phân biệt
bằng chứng schema/test, TTS thật và render thật; mock provider không chứng minh
dịch vụ TTS hoạt động.

| Vấn đề | Cách xử lý |
|---|---|
| Thiếu cấu hình provider | Kiểm tra `TTS_PROVIDER` và các biến trong `.env.local` |
| Thiếu cấu hình Vbee English | Điền App ID, token, callback và giọng tiếng Anh |
| Polling timeout | Kiểm tra provider; chỉnh `LUCYLAB_POLL_TIMEOUT_MS` hoặc `VBEE_POLL_TIMEOUT_MS` nếu cần |
| Không tìm thấy FFmpeg/ffprobe | Cài FFmpeg và thêm vào PATH |
| LaTeX/schema hoặc nội dung không vừa khung | Sửa theo thông báo, chia cảnh nhưng giữ đủ nội dung |
| Audio cache không khớp | Chạy lại pipeline để cập nhật cảnh đã sửa |
| HyperFrames check/render thất bại | Đọc log và kiểm tra composition/Chromium; giữ session để xử lý tiếp |

## Phát triển

```powershell
npm run typecheck
npm test
npm run build
```

Mã chính: `src/pipeline.ts`, `src/render/math-schema.ts`,
`src/render/math-composer.ts`, `src/tts/tts-client.ts`.
