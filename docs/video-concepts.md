# Concept cho video toán

Concept áp dụng xuyên suốt bố cục, bảng màu, công thức, sơ đồ và chuyển động.
Lời giải, giọng nam và `solutionMode` độc lập với concept; đổi concept không
đổi lời đọc hoặc tự tính thêm đáp án.

| Lựa chọn | `visualConcept` | Cách thể hiện |
|---|---|---|
| Bảng phấn | `chalkboard` | Bảng tối có viền, nét công thức/sơ đồ sáng; các dòng xuất hiện từ trái. |
| Vở ô ly | `notebook` | Giấy ô ly có lề đỏ, công thức gạch dưới; các dòng xuất hiện theo hướng từ dưới lên. |
| Đồ vật trực quan | `manipulatives` | Nhóm vật đếm, sơ đồ, thẻ phép tính bo góc; nội dung xuất hiện với thay đổi kích thước nhẹ. |

## Xem và chọn

Kịch bản phải nằm trong `output/<session>/`. Chạy từ root dự án:

```powershell
npm run pipeline -- output/<session>/script.json --concepts
```

Mở URL được in ra. Trang hiển thị cùng nội dung đề bài, bước giải đầu tiên và
kết thúc theo cả ba concept. Chọn radio rồi bấm **Sử dụng concept này**.
CLI giữ server hoạt động đến khi nhấn Ctrl+C. Sau đó chạy validate, audit và
pipeline theo workflow hiện tại. `rerender` cũng dùng concept đã lưu.

Preview dùng renderer thật với khung 1080×1920 và font/KaTeX cục bộ, nhưng
là ảnh bố cục tĩnh, không có audio hoặc thời lượng TTS. Nó không thay thế việc
kiểm tra chuyển động và MP4 cuối. Tệp preview ở `output/<session>/concepts/`.
Server chỉ phục vụ các preview và tài nguyên font/CSS/JS; không phục vụ
`solution.md`, `verification.*` hoặc kịch bản nội bộ. Nếu kịch bản bị sửa
khi trang đang mở, lưu lựa chọn bị chặn; dừng lệnh và mở lại để duyệt nội dung mới.

Kịch bản cũ không khai báo `visualConcept` vẫn dùng `classic`. Không tự thay
concept của video đã tạo. Với bài mới, agent chờ lựa chọn của người dùng.

## Nhóm vật minh họa

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
