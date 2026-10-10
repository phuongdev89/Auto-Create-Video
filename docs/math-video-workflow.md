# Workflow chính: video giải toán

Tạo video giảng giải bằng tiếng Việt cho mọi cấp độ: tiểu học, THCS, THPT,
Olympic và các chủ đề nâng cao mà agent giải và kiểm chứng được. Không ép vào
một phút. Không bỏ giả thiết, điều kiện xác định, trường hợp hoặc bước kiểm tra.

## Trách nhiệm

Agent đọc đề, giải và kiểm chứng độc lập. Pipeline kiểm tra cấu trúc/lời thoại,
không phải bộ giải toán hoặc hệ chứng minh. Khi thiếu dữ kiện, ảnh mờ hoặc chưa
kiểm chứng được đáp án, báo rõ; không dựng video khẳng định kết quả chưa có căn cứ.
Đọc [quy tắc lời thoại](voice-text-rules.md) trước khi viết kịch bản.
Đọc [quy tắc kiểm chứng toán](math-verification-rules.md). Sau khi có lời giải
đầy đủ và kịch bản, chạy `--audit`: API giải độc lập từ đề gốc rồi đối chiếu bài
giảng. `--validate` chỉ kiểm tra cấu trúc; TTS/render cần báo cáo audit `pass`
khớp nội dung hiện tại. Thiếu cấu hình hoặc bằng chứng phải dừng.
Đọc [quy tắc sư phạm toán](math-pedagogy-rules.md) để chọn cách giải thích phù hợp
kiến thức nền, giải thích lý do của bước làm và xác định phần tự làm trong chế độ
hướng dẫn. Rà soát mục cuối tài liệu trước khi trả bài hoặc gọi TTS.

## Progress realtime xuyên suốt task

Ngay khi bắt đầu task, tạo `output/<session>/` rồi chạy ở terminal riêng, trước
khi có script hoặc lời giải:

```powershell
npm run progress -- output/<session>
```

Ngay sau khi lệnh khởi động, agent phải gửi nguyên liên kết Progress trong tin nhắn cập nhật cho người tạo và mở liên kết đó. Liên kết cũng lưu trong `progress.url`. Server loopback
chạy tới khi người tạo dừng bằng Ctrl+C, không tự tắt khi pipeline xong/lỗi.
Liên kết có khóa riêng và cookie chỉ đọc; không chia sẻ với học sinh vì trang
hiển thị toàn bộ `solution.md` và `verification.md`, kể cả guided. Concept
gallery vẫn không phục vụ các file này. Không có endpoint gọi provider.

Agent cập nhật trạng thái khi nhận đề, chờ lựa chọn, giải và tự kiểm tra:

```powershell
npm run progress -- output/<session> "Đang giải" "Đang xét điều kiện và kiểm tra các trường hợp."
```

`--audit`, `--concepts`, pipeline và rerender cập nhật giai đoạn tương ứng nếu
session đã có progress. SSE phát hiện thay đổi file mỗi nửa giây; trình duyệt
tự kết nối lại. Agent vẫn phải trình bày lời giải/audit trong chat theo mục
dưới; progress không thay thế việc hỏi/chờ lựa chọn cách giải hoặc concept.

Khi có `index.html`, trang hiện preview HyperFrames/GSAP với phát/dừng/seek;
khi có `frames/latest.png`, hiện frame mới nhất; khi có `video.mp4`, hiện player
MP4 hỗ trợ seek. File xuất hiện muộn sẽ được thêm mà không tải lại trang.
Đây là preview composition và frame được task xuất ra, chưa phải luồng frame
trực tiếp hay phần trăm hoàn thành từ HyperFrames renderer. Không dựng tiến
độ giả hoặc tự gọi TTS/render để tạo preview. Có thể ghi đè frame mới nhất
trong session khi task đã chụp frame thật.

## Xác định lớp trước khi giải

Nếu đầu vào hoặc người dùng đã nêu lớp/trình độ rõ ràng, dùng thông tin đó; không hỏi lại khi tiếp tục cùng bài. Nếu chỉ có đề, hoặc chỉ biết tiểu học/THCS/THPT mà chưa biết lớp, agent phải tự phân tích trước khi giải: chủ đề, kiến thức tiên quyết, loại phép toán, ký hiệu, yêu cầu chứng minh và cách giải phù hợp. Không suy lớp chỉ từ độ lớn con số, tên file hoặc một từ khóa. Lớp suy đoán là khuyến nghị sư phạm, không khẳng định nguồn gốc đề hay chương trình chính thức.

