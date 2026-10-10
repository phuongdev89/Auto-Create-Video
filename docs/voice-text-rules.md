# Mandatory rules for `voiceText`

The `voiceText` field is read aloud by Vbee/LucyLab/ElevenLabs Vietnamese TTS. **Numbers and symbols are read literally** — if you write "5.5", TTS may say "năm rưỡi" (five and a half — WRONG for version numbers). **Always spell out numbers in Vietnamese phonetic form** in Vietnamese `voiceText`; the verbatim English problem segment follows the separate English-reading rules below. The `templateData` fields (visual text on screen) can keep the original "5.5" / "82.7%" formatting.

**Mandatory rules for `voiceText`:**

- Use a male TTS voice. When addressing or teaching the audience, always use **"thầy"** and call viewers **"các bạn nhỏ"**, **"các em"**, or **"các con"**. Never use **"cô"** in scripts, narration, subtitles, or UI cards.
- Spell out every number and mathematical sign in Vietnamese, including whole numbers, years, and numbers in brand/version names. Write `cộng`, `trừ`, `nhân`, `chia`, `bằng` instead of mathematical symbols.
- Keep `voiceText` free of emoji, Markdown, and URLs. Visual text may retain numbers and symbols but must follow the same personal-pronoun rules.

| Number form | WRONG (TTS misreads) | RIGHT (spell out in Vietnamese) |
|---|---|---|
| Decimal version | `GPT 5.5` → "năm rưỡi" ❌ | `GPT năm chấm năm` ✅ |
| Decimal stat | `82.7%` | `tám mươi hai phẩy bảy phần trăm` |
| Version | `iPhone 17` | `iPhone mười bảy` |
| Version with point | `iOS 18.2` | `iOS mười tám chấm hai` |
| Tech spec | `200MP` | `hai trăm megapixel` |
| Battery | `5000mAh` | `năm nghìn miliampe giờ` |
| Tokens | `1M tokens` / `1000000 tokens` | `một triệu token` |
| Price VND | `21 triệu đồng` | `hai mươi mốt triệu đồng` |
| Price USD | `$5` | `năm đô la` (or `năm đô`) |
| Multiplier | `2x` | `gấp đôi` (more natural than "hai lần") |
| Year | `2026` | `hai nghìn không trăm hai mươi sáu` |
| Percentage with decimal | `30%` | `ba mươi phần trăm` |
| Time | `60 giây` | `sáu mươi giây` |
| Frequency | `5G` | `năm gờ` (be careful — TTS often says "năm-gờ") |

**Notation choices:**
- For version numbers, read the decimal point as `chấm`; for decimal statistics, use `phẩy`.
- For thousands separators, read the whole value; do not pronounce the separator (e.g. "1,000" → "một nghìn").
- For ratio "3:1" → say `ba trên một` or `ba so với một`

**English brand names — keep as-is**, TTS handles them OK:
- `Apple`, `Google`, `OpenAI`, `Microsoft`, `TikTok`, `YouTube` ✅

**English acronyms — write phonetically if TTS misreads:**
- `AI` → usually OK, sometimes write `ây ai` for clarity
- `API` → write `ây pi ai` if matter
- `GPT` → usually OK; if not, write `gí pi tí`
- `iOS` → write `ai ô ét` if matter
- `AMO` → write `a mờ ô` if matter
- `TIMO` → write `ti mô` if matter
- `FMO` → write `ép mờ ô` if matter
- `ASMO` → write `a ét mờ ô` if matter
- `SEAMO` → write `si mờ ô` if matter
- `HKIMO` → write `hát ca i mờ ô` if matter
- `KANGAROO` → write `căng ga ru` if matter
- `IKMC` → write `i ca mờ cê` if matter

**Symbols to AVOID in voiceText:**
- `→` `&` `%` `$` `#` `+` `-` `=` `*` `/` (TTS may say literal name or skip)
- `!` `?` at end of sentence is OK — they create natural intonation
- Emoji: NEVER (TTS pronounces or skips inconsistently)
- URLs: NEVER (TTS reads dot/slash literally)

