# Quy Tắc Cho Agent (AGENTS.md)

## Workflow chính: giải toán

- Ưu tiên `/create-math-video` cho mọi cấp độ. Đọc [workflow](docs/math-video-workflow.md).
- Dùng kịch bản version `2.0`, giải và kiểm chứng trước khi dựng video.
- Tuân thủ [quy tắc kiểm chứng toán](docs/math-verification-rules.md). Lưu lời giải đầy đủ vào `solution.md`, chạy `--audit` qua `AUDIT_AI_*`; chỉ tiếp tục khi báo cáo nội bộ đạt `pass`. Không công bố `solution.md` hoặc `verification.*` cho học sinh/người xem video ở chế độ hướng dẫn.
- Khi bắt đầu task, mở trang progress riêng cho session theo mục "Progress realtime xuyên suốt task" trong workflow; giữ server chạy từ nhận đề đến hoàn tất. Cập nhật giai đoạn giải/audit/concept/TTS/render, dùng preview/frame thực tế khi có; không gắn nhãn preview là MP4 đã render.
- Đọc và áp dụng [quy tắc sư phạm toán](docs/math-pedagogy-rules.md) trước khi viết lời giảng; rà soát mục cuối tài liệu trước khi trả bài hoặc gọi TTS.
- Không ép bài giảng vào một phút/tám cảnh. Giữ đầy đủ đề, giả thiết và bước kiểm tra.
- Khi nhận yêu cầu giải toán, trước khi giải hoặc viết kịch bản phải hiển thị lựa chọn để người dùng bấm: **Giải ra đáp án** / **Hướng dẫn giải và để ngỏ đáp án**. Đọc mục "Chọn cách giải" trong [workflow](docs/math-video-workflow.md) và chờ người dùng chọn; không tự chọn mặc định.
- Lưu lựa chọn vào `solutionMode` của kịch bản. Chế độ hướng dẫn giữ đáp án cuối ngoài lời đọc, hình, phụ đề và kết quả trả cho người xem; vẫn giải và kiểm chứng nội bộ.
- Sau khi người dùng chọn cách giải: giải đầy đủ → audit → hiển thị lời giải và kết quả audit thực tế trong chat cho người tạo, trước chọn concept/TTS/render. Áp dụng cả yêu cầu giải toán bằng văn bản. Đọc mục "Duyệt lời giải và audit" trong workflow. Phần duyệt riêng cho người tạo được hiển thị đầy đủ kể cả `guided`; không đưa vào nội dung cho học sinh, video, phụ đề hoặc gallery. Audit chưa đạt vẫn phải báo lỗi/điểm chưa chắc chắn và dừng sản xuất.
- Với video mới, cho người dùng xem và chọn concept theo [quy tắc concept](docs/video-concepts.md) trước TTS/render; lưu `visualConcept`, dùng lại khi tiếp tục cùng bài.

## Persona, Voice & Personal Pronouns

- **Voice**: The voice model is permanently set to a **male voice** (`n_hanoi_male_sizonguyen_education_vc` or other male TTS voices).
- **Personal Pronoun Rule**:
  - **ALWAYS** use the personal pronoun **"thầy"** (teacher - male) when addressing students/audience or explaining solutions.
  - **NEVER** use **"cô"** under any circumstances in generated scripts, `voiceText`, subtitles, or UI cards.
  - Call students/viewers: *"các bạn nhỏ"*, *"các em"*, or *"các con"*.

## TTS Scripting Rules
- Spell out all numbers and mathematical signs in Vietnamese words within `voiceText` (e.g. *"hai mươi tư"*, *"cộng"*, *"trừ"*, *"chia"*).
- Keep `voiceText` free of emojis, mathematical symbols (`+ - = %`), and URLs.
- Render on-screen visuals and subtitles with matching terminology (**"thầy"**, never **"cô"**).
- Kết thúc mỗi câu bằng dấu chấm hoặc dấu chấm hỏi để ngắt nghỉ tự nhiên.
- Text hiển thị (`templateData`, HTML/SVG, phụ đề) có thể dùng chữ số, ký hiệu và icon; lời đọc tiếng Việt vẫn viết bằng chữ.
- Luôn sản xuất HTML responsive (fit toàn bộ canvas khi viewport thay đổi, không crop bài). Mỗi lần xuất video phải có cả bản dọc 9:16, 1080 × 1920 và bản ngang 16:9, 1920 × 1080. Không giao chỉ một tỷ lệ. Dùng chung nội dung/audio đã audit; kiểm tra bố cục cả hai bản. `video.mp4` giữ alias bản dọc để tương thích; đầu ra chính là `video-portrait.mp4` và `video-landscape.mp4`.
- Dùng `VBEE_VOICE_CODE_VI` cho lời tiếng Việt và `VBEE_VOICE_CODE_EN=am_echo` cho nguyên văn tiếng Anh. Hai giọng đều dùng persona nam; tiếng Anh đọc ở `0.9×`.

## Tệp dùng một lần khi tạo video

- Mỗi lượt chạy task tạo video dùng một thư mục riêng `output/<session>/` trong dự án; `<session>` là mã lượt chạy duy nhất (ví dụ `YYYYMMDD-HHmmss-<slug>`). Tiếp tục cùng lượt chạy thì dùng lại session đó.
- Nếu cần code ra tệp script để sử dụng, phải tạo và chạy script trong `output/<session>/scripts/`.
- Toàn bộ tệp dùng một lần phải nằm trong cùng `output/<session>/`: script hỗ trợ, HTML/composition, JSON/cấu hình, bản sao đầu vào, tài nguyên tải về cho task, tệp tạm, cache của script, log, preview và audio/video trung gian. Có thể tạo thư mục con bên trong session.
- Chỉ định rõ đường dẫn đầu ra, tệp tạm và cache của script vào session; đọc tài nguyên dùng chung từ đường dẫn dự án. Không đặt tệp dùng một lần ở thư mục gốc, `scripts/` dùng chung, `src/` hoặc thư mục skill.
- Giữ nguyên tệp người dùng và tài nguyên dùng chung đã có. Chỉ thêm/sửa mã tái sử dụng ngoài session khi task yêu cầu thay đổi mã dự án để tái sử dụng.

## Mở đầu, đọc đề tiếng Anh và lời chúc cuối video

Bắt buộc đọc và tuân thủ [quy tắc lời thoại chung](docs/voice-text-rules.md), mục "Trình tự mở đầu, đọc đề và kết thúc".

- Mọi video: chào hỏi → nói hôm nay làm gì → nội dung → kết thúc bằng lời chúc.
- Nếu đề bằng tiếng Anh: chào hỏi → nói hôm nay làm gì → thông báo đọc đề tiếng Anh → đọc nguyên văn đề bằng Vbee với `VBEE_VOICE_CODE_EN` ở tốc độ `0.9×` → đọc bản dịch tiếng Việt → bắt đầu vào bài.
- Đoạn đề tiếng Anh giữ nguyên văn, tách khỏi `voiceText` tiếng Việt; quy tắc viết số và ký hiệu bằng chữ tiếng Việt không áp dụng cho đề gốc tiếng Anh.