Sau phân tích, hiển thị câu hỏi bấm chọn **Bạn muốn thầy giảng bài này cho lớp mấy?**. Nêu khoảng lớp phù hợp và một lý do ngắn; mỗi lớp trong khoảng là một lựa chọn riêng, đánh dấu **Lớp N (Khuyến nghị)**. Ví dụ: “Kiến thức cần dùng là phương trình một ẩn; đề có thể phù hợp lớp 6–8. Thầy đề xuất lớp 7.” Các con số trong ví dụ chỉ minh họa, agent phải suy luận lại từ đề thực tế. Khi kiến thức không thuộc phổ thông, đưa lựa chọn trình độ tương ứng, không ép thành lớp 1–12. Nếu còn mơ hồ, đưa khoảng rộng hơn và nói rõ điểm chưa chắc; người dùng có thể nhập lớp/trình độ khác.

Dùng `request_user_input_async` với các nhãn lớp trong `options`; có thể gộp câu hỏi lớp và câu hỏi cách giải trong một lần gọi, mỗi câu hỏi giữ lựa chọn riêng. Chờ câu trả lời thật cho cả hai trước khi giải, viết kịch bản hoặc gọi TTS/render; lựa chọn đánh dấu sẵn không phải xác nhận. Trong lúc chờ chỉ đọc đề và rà soát dữ kiện. Cập nhật progress “Chờ chọn lớp và cách giải”. Nếu không có công cụ chọn, hiển thị lựa chọn bằng văn bản và chờ.

Lưu phân tích vào `output/<session>/grade-selection.json`: `source` (`inferred` hoặc `provided`), `suggestedGrades`, `recommendedGrade`, `reason`, `confidence`, `selectedGrade`. `selectedGrade` chỉ ghi sau câu trả lời thật (hoặc thông tin rõ ràng đã có trong đầu vào). Ghi lớp đã chọn vào `problem.level` của script, ví dụ `Lớp 7`; không ghi lớp khuyến nghị thay cho lớp người dùng chọn. Dùng lớp đã chọn để điều chỉnh phương pháp, thuật ngữ, kiến thức được phép dùng và lời giảng. Nếu người dùng đổi lớp sau khi audit, rà soát lại bài giảng và audit khi nội dung thay đổi.

## Chọn cách giải

Khi nhận yêu cầu giải toán (kể cả chưa yêu cầu video), trước khi giải hoặc viết
kịch bản, hiển thị câu hỏi **Bạn muốn giải bài toán theo cách nào?** với đúng hai
lựa chọn để bấm:

- **Giải ra đáp án** → `solutionMode: "answer"`: giải đầy đủ, kiểm tra và công bố đáp án.
- **Hướng dẫn giải và để ngỏ đáp án** → `solutionMode: "guided"`: giải thích phương pháp,
  hướng dẫn các bước cần thiết, để người học tự hoàn thành bước quyết định/đáp án cuối.

Dùng công cụ hỏi có lựa chọn của môi trường chat: Codex ưu tiên
`request_user_input_async` với `questions` gồm một câu hỏi và `options` là hai nhãn
trên; dùng `request_user_input` nếu có và được phép trong chế độ hiện tại.
Claude Code dùng `AskUserQuestion` nếu có. Chỉ khi môi trường không hỗ trợ lựa
chọn bấm mới hỏi bằng văn bản có đánh số hai lựa chọn và chờ trả lời.
Không xem lựa chọn được đánh dấu sẵn hoặc hết thời gian chờ là câu trả lời;
không tự mặc định và không giải/đọc TTS/render khi câu hỏi chưa được trả lời.
Có thể đọc đề và kiểm tra dữ kiện trong khi chờ. Khi tiếp tục cùng bài đã chọn,
dùng lại lựa chọn; khi nhận bài mới phải hiển thị lựa chọn lại.

Trong cả hai chế độ, agent vẫn giải và kiểm chứng nội bộ. Với `guided`, lưu lời
giải đầy đủ trong `solution.md` để kiểm tra nội bộ, không đưa file/nội dung đáp án
đó vào kết quả trả cho người xem. Không lộ đáp án qua lời đọc, tiêu đề, công thức,
sơ đồ, phụ đề, lựa chọn trắc nghiệm được đánh dấu, kiểm tra thay nghiệm hoặc lời chúc.
Không chỉ bỏ cảnh đáp án sau khi đã đọc nghiệm ở bước trước. Cảnh `check` hướng dẫn
cách tự kiểm tra khi người học có kết quả; cảnh `practice` giao bước còn lại hoặc
câu hỏi để người học tự hoàn thành. Rà soát nội dung trước TTS: schema không thể
chứng minh một lời gợi ý có vô tình tiết lộ kết quả hay không.

