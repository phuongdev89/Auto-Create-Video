# Prompt bắt đầu cuộc hội thoại triển khai

Sao chép nội dung bên dưới vào cuộc hội thoại mới mở tại `D:\AI\Auto-Create-Video`.

```text
Tiếp tục dự án D:\AI\Auto-Create-Video, triển khai nâng chất lượng concept và animation bài giảng theo docs/issues/ISSUE-001-concept-scene-direction.md. Đọc issue đầy đủ và AGENTS.md trước khi làm.

Bối cảnh: main đã có commit 7243a61 về audit toán; nhánh codex/video-concepts đã push commit e3dce57 về gallery chọn concept. Xác minh Git hiện tại và giữ thay đổi đang có; ưu tiên tiếp tục nhánh này, không tạo lại tính năng chọn concept từ đầu.

Ba concept Bảng phấn/Vở ô ly/Đồ vật trực quan hiện còn giống nhau và chưa đủ đẹp. Tôi muốn concept định hướng cả cách kể chuyện, cấu trúc cảnh, typography, motion và audio. Phân biệt rõ chuyển động với diễn: không thêm mascot nhún nhảy rồi coi là nhân vật diễn.

Đợt này giữ HyperFrames/GSAP + KaTeX. Khảo sát pipeline news cũ trong code/lịch sử Git để tìm phần thiết kế đáng giữ; triển khai theo thứ tự News/Đồ họa biên tập, Thám tử, Neon Lab. Mỗi concept có cấu trúc cảnh riêng, không chỉ đổi màu trên một khung. Animation phải giải thích quan hệ toán học; kế hoạch cảnh nêu rõ trạng thái, biến đổi, điểm nhấn và thời gian giữ theo lời giảng/audio.

Nâng gallery thành preview chuyển động ngắn bằng cùng nội dung bài, rồi lưu lựa chọn vào kịch bản. Giữ tương thích script cũ, rerender và cache; thay dữ liệu có ý nghĩa toán phải audit lại. Giữ lựa chọn solutionMode và tuyệt đối không lộ đáp án guided qua mọi hình thức công bố.

Chưa tích hợp model AI video hoặc provider trả phí mới; không tự tiêu credit để tạo ảnh/video, retry hay fallback. Nhân vật có khả năng diễn, Manim, Blender và đổi engine để giai đoạn sau. Học nguyên tắc từ OpenMontage; không sao chép code thiếu kiểm tra license.

Tự xử lý lựa chọn kỹ thuật thông thường, không dừng ở đề xuất. Nếu cần bài mẫu mới, tuân thủ bước chọn cách giải; ưu tiên fixture có sẵn, đã xác định solutionMode để kiểm thử renderer. Không bỏ qua audit để gọi TTS/render sản xuất. Tệp một lần ở output/<session>/, helper ở scripts/ trong session.

Kiểm chứng bằng typecheck/test phù hợp, browser thật, seek timeline, HyperFrames check và render mẫu. Báo riêng browser, mock/API, TTS thật và MP4; không tuyên bố đạt thẩm mỹ chỉ từ unit test. Ghi rõ cảnh báo và phần chưa kiểm chứng. Cập nhật trạng thái/AC của issue khi có bằng chứng thực tế. Không refactor không liên quan hoặc tự merge/push nếu chưa được yêu cầu trong cuộc hội thoại mới.
```
