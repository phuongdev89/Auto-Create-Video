# Kiểm chứng lời giải toán qua API độc lập

Áp dụng cho kịch bản toán version `2.0`, ở cả chế độ đáp án và hướng dẫn. Agent
chính vẫn chịu trách nhiệm đọc đúng đề và giải thích đúng; bộ kiểm chứng AI bổ
sung một lượt đánh giá độc lập, không phải hệ chứng minh hình thức.

## Cấu hình

Dùng các biến `AUDIT_AI_*` trong `.env.local` hoặc `.env`:

| Biến | Ý nghĩa |
|---|---|
| `AUDIT_AI_CHAT_URL` | Base URL tương thích OpenAI, thường kết thúc bằng `/v1`; cũng nhận URL đầy đủ `/chat/completions` |
| `AUDIT_AI_KEY` | API key thật; không ghi vào script, log hoặc báo cáo |
| `AUDIT_AI_MODEL` | Model kiểm chứng của provider được chọn |
| `AUDIT_AI_STREAM` | `true` hoặc `false`; client đọc được cả JSON và SSE |
| `AUDIT_AI_TIMEOUT` | Tổng số giây tối đa cho mỗi lượt API, mặc định 300 |

Model kiểm chứng nên thuộc hãng khác model giải bài. Mã hiện tại gửi đúng model
đã cấu hình, không tự xác minh hãng đằng sau gateway và không tự đổi provider
khi lỗi. Hỗ trợ giao thức Chat Completions tương thích OpenAI, chưa có adapter
native cho Gemini hoặc Anthropic. Không cần cấu hình TTS để chạy riêng `--audit`.

## Đầu vào trong session

- `script.json`: đề đầy đủ và kịch bản đã qua `--validate`.
- `solution.md`: lời giải đầy đủ, điều kiện, các trường hợp, đáp án và phép kiểm
  tra độc lập; tối đa 1 MiB. Với bài chứng minh phải có các bước suy luận và điều
  kiện áp dụng định lý. File này bắt buộc kể cả khi không công bố đáp án.
- Nếu đề có hình cần thiết, sao chép hình gốc vào session và khai báo
  `problem.imagePaths`, ví dụ `["input/problem.png"]`. Hỗ trợ PNG/JPEG/WebP,
  tối đa 10 ảnh, mỗi ảnh không quá 10 MiB. Ảnh được gửi trong cả hai lượt API và
  gắn vào fingerprint theo nội dung; không dùng sơ đồ do agent tự dựng thay hình gốc.

PDF đề bài cần trích trang liên quan thành ảnh hoặc chép đầy đủ dữ kiện trước;
client hiện chưa gửi PDF trực tiếp. Đối chiếu đề gốc với bản chép để tránh hai
model cùng giải một đề bị chép sai. Nếu đề chỉ có văn bản, gửi đủ nguyên văn.

## Hai lượt kiểm chứng

1. **Giải độc lập:** chỉ gửi đề gốc, ngôn ngữ, chủ đề/trình độ nếu có và ảnh gốc.
   Không gửi đáp án của agent chính, `solution.md`, bản dịch do agent viết hoặc
   kịch bản. AI trả đáp án, các bước có lý do, điều kiện, phép kiểm tra cụ thể
   và điểm chưa chắc chắn. Thiếu dữ kiện hoặc chưa giải được thì dừng ở `uncertain`.
2. **Đối chiếu:** tạo request mới, gửi đề gốc, lời giải độc lập, `solution.md` và
   nội dung kịch bản. Kiểm tra từng bước quan trọng, điều kiện/các trường hợp,
   đáp án, bản dịch, nội dung giảng và việc không lộ đáp án ở chế độ hướng dẫn.
   Đáp án đúng nhưng suy luận sai phải bị báo lỗi.

Kết quả JSON phải có bằng chứng ở từng mục. Hệ thống chặn báo cáo thiếu mục,
thiếu bằng chứng, có lỗi hoặc còn điểm chưa kiểm tra. Nội dung bằng chứng vẫn
do model tạo ra và có thể sai; JSON hợp lệ hoặc hai model đồng ý không chứng
minh bài giải đúng. Các prompt nằm trong `src/audit/prompts.ts`, có version để
khi đổi tiêu chí thì kết quả cũ không còn được tái sử dụng.

## Kiểm tra theo loại bài

