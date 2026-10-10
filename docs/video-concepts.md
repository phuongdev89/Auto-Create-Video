# Concept cho video toán

Concept áp dụng xuyên suốt bố cục, bảng màu, công thức, sơ đồ và chuyển động.
Lời giải, giọng nam và `solutionMode` độc lập với concept; đổi concept không
đổi lời đọc hoặc tự tính thêm đáp án.

| Lựa chọn | `visualConcept` | Cách thể hiện |
|---|---|---|
| Giấy note | `news` | Nền giấy, tiêu đề lớn → dữ kiện → phép biến đổi được highlight → đối chiếu → điểm nhớ. Giữ ID `news` để tương thích kịch bản đã lưu. |
| Thám tử | `detective` | Bìa hồ sơ → tài liệu đề → chuỗi manh mối có đường nối → sổ đối chiếu → tổng hợp. Phép tính có sẵn được ghim đồng thời vào hai vế. |
| Neon Lab | `neon` | Tiêu đề lab → ô dữ kiện → đường biến đổi → khung kiểm tra → ô tổng kết. Hai phần phép tính hiện đồng thời; nét sơ đồ SVG vẽ theo thứ tự khai báo. |
| Bảng phấn | `chalkboard` | Bảng tối có viền, nét công thức/sơ đồ sáng; các dòng xuất hiện từ trái. |
| Vở ô ly | `notebook` | Giấy ô ly có lề đỏ, công thức gạch dưới; các dòng xuất hiện theo hướng từ dưới lên. |
| Đồ vật trực quan | `manipulatives` | Nhóm vật đếm, sơ đồ, thẻ phép tính bo góc; nội dung xuất hiện với thay đổi kích thước nhẹ. |

## Xem và chọn

Kịch bản phải nằm trong `output/<session>/`. Chạy từ root dự án:

```powershell
npm run pipeline -- output/<session>/script.json --concepts
```

Mở URL được in ra. Trang hiển thị cùng nội dung đề bài, bước giải đầu tiên và
kết thúc theo các concept mới và ba concept cũ. Chọn radio rồi bấm **Sử dụng concept này**.
CLI giữ server hoạt động đến khi nhấn Ctrl+C. Sau đó chạy validate, audit và
pipeline theo workflow hiện tại. `rerender` cũng dùng concept đã lưu.

Preview dùng renderer thật với khung 1080×1920 và font/KaTeX cục bộ, nhưng
chạy lặp trên timeline GSAP với timing giả lập, không có audio thật hoặc thời lượng TTS. Có Phát, Tạm dừng và thanh seek. Nó không thay thế việc
kiểm tra chuyển động và MP4 cuối. Tệp preview ở `output/<session>/concepts/`.
Server chỉ phục vụ các preview và tài nguyên font/CSS/JS; không phục vụ
`solution.md`, `verification.*` hoặc kịch bản nội bộ. Nếu kịch bản bị sửa
khi trang đang mở, lưu lựa chọn bị chặn; dừng lệnh và mở lại để duyệt nội dung mới.

Kịch bản cũ không khai báo `visualConcept` vẫn dùng `classic`. Không tự thay
concept của video đã tạo. Với bài mới, agent chờ lựa chọn của người dùng.

## Nhóm vật minh họa

Concept Đồ vật trực quan phải tự thiết kế và dựng giáo cụ riêng cho mỗi bài từ dữ kiện và lời giải. Không chọn từ thư viện giáo cụ cố định, không chỉ đổi màu hoặc bo góc thẻ công thức. Chỉ tái sử dụng kỹ thuật render, font và đồng bộ audio. Số lượng, nhãn và thao tác phải được khai báo và audit, không tự suy ra từ LaTeX. Mẫu thẻ và mẫu cân thử ngày 2026-10-10 chưa đạt yêu cầu thiết kế.

Renderer hỗ trợ `teachingAid` trong `math-step`: `description` mô tả ý nghĩa toán học, `nodes` là hình `path` SVG hoặc `label`. Mỗi bài tự viết hình học và nhãn; không nhận HTML/JavaScript tùy ý. Node có `fill`, `stroke`, `strokeWidth`; label có `x`, `y`, `fontSize`. Canvas 900 × 500. `hideAt` từ 0 đến 0.9 là thời điểm ẩn theo tỷ lệ thời lượng cảnh, dùng cùng giá trị để lấy đồ khỏi hai phía đồng thời. Các trường nằm trong script nên được gửi audit và gắn fingerprint. Sửa giáo cụ cần audit lại. Agent phải kiểm tra hai tỷ lệ và frame thực tế; giáo cụ phức tạp cần tách cảnh. Hỗ trợ hiện tại là vẽ tùy biến và ẩn theo cue, chưa có trình biên tập giáo cụ bằng kéo thả.

Template `math-step` có thể khai báo `objects`:

```json
{
  "template": "math-step",
  "title": "So sánh hai nhóm",
  "explanation": "Các em đếm từng nhóm rồi so sánh.",
  "objects": [
    { "label": "Nhóm A", "count": 4, "color": "blue" },
    { "label": "Nhóm B", "count": 3, "color": "orange" }
  ]
}
```

Tối đa ba nhóm, mỗi nhóm một đến hai mươi vật, tổng không quá ba mươi vật
trong một cảnh. Hình là khối đếm có màu, không phải ảnh AI. Agent phải khai báo
số lượng phù hợp với lập luận; renderer không suy ra số lượng từ LaTeX.
Nhóm vật là dữ liệu dạy học nên thay đổi nó cần kiểm chứng toán lại.
Với bài nâng cao, dùng sơ đồ hoặc công thức; không ép bài vào hình đếm.
Chế độ `guided` phải kiểm tra nhãn, số vật và sơ đồ không tiết lộ đáp án cuối.

Chỉ đổi `visualConcept` không đổi fingerprint lời đọc hoặc nội dung kiểm chứng,
nên audio/audit đã đạt và còn khớp được tái sử dụng. Sửa dữ kiện, lời đọc hoặc
nhóm vật vẫn tuân theo quy tắc cache và audit hiện tại.

## Kế hoạch cảnh và giới hạn animation

Pipeline và rerender ghi `scene-plan.json` trong session: chủ thể, layout, trạng thái đầu,
biến đổi, điểm nhấn, entrance/reveal/hold và cut. Các mốc tuyệt đối dùng duration audio
đã đo; kế hoạch trong QA có nhãn `simulated-no-TTS`. Trong cảnh chưa có cue từ audio,
các phần được phân bố theo thứ tự nội dung trong nửa đầu slot, giữ phần còn lại để đọc.
Đây chưa phải căn từng từ theo timestamp lời đọc.

Animation hai vế chỉ tách một dấu bằng đơn giản ở cấp cao nhất, không có cấu trúc
LaTeX phức tạp. Nếu hai vế có cùng phần cộng/trừ số nguyên cuối đã khai báo, renderer
cho chính hai phần đó xuất hiện đồng thời. Không tạo phép biến đổi mới, không rút gọn,
không suy ra nghiệm. Các biểu thức còn lại giữ nguyên KaTeX và reveal tuần tự.
Sơ đồ lab vẽ nét đã khai báo, không tự thêm giả thiết hoặc dựng bằng chứng toán.
Chưa có diễn nhân vật, AI video, asset trả phí hay provider mới.
