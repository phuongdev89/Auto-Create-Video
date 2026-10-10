# Auto Math Video

Tạo video animation giải toán từng bước bằng giọng nam tiếng Việt, công thức LaTeX và sơ đồ. Workflow chính phục vụ mọi cấp độ: tiểu học, THCS, THPT, Olympic và chủ đề nâng cao mà agent giải/kiểm chứng được.

## Luồng hoạt động

Đề văn bản / file / ảnh / URL → agent giải và kiểm tra → `script.json` version `2.0` → TTS từng cảnh → timeline theo audio thực tế → HTML/CSS/GSAP + KaTeX → HyperFrames check → MP4 1080×1920, 30 fps.

Agent chịu trách nhiệm tính đúng của lời giải. Pipeline kiểm tra cấu trúc, LaTeX, lời thoại và thứ tự đọc đề; không phải máy chứng minh toán học. Xem [workflow chi tiết](docs/math-video-workflow.md).

## Bắt đầu

Yêu cầu Node.js ≥ 22 và FFmpeg/ffprobe trong PATH.

```powershell
npm install
Copy-Item .env.example .env.local
```

Điền cấu hình provider TTS và chọn **giọng nam** thật trong thư viện LucyLab, ElevenLabs hoặc Vbee. Không ghi API key vào kịch bản. CLI đọc `.env.local`, với `.env` là cấu hình nền nếu đã có. Vbee TTS (`VBEE_VOICE_CODE_EN`) chỉ dùng để đọc đề gốc tiếng Anh; thiếu giọng nam tiếng Anh sẽ báo lỗi, không tự đổi provider.

Trong agent mở tại project:

```text
/create-math-video Giải bài toán: Tìm x biết 2x + 5 = 17.
```

Skill nằm trong `.agents/skills`, `.claude/skills` và `.gemini/skills`. Nếu agent chưa thấy skill mới, mở phiên mới trong project.

Hoặc tạo session riêng, sao chép ví dụ và chạy:

```powershell
$mathRun = Join-Path 'output' ((Get-Date -Format 'yyyyMMdd-HHmmss') + '-giai-phuong-trinh')
New-Item -ItemType Directory -Path $mathRun
Copy-Item examples/math/algebra.json (Join-Path $mathRun 'script.json')
npm run pipeline -- "$mathRun/script.json" --validate
npm run pipeline -- "$mathRun/script.json"
```

`--validate` kiểm tra kịch bản mà không gọi TTS. `--no-render` tạo audio/composition để preview và vẫn gọi TTS khi chưa có audio hợp lệ. `npm run rerender -- output/<session>` dựng lại bằng audio cache khớp nội dung/cấu hình giọng.

## Nội dung bài giảng

- Chào và nói hôm nay học gì.
- Đọc đầy đủ đề, xác định dữ kiện và hướng giải.
- Giải từng bước; giữ điều kiện xác định, trường hợp và đơn vị.
- Kiểm tra kết quả, nêu đáp án và bài học rút ra.
- Kết thúc bằng lời chúc của thầy.

Đề tiếng Anh: chào / giới thiệu / thông báo → nguyên văn tiếng Anh bằng Vbee English TTS nam tại 0.9× → bản dịch Việt đầy đủ → lời giải. Đoạn gốc dùng `englishText`, riêng với `voiceText` Việt. Số và phép toán trong lời Việt viết bằng chữ; trên hình giữ ký hiệu toán.

Không ép một phút hoặc tám cảnh. Kịch bản hỗ trợ 6–100 cảnh, thời lượng theo giọng đọc. Chia cảnh để giữ chữ đọc được, không cắt mất đề.

## Template và ví dụ

| Template | Công dụng |
|---|---|
| `math-intro` | Giới thiệu bài |
| `math-problem` | Đề gốc / bản dịch và công thức |
| `math-step` | Bước giải hoặc chứng minh, 0–4 công thức và ghi chú |
| `math-diagram` | Sơ đồ hình học, đường thẳng, đường tròn, đa giác, nhãn |
| `math-answer` | Kết quả và điều cần nhớ |
| `math-closing` | Lời chúc cuối |

- [Phương trình THCS](examples/math/algebra.json)
- [Hình học với đề tiếng Anh](examples/math/geometry-english.json)
- [Tích phân THPT](examples/math/calculus.json)

KaTeX dựng công thức hỗ trợ phân số, căn, số mũ, hệ phương trình, ma trận, tổng và tích phân. Sơ đồ dùng primitive khai báo trong khung 900×500; hình phức tạp hơn cần mở rộng renderer. Asset KaTeX/font và GSAP được sao chép vào session để render không phụ thuộc CDN.

## Đầu ra

`output/<session>/` chứa `script.json`, `script.txt`, `voice/`, `voice.mp3`, `index.html`, `math-assets/` và `video.mp4`. Agent lưu thêm đề gốc và `solution.md`. Tệp dùng một lần nằm trong cùng session; helper scripts ở `scripts/` của session. SFX mặc định tắt cho bài giảng.

MP3 được cache theo lời đọc và cấu hình giọng; sửa nội dung sẽ tạo lại đúng cảnh liên quan. Pipeline dùng HyperFrames 0.8.143 và luôn check video toán trước render.

## Phát triển và tương thích

```powershell
npm run typecheck
npm test
npm run build
```

Mã chính: `src/pipeline.ts`, `src/render/math-schema.ts`, `src/render/math-composer.ts`, `src/tts/tts-client.ts`. Quy tắc lời thoại: [docs/voice-text-rules.md](docs/voice-text-rules.md).

Kịch bản tin tức version `1.0` và `create-news-video` vẫn được giữ để mở lại output cũ. Tài liệu tin tức trước đây được bảo toàn tại [legacy-news-README.vi.md](docs/legacy-news-README.vi.md).