Nhận đề văn bản, file, ảnh hoặc URL. Chép đúng toàn bộ đề, hình, đơn vị và lựa chọn.
Giữ nguyên bản gốc, lưu bản sao và solution.md trong output/<session>/. solution.md
ghi giả thiết, lời giải, đáp án và cách kiểm tra: thay nghiệm, tính độc lập, điều kiện
xác định, đơn vị, xét trường hợp hoặc chứng minh. Với trắc nghiệm ghi cả giá trị và
phương án. Không chỉ đoán chữ cái.

## Duyệt lời giải và audit

Thứ tự bắt buộc: nhận đề → xác định lớp (phân tích và hỏi/chờ nếu thiếu) → hỏi/chờ chọn cách giải → giải và tự kiểm tra →
chuẩn bị bản nháp kịch bản cho verifier → validate/audit → hiển thị phần duyệt
cho người tạo → chọn concept (nếu tạo video) → TTS/render khi audit đạt.
Không đi thẳng từ lựa chọn cách giải sang concept hay sản xuất. Yêu cầu chỉ giải
toán bằng văn bản cũng phải giải, audit và trình bày kết quả trước khi trả bài.

Sau khi audit kết thúc, hiển thị **ngay trong chat**, không chỉ trả link hoặc câu
"đã pass":

- Lời giải đầy đủ: giả thiết, điều kiện, các bước có lý do, đáp án và phép kiểm tra.
- Kết quả audit thực tế: trạng thái `pass/fail/uncertain/unverified`, model,
  thời điểm, chạy mới hay dùng cache khớp; bằng chứng đối chiếu suy luận, điều kiện,
  đáp án và việc không lộ đáp án guided; nêu lỗi/mâu thuẫn/điểm chưa kiểm chứng.

Đây là **phần duyệt riêng cho người tạo video**, có thể chứa lời giải đầy đủ và
đáp án kể cả `guided`, theo yêu cầu người tạo. Nó không phải bài giảng trả cho
học sinh: video, lời đọc, phụ đề, gallery và phần hướng dẫn cho người học vẫn
giữ đáp án cuối ngoài nội dung. Không phục vụ file nội bộ qua concept server.

`--audit` in lời giải và báo cáo thực tế ở terminal dành cho người tạo, kể cả khi
audit không đạt. Agent đọc báo cáo đó và trình bày phần duyệt trong chat. Không
dùng kết quả validate/mock thay cho audit thật. Nếu audit lỗi hoặc chưa đạt,
báo trạng thái và vấn đề thực tế, dừng TTS/render; không tự ghi nhãn pass.
Khi sửa nội dung toán, audit lại và hiển thị kết quả cập nhật trước khi tiếp tục.
Trình bày phần duyệt không tự tạo thêm một bước hỏi xác nhận; vẫn giữ bước
chọn concept rõ ràng như quy định.

## Chọn concept video

Với bài mới có yêu cầu video, sau khi đã giải, audit và hiển thị phần duyệt cho người tạo,
cho người dùng xem concept bằng chính nội dung bài: **News / Đồ họa biên tập**, **Thám tử**,
**Neon Lab**, cùng **Bảng phấn**, **Vở ô ly**, **Đồ vật trực quan** để tương thích.
Đọc [quy tắc concept](video-concepts.md). Chạy:

```powershell
npm run pipeline -- output/<session>/script.json --concepts
```

Mở URL loopback được in ra, xem ba khung Đề bài/Bước giải/Kết thúc và bấm
**Sử dụng concept này** để lưu `visualConcept` vào kịch bản. Chờ người dùng chọn;
không xem radio được đánh dấu sẵn là chấp thuận. Khi tiếp tục cùng bài, dùng lại
concept đã lưu. Chọn xong dừng server bằng Ctrl+C rồi validate/audit/TTS/render.
Preview chuyển động dùng timing giả lập, có Phát/Tạm dừng/seek, không có audio thật,
không gọi provider và chưa chứng minh lời giải
đúng. Chỉ có yêu cầu giải toán bằng văn bản thì không cần bước concept video.

## Kịch bản version 2.0

### HTML responsive và hai video bắt buộc

Mọi HTML composition phải fit toàn bộ canvas theo viewport, cập nhật khi resize;
không crop công thức/hình. Preview mobile/desktop không đổi timeline hoặc nội dung
đã audit. Kích thước xuất cố định theo metadata của mỗi composition.

Pipeline và rerender luôn chuẩn bị hai bản: `index.html` dọc 1080×1920 và
`landscape/index.html` ngang 1920×1080. Bản ngang bài toán dùng rail tiêu đề bên
trái và vùng làm bài bên phải, không kéo giãn hình dọc. `formats.json` ghi các
đường dẫn/kích thước. Dùng chung audio, lời đọc, audit và scene timing; không
gọi TTS thêm chỉ vì đổi tỷ lệ. News script legacy dùng canvas dọc đặt trong
khung ngang để tương thích; cần duyệt bố cục riêng khi nâng thiết kế legacy.

