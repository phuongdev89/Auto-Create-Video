# Quy tắc lời thoại giải toán

Nội dung giảng phải theo [quy tắc sư phạm toán](math-pedagogy-rules.md); tài liệu
này quy định cách chuyển nội dung đó thành lời đọc và trình tự video.

Đây là quy tắc dùng chung cho `voiceText` tiếng Việt trong kịch bản toán version
`2.0`. Lời đọc và text hiển thị là hai phần riêng: text trên hình có thể giữ chữ
số, ký hiệu toán và icon; lời đọc viết số và phép toán bằng chữ.

## Giọng đọc và cách xưng hô

- Dùng giọng nam của provider đang cấu hình. Khi giảng hoặc nói với người xem,
  luôn xưng **thầy**; gọi người học là **các em**, **các con** hoặc **các bạn nhỏ**.
- Không dùng **cô** trong kịch bản, lời đọc, phụ đề hoặc nội dung hiển thị.
- Với Vbee, lời Việt dùng `VBEE_VOICE_CODE_VI`, đề gốc tiếng Anh dùng
  `VBEE_VOICE_CODE_EN=am_echo`. Hai giọng đều theo persona nam.

## Viết lời đọc tiếng Việt

- Viết tất cả chữ số và ký hiệu toán thành chữ: cộng, trừ, nhân, chia, bằng,
  lớn hơn, nhỏ hơn, phần trăm. Không đưa công thức LaTeX vào `voiceText`.
- Không dùng emoji, Markdown hoặc URL trong lời đọc.
- Kết thúc mỗi câu bằng dấu chấm hoặc dấu chấm hỏi để ngắt nghỉ tự nhiên.
- Dùng đúng thuật ngữ toán, đọc đầy đủ đơn vị và điều kiện; không đổi nội dung
  đề khi chuyển từ ký hiệu sang lời nói.

| Hiển thị | Lời đọc |
|---|---|
| `2x + 5 = 17` | hai nhân x cộng năm bằng mười bảy |
| `3.5` hoặc `3,5` (số thập phân) | ba phẩy năm |
| `1/2` | một phần hai |
| `x²` | x bình phương |
| `√9` | căn bậc hai của chín |
| `30%` | ba mươi phần trăm |
| `3:1` (tỉ lệ) | ba so với một |
| `1 000` (số nguyên) | một nghìn |
| `12 cm²` | mười hai xăng ti mét vuông |

Tên kỳ thi có thể viết theo cách đọc nếu TTS đọc sai: AMO → a mờ ô,
TIMO → ti mô, FMO → ép mờ ô, ASMO → a ét mờ ô, SEAMO → si mờ ô,
HKIMO → hát ca i mờ ô, KANGAROO → căng ga ru, IKMC → i ca mờ cê.

Ví dụ tách lời đọc và công thức hiển thị:

```json
{
  "voiceText": "Thầy trừ năm ở cả hai vế để giữ phương trình tương đương.",
  "templateData": {
    "template": "math-step",
    "title": "Trừ 5 ở hai vế",
    "equations": ["2x + 5 - 5 = 17 - 5"]
  }
}
```

## Trình tự mở đầu, đọc đề và kết thúc (bắt buộc)

- Mọi video: chào → nói hôm nay học/làm gì → nội dung → lời chúc. Ví dụ:
  "Thầy chào các em. Hôm nay thầy cùng các em tìm hiểu cách giải phương trình."
- Đề tiếng Anh phải theo đúng thứ tự:
  1. Chào bằng tiếng Việt.
  2. Nói hôm nay học hoặc giải bài gì.
  3. Thông báo đọc nguyên văn tiếng Anh.
  4. Đọc toàn bộ đề bằng Vbee TTS nam, `VBEE_VOICE_CODE_EN=am_echo`, tốc độ `0.9×`.
  5. Đọc bản dịch Việt đầy đủ, chính xác bằng giọng nam tiếng Việt.
  6. Bắt đầu lời giải hoặc hướng dẫn sau cả đề gốc và bản dịch.
- Đề gốc tiếng Anh dùng `englishText` với `voiceText` rỗng. Giữ nguyên nội dung,
  thứ tự câu, số và ký hiệu; không dịch, tóm tắt hoặc phiên âm đoạn này. Quy tắc
  viết số bằng chữ tiếng Việt không áp dụng cho nguyên văn tiếng Anh.
- Tạo audio tiếng Anh riêng bằng Vbee rồi ghép đúng timeline. Không đưa nguyên
  văn tiếng Anh qua giọng Việt. Thiếu cấu hình Vbee phải dừng trước TTS Việt;
  không tự đổi provider.
- Hiển thị đề gốc khi đọc tiếng Anh, bản dịch khi đọc Việt. Căn thời lượng cảnh
  theo audio thực tế; giữ đầy đủ nội dung, không ép thời lượng một phút.
- CTA nếu có đặt trước lời chúc. Câu cuối là lời chúc phù hợp, ví dụ:
  "Thầy chúc các em học tốt và luôn tự tin khi giải toán."
- Tất cả tệp dùng một lần ở `output/<session>/`, helper ở `scripts/` của session.

## Hai cách giải

Trước khi giải, hỏi bằng lựa chọn bấm theo [workflow](math-video-workflow.md),
mục "Chọn cách giải".

- `answer`: trình bày đầy đủ lời giải, kiểm tra và đáp án trước lời chúc.
- `guided`: hướng dẫn phương pháp và các bước, để người học tự hoàn thành bước
  quyết định. Chỉ hướng dẫn cách tự kiểm tra, không đọc nghiệm để thay lại.
  Kết thúc nội dung bằng câu hỏi hoặc nhiệm vụ tự làm (`practice`), rồi lời chúc.

Với `guided`, rà soát lời đọc, công thức, tiêu đề, sơ đồ và phụ đề để không lộ
đáp án cuối hoặc phương án trắc nghiệm đúng. Không hoàn tất lời giải rồi chỉ
bỏ cảnh kết luận. Lời giải đầy đủ lưu riêng trong `solution.md` phục vụ kiểm
chứng nội bộ và không được chia sẻ với người xem ở chế độ này.