| Loại bài | Cách kiểm tra cần yêu cầu |
|---|---|
| Số học, bài toán có lời văn | Tính lại hoặc tính ngược; kiểm tra đơn vị và độ hợp lý |
| Phương trình/hệ phương trình | Thay nghiệm vào đề gốc; kiểm tra nghiệm ngoại lai, mất nghiệm và điều kiện |
| Bất phương trình | Kiểm tra dấu, điều kiện và từng khoảng; thử điểm không thay chứng minh |
| Hình học/chứng minh | Kiểm tra từng suy luận, định lý và giả thiết; hình vẽ không chứng minh kết luận |
| Xác suất/tổ hợp | Rà soát đếm trùng/bỏ sót; liệt kê trường hợp nhỏ khi phù hợp |
| Đạo hàm/tích phân | Kiểm tra miền xác định và thao tác tính ngược phù hợp |

API hiện không có công cụ thực thi code. Không coi câu "đã chạy Python" do AI
viết là bằng chứng thực thi. Agent có thể chạy phép kiểm tra riêng, lưu helper
trong `output/<session>/scripts/` và ghi kết quả thực tế vào `solution.md` trước
khi audit. Với bài khó chưa đủ căn cứ, cần kiểm tra chuyên môn bổ sung.

## Trạng thái và bước sản xuất

| Trạng thái | Ý nghĩa | TTS/render |
|---|---|---|
| `pass` | Lượt giải độc lập hoàn tất và mọi mục đối chiếu đạt, không lỗi/điểm chưa giải quyết | Được tiếp tục |
| `fail` | Phát hiện lỗi hoặc báo cáo có bằng chứng không đạt dù tự ghi pass | Bị chặn |
| `uncertain` | Chưa giải được, thiếu mục đối chiếu hoặc còn mâu thuẫn/điểm chưa kiểm tra | Bị chặn |
| `unverified` | Thiếu cấu hình/đầu vào, API lỗi/timeout, JSON/SSE hoặc schema không hợp lệ | Bị chặn |

Không lấy đa số phiếu làm kết luận đúng. Khi bất đồng, đọc bằng chứng, sửa lời
giải/kịch bản hoặc bổ sung kiểm tra rồi audit lại; không tự đổi nhãn thành pass.
Hệ thống không tự sửa bài và không tự lặp gọi API khi bị fail/timeout.

## Chạy và lưu bằng chứng

```powershell
npm run pipeline -- output/<session>/script.json --validate
npm run pipeline -- output/<session>/script.json --audit
npm run pipeline -- output/<session>/script.json
```

`--validate` chỉ kiểm tra cấu trúc, không kiểm chứng toán và không gọi API.
`--audit` chỉ kiểm chứng, không gọi TTS hoặc render. Pipeline bình thường và
`rerender` kiểm tra kết quả audit trước khi sản xuất, kể cả `--no-render`.

Trong session có `verification.json` (báo cáo và cache) và `verification.md`
(bản đọc được), gồm model, endpoint, thời điểm, fingerprint, lời giải độc lập,
bằng chứng đối chiếu và lỗi nếu có. Đây là file nội bộ vì chứa đáp án đầy đủ;
không trả link hoặc nội dung cho học sinh/người xem video ở chế độ `guided`.
Người tạo được xem phần duyệt lời giải đầy đủ và kết quả audit trong chat/terminal
trước chọn concept/TTS/render; đọc mục "Duyệt lời giải và audit" trong workflow.
Không đưa phần duyệt riêng này vào gallery hoặc artifact bài giảng cho học sinh.

Chỉ tái sử dụng pass có fingerprint khớp đề, ảnh, lời giải, nội dung bài giảng,
model/endpoint và prompt. Sửa bất kỳ phần liên quan nào sẽ audit lại. Đổi giọng
TTS hoặc SFX không làm thay đổi nội dung kiểm chứng. Có thể yêu cầu chạy mới:

```powershell
npm run pipeline -- output/<session>/script.json --audit --force-audit
```

Khi bắt đầu chạy mới, pass cũ được vô hiệu hóa trước khi gọi API. File báo cáo
cục bộ không có chữ ký chống sửa đổi; cơ chế này ngăn dùng nhầm kết quả cũ trong
workflow thông thường, không phải bằng chứng chống giả mạo.

## Đánh giá provider trước khi tin cậy rộng rãi

Dùng cùng bộ bài có kết quả đã kiểm tra để so sánh provider/model, gồm bài đúng,
sai đáp án, đáp án đúng nhưng lập luận sai, thiếu điều kiện, nghiệm ngoại lai,
bỏ sót trường hợp và hướng dẫn làm lộ đáp án. Ghi số lỗi phát hiện, số bài đúng
bị chặn nhầm, thời gian và chi phí. Một vài smoke test API chỉ xác nhận tích hợp
và các trường hợp đã thử, không thay thế đánh giá năng lực toán trên bộ bài lớn.