**End each `voiceText` sentence with `.` or `?`** for natural pause/intonation.

**Examples — full scene:**

WRONG (will sound bad):
```json
{ "voiceText": "GPT 5.5 đạt 82.7% trên Terminal-Bench, vượt GPT 5.4 (75.1%)." }
```
→ TTS reads: "GPT năm rưỡi đạt tám mươi hai chấm bảy phần trăm trên Terminal-Bench..."

RIGHT (natural):
```json
{ "voiceText": "GPT năm chấm năm đạt tám mươi hai phẩy bảy phần trăm trên Terminal Bench, vượt phiên bản năm chấm bốn ở mức bảy mươi lăm phẩy một." }
```

**Note**: `templateData` (text on screen) CAN use original formatting — the visual is separate from spoken:
```json
{
  "voiceText": "GPT năm chấm năm đạt tám mươi hai phẩy bảy phần trăm.",
  "templateData": {
    "template": "stat-hero",
    "value": "82.7%",                 ← Visual: keep readable formatting
    "label": "Terminal-Bench"
  }
}
```

## Trình tự mở đầu, đọc đề và kết thúc (bắt buộc)

- Mọi video phải mở đầu bằng lời chào, sau đó nói rõ hôm nay sẽ làm gì; chỉ sau hai phần này mới vào nội dung. Ví dụ: "Thầy chào các bạn nhỏ. Hôm nay thầy cùng các con giải bài toán về phép cộng."
- Nếu đề bài là tiếng Anh, tuân thủ đúng thứ tự:
  1. Chào người xem bằng tiếng Việt.
  2. Thông báo hôm nay sẽ học hoặc giải bài gì bằng tiếng Việt.
  3. Thông báo sẽ bắt đầu đọc nguyên văn đề tiếng Anh. Ví dụ: "Trước tiên, thầy sẽ đọc nguyên văn đề bài bằng tiếng Anh."
  4. Đọc toàn bộ đề tiếng Anh nguyên văn bằng **Vbee TTS**, giọng `VBEE_VOICE_CODE_EN=am_echo`, với tốc độ **0.9×**. Lời Việt dùng `VBEE_VOICE_CODE_VI` khi provider là Vbee.
  5. Đọc bản dịch đầy đủ, chính xác sang tiếng Việt bằng giọng nam tiếng Việt; áp dụng quy tắc `voiceText` tiếng Việt cho bản dịch.
  6. Chỉ sau khi đọc xong cả đề tiếng Anh và bản dịch tiếng Việt mới bắt đầu giải thích, giải bài hoặc hướng dẫn làm bài.
- Giữ nguyên nội dung, thứ tự câu, số và ký hiệu của đề tiếng Anh; không dịch, tóm tắt hoặc phiên âm tiếng Việt cho đoạn nguyên văn này. Quy tắc viết số/ký hiệu bằng chữ tiếng Việt chỉ áp dụng cho lời dẫn, bản dịch và phần giảng tiếng Việt.
- Tạo audio tiếng Anh riêng bằng Vbee với `VBEE_VOICE_CODE_EN` và speed `0.9`, rồi ghép đúng vị trí timeline. Không đưa nguyên văn tiếng Anh qua giọng Việt. Thiếu cấu hình Vbee thì báo lỗi trước khi gọi TTS Việt; không tự đổi provider.
- Hiển thị đề gốc khi đọc tiếng Anh và bản dịch khi đọc tiếng Việt; căn thời lượng cảnh/phụ đề theo âm thanh thực tế. Không cắt ngắn đề hoặc bản dịch để ép video vào mốc khoảng sáu mươi giây.
- Cuối mọi video phải có lời chúc phù hợp với nội dung, ở câu cuối cùng. Ví dụ: "Thầy chúc các con học tốt và luôn vui vẻ." Nếu có lời kêu gọi theo dõi, đặt trước lời chúc.
- Đề gốc, bản dịch, audio và tệp trung gian dùng một lần đều nằm trong `output/<session>/`; helper script nằm trong thư mục con `scripts/`.
