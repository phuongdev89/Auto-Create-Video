# Workflow chính: video giải toán

Tạo video giảng giải bằng tiếng Việt cho mọi cấp độ: tiểu học, THCS, THPT,
Olympic và các chủ đề nâng cao mà agent giải và kiểm chứng được. Không ép vào
một phút. Không bỏ giả thiết, điều kiện xác định, trường hợp hoặc bước kiểm tra.

## Trách nhiệm

Agent đọc đề, giải và kiểm chứng độc lập. Pipeline kiểm tra cấu trúc/lời thoại,
không phải bộ giải toán hoặc hệ chứng minh. Khi thiếu dữ kiện, ảnh mờ hoặc chưa
kiểm chứng được đáp án, báo rõ; không dựng video khẳng định kết quả chưa có căn cứ.
Đọc [quy tắc lời thoại](voice-text-rules.md) trước khi viết kịch bản.

Nhận đề văn bản, file, ảnh hoặc URL. Chép đúng toàn bộ đề, hình, đơn vị và lựa chọn.
Giữ nguyên bản gốc, lưu bản sao và solution.md trong output/<session>/. solution.md
ghi giả thiết, lời giải, đáp án và cách kiểm tra: thay nghiệm, tính độc lập, điều kiện
xác định, đơn vị, xét trường hợp hoặc chứng minh. Với trắc nghiệm ghi cả giá trị và
phương án. Không chỉ đoán chữ cái.

## Kịch bản version 2.0

Schema: ../src/render/math-schema.ts. Ví dụ chạy được: ../examples/math/algebra.json,
geometry-english.json, calculus.json.

- metadata: title, channel; source tùy chọn, không cần bài báo hoặc ảnh nền.
- problem: original, language (vi/en), answer (LaTeX), topic/level tùy chọn.
  translation bắt buộc với đề tiếng Anh.
- voice: provider, voiceId, gender: male, speed. Dùng ${VOICE_ID} để lấy giọng
  môi trường. Chọn giọng nam thực tế trong thư viện provider; không suy đoán giới
  tính từ ID không có mô tả. LucyLab/ElevenLabs dùng tốc độ mặc định client, Vbee
  dùng VBEE_SPEED. Không tự thay giọng người dùng đã cấu hình.
- scenes: id an toàn/duy nhất, type (hook/body/outro), phase, voiceText, templateData.
  Từ sáu đến một trăm cảnh; chia đoạn dài thành cảnh nhỏ nhưng giữ toàn bộ nội dung.
  Thời lượng dựa trên audio. Bài rất dài có thể chia video khi người dùng đồng ý.

Thứ tự tiếng Việt: introduction → problem → strategy (tùy chọn) → solution
(nhiều cảnh nếu cần) → check → answer → closing.

Đề tiếng Anh: introduction (chào, nói hôm nay làm gì, thông báo đọc tiếng Anh) →
read-english → read-translation → strategy → solution → check → answer → closing.
Có thể chia đề/bản dịch thành nhiều cảnh liên tiếp, giữ đầy đủ nguyên văn khi ghép.
read-english dùng englishText và voiceText rỗng; math-problem.text đúng englishText.
Pipeline dùng Vbee English TTS (`VBEE_VOICE_CODE_EN=am_echo`) tại 0.9×, rồi đọc bản dịch bằng
TTS nam tiếng Việt. Thiếu cấu hình Vbee tiếng Anh thì dừng trước TTS Việt, không thay provider.

## Template

| Template | Dữ liệu |
|---|---|
| math-intro | title, subtitle tùy chọn |
| math-problem | title, text nguyên văn, latex tùy chọn |
| math-step | title, explanation, equations (0–4 LaTeX; nếu không có công thức phải có explanation hoặc note), note tùy chọn |
| math-diagram | title, shapes, explanation/latex tùy chọn |
| math-answer | title, answer LaTeX đúng problem.answer, explanation/takeaway tùy chọn |
| math-closing | title, message có lời chúc |

KaTeX hỗ trợ phân số, căn, số mũ, hệ phương trình, ma trận, tổng và tích phân.
Dùng cú pháp KaTeX; công thức sai bị chặn trước TTS. Không dùng raw HTML/JS.
Chia công thức dài thành bước đọc được. Bộ fit báo lỗi nếu nội dung không vừa
ở kích thước đọc được, không âm thầm cắt mất đề.

Sơ đồ SVG khai báo trong khung 900×500: line (from/to), circle (center/radius),
polygon (points), label (at/text), màu ink/blue/green/orange. Ghi nhãn, dấu góc vuông
chính xác. Sơ đồ không thay chứng minh. Hình phức tạp ngoài primitive này cần mở
rộng renderer có kiểm chứng; không nhúng SVG vào text.

## Chạy

Tạo script trong output/<session>/ rồi chạy từ root:

```powershell
npm run pipeline -- output/<session>/script.json --validate
npm run pipeline -- output/<session>/script.json
```

--validate không gọi TTS và không cần API key. --no-render tạo audio/composition
để preview, vẫn gọi provider khi thiếu audio. Video toán qua hyperframes check
trước render. SFX mặc định tắt; có thể bật qua scene.sfx.

Cache MP3 toán theo nội dung và cấu hình giọng. Đổi lời đọc/giọng/provider sẽ tạo lại
audio liên quan. rerender từ chối cache không khớp; chạy pipeline để cập nhật.
Tất cả helper scripts, audio, logs, preview và composition ở output/<session>/;
script trong scripts/ của session. Giữ nguyên tệp gốc và các session khác.

Kiểm tra đáp án, chữ, độ đọc được và audio trên MP4 cuối. Báo riêng bằng chứng
schema/test, Vbee English TTS, provider TTS và render. Mock không chứng minh TTS thật.

## Tương thích

Version 1.0 và create-news-video giữ để mở output cũ; không áp dụng các kiểm tra
hoặc giao diện dành riêng cho version 2.0.