Đầu ra render bắt buộc gồm `video-portrait.mp4` và `video-landscape.mp4`.
`video.mp4` vẫn là bản dọc để tương thích. Chỉ báo hoàn tất sau khi cả hai render
thành công; nếu một bản lỗi, báo thiếu bản đó và chưa giao đủ đầu ra. `--no-render`
chỉ xuất cặp composition/audio, không được gọi là đã giao hai video. Kiểm tra
hai HTML trên browser, seek timeline, check layout và ffprobe cả hai MP4.
Progress hiển thị preview/video của cả hai tỷ lệ khi file đã có.

Schema: ../src/render/math-schema.ts. Ví dụ chạy được: ../examples/math/algebra.json,
geometry-english.json, calculus.json.

- solutionMode: `answer` hoặc `guided`, đúng lựa chọn người dùng. Kịch bản cũ
  thiếu trường này được pipeline hiểu là `answer`; agent luôn ghi rõ cho bài mới.
- metadata: title, channel; source tùy chọn, không cần bài báo hoặc ảnh nền.
- visualConcept: `news`, `detective`, `neon`, `chalkboard`, `notebook` hoặc `manipulatives`, đúng lựa chọn đã lưu.
  Kịch bản cũ thiếu trường này dùng `classic` để giữ bố cục cũ.
- problem: original, language (vi/en), topic/level tùy chọn. `answer` (LaTeX)
  bắt buộc với `answer`, phải bỏ hẳn với `guided`.
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

Với `guided`: introduction → problem → strategy → solution (các bước hướng dẫn,
không hoàn tất đáp án cuối) → check (cách tự kiểm tra) → practice → closing.
`strategy` bắt buộc; đúng một cảnh `practice` dùng template `math-step`.
Không có phase `answer` hoặc template `math-answer`.

Đề tiếng Anh: introduction (chào, nói hôm nay làm gì, thông báo đọc tiếng Anh) →
read-english → read-translation → strategy → solution → check → answer → closing.
Có thể chia đề/bản dịch thành nhiều cảnh liên tiếp, giữ đầy đủ nguyên văn khi ghép.
Với `guided`, giữ cùng thứ tự đọc tiếng Anh/bản dịch, bắt buộc `strategy` và thay
`answer` bằng `practice` như trên.
read-english dùng englishText và voiceText rỗng; math-problem.text đúng englishText.
Pipeline dùng Vbee English TTS (`VBEE_VOICE_CODE_EN=am_echo`) tại 0.9×, rồi đọc bản dịch bằng
TTS nam tiếng Việt. Thiếu cấu hình Vbee tiếng Anh thì dừng trước TTS Việt, không thay provider.

## Template

| Template | Dữ liệu |
|---|---|
| math-intro | title, subtitle tùy chọn |
| math-problem | title, text nguyên văn, latex tùy chọn |
| math-step | title, explanation, equations (0–4 LaTeX; nếu không có công thức phải có explanation hoặc note), note tùy chọn; dùng cả cho practice |
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
npm run pipeline -- output/<session>/script.json --audit
npm run pipeline -- output/<session>/script.json
```

--validate không gọi TTS và không cần API key. --no-render tạo audio/composition
để preview, vẫn cần audit đạt và gọi provider khi thiếu audio. `--audit` chỉ gọi
API kiểm chứng, không gọi TTS/render; cần `solution.md` trong session. `problem.imagePaths`
khai báo ảnh đề gốc cần kiểm tra. Video toán qua hyperframes check
trước render. SFX mặc định tắt; có thể bật qua scene.sfx.

Cache MP3 toán theo nội dung và cấu hình giọng. Đổi lời đọc/giọng/provider sẽ tạo lại
audio liên quan. rerender từ chối cache không khớp; chạy pipeline để cập nhật.
Tất cả helper scripts, audio, logs, preview và composition ở output/<session>/;
script trong scripts/ của session. Giữ nguyên tệp gốc và các session khác.

Kiểm tra đáp án, chữ, độ đọc được và audio trên MP4 cuối. Báo riêng bằng chứng
schema/test, Vbee English TTS, provider TTS và render. Mock không chứng minh TTS thật.

## Tài liệu kỹ thuật dùng chung

Hướng dẫn cấu hình TTS, validate, cache và render trước đây vẫn dùng được cho
giải toán, đã được giữ tại [README tiếng Việt](../README.md) và workflow này.
Quy tắc lời thoại dùng chung được giữ ở [voice-text-rules.md](voice-text-rules.md).
Các README, spec và plan news cũ dùng schema/template và giới hạn cảnh không
còn phù hợp với bài giảng, đã được bỏ khỏi bộ tài liệu hiện hành.
