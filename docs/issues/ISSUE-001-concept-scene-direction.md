# ISSUE-001 — Nâng concept thành cách kể chuyện và thiết kế từng cảnh

- Ngày ghi nhận: 2026-10-10.
- Trạng thái: Đã triển khai đợt đầu và kiểm chứng kỹ thuật; còn duyệt thẩm mỹ và các giới hạn timing/animation. Xem [bằng chứng](ISSUE-001-evidence.md).
- Dự án: `D:\AI\Auto-Create-Video`.
- Nhánh hiện tại: `codex/video-concepts`.
- Ưu tiên: Chất lượng hình ảnh và animation giải thích bài toán.

## Bối cảnh và hiện trạng

Commit `7243a61` đã push lên `main`: kiểm chứng toán trước TTS/render.
Commit `e3dce57` đã push lên `codex/video-concepts`: chọn concept và preview bài thực tế.
Agent tiếp theo phải xác minh Git hiện tại trước khi chỉnh sửa; không mặc định checkout sạch.

Hiện có `classic`, `chalkboard`, `notebook`, `manipulatives`; CLI `--concepts`
mở trang local để xem Đề bài/Bước giải/Kết thúc rồi lưu `visualConcept`.
Các concept thay màu, treatment bảng/công thức/sơ đồ và một số chuyển động,
nhưng vẫn gần như chung cấu trúc bảng giảng. Người dùng đánh giá chưa đẹp xuất sắc.
Preview hiện là khung tĩnh, chưa thể đánh giá nhịp và cách animation kể chuyện.

Điểm tích hợp hiện có:

- `src/render/math-concepts.ts`: danh mục concept và nhóm vật minh họa.
- `src/render/math-schema.ts`: schema bài giảng version 2.0.
- `src/render/math-composer.ts`, `src/render/templates/math-styles.css`,
  `src/render/templates/math-animations.js`: dựng hình và timeline.
- `src/concepts/gallery.ts`, `src/concepts/server.ts`: xem trước và lưu lựa chọn.
- `src/audit/math-verifier.ts`, `src/tts/audio-cache.ts`: kiểm chứng và cache.
- `docs/video-concepts.md`, `docs/math-video-workflow.md`: contract sử dụng.

Bằng chứng đợt trước: 150 test và typecheck đạt; chọn/lưu trên trình duyệt thật;
desktop/mobile đã xem; ba composition qua HyperFrames check. Còn cảnh báo lint
về timeline một file. Không có TTS thật hoặc MP4 cuối trong QA đợt đó.
Artifacts local ở `output/20261010-video-concepts/` và có thể không có trên máy khác.

## Phân biệt cần giữ rõ

1. **Chuyển động**: dịch, xoay, zoom, fade, particles, camera; không tự tạo ra hành động có ý nghĩa.
2. **Diễn**: nhân vật có mục tiêu, phản ứng và hành động phù hợp nội dung; cần thiết kế nhân vật,
   tư thế, hành động và timing. Mascot đứng cạnh rồi nhún nhảy không đáp ứng yêu cầu này.
3. **Concept**: bộ quy tắc kể chuyện, bố cục, typography, hình minh họa, nhịp và âm thanh;
   không chỉ là tên phong cách hoặc thay màu trên một template.
4. **Animation sư phạm**: thể hiện quan hệ/bước toán học; fade/zoom chỉ hỗ trợ trình bày.

Ví dụ: trừ cùng một số ở hai vế phải thể hiện tác động ở cả hai vế;
gom nhóm phải thể hiện vật được gom; phần đang biến đổi phải khớp lời giảng.
Không thêm chuyển động làm phân tâm hoặc để kết quả xuất hiện trước lời hướng dẫn.

## Hướng đề xuất cho đợt đầu

Giữ HyperFrames/GSAP và KaTeX. Giữ các concept bảng giảng hiện tại để tương thích.
Làm theo thứ tự **Đồ họa biên tập / News → Thám tử → Neon Lab**.

| Concept | Thiết kế cảnh cần có |
|---|---|
| News / Đồ họa biên tập | Khảo sát pipeline news cũ trước; kế thừa chữ lớn, thẻ dữ kiện, sơ đồ và nhịp dựng có chất lượng. Không áp giới hạn cảnh/thời lượng news cũ lên bài toán. |
| Thám tử | Hồ sơ đề bài, bảng manh mối, liên kết bằng chứng và đối chiếu khi kiểm tra. Không đổi giả thiết toán học để phục vụ câu chuyện. |
| Neon Lab | Không gian tối, sơ đồ vẽ dần, dữ kiện kết nối, biến đổi công thức; ánh sáng nhấn phần đang giảng, tránh glow làm chữ khó đọc. |

Mỗi concept cần cấu trúc cảnh riêng. Mỗi cảnh xác định chủ thể chính, trạng thái đầu,
thay đổi có ý nghĩa, điểm nhấn, thời gian giữ và cách kết thúc/chuyển cảnh.
Tránh lặp một khung hoặc một thiết bị hình ảnh cho mọi cảnh rồi thay chữ.
Dùng cùng một bài mẫu đã được kiểm chứng để so sánh chất lượng giữa concept.

Luồng mong muốn: chọn cách giải → giải/kiểm chứng → chọn concept → lập kế hoạch
cảnh theo lời đọc → dựng/kiểm tra. Trong triển khai, giữ audit chặn trước TTS/render;
kịch bản/nội dung mới hoặc dữ liệu minh họa có ý nghĩa toán phải được kiểm chứng lại.
Kế hoạch timing cuối dựa trên audio thực tế, không áp thời lượng tùy ý cho bài giảng.

Trang chọn concept cần preview chuyển động ngắn để đánh giá bố cục và nhịp.
Ghi rõ preview không có audio thật nếu dùng timing giả lập. Người dùng vẫn chọn rõ ràng;
radio đánh dấu sẵn hoặc hết thời gian chờ không phải chấp thuận.

## Phạm vi và chi phí

- Chưa tích hợp AI video, HeyGen/Kling hoặc provider trả phí mới trong đợt đầu.
- Chưa đổi sang Remotion, thêm Blender hoặc refactor toàn bộ pipeline.
- Nhân vật có khả năng diễn thuộc giai đoạn sau, cần mascot/rig/action được nghiệm thu riêng.
- Manim có thể khảo sát sau cho biến đổi toán học vượt khả năng renderer hiện tại.
- Chọn concept không được tự kích hoạt tạo asset trả phí.
- Nếu sau này thêm AI video: tắt mặc định; hiện dự toán/model/số cảnh/thời lượng;
  trần ngân sách phải tính cả job đang chờ; không tự tạo lại/đổi model/fallback trả phí;
  lưu job ID, tránh gửi trùng sau timeout; tạo và duyệt một cảnh trước khi làm hàng loạt.
- Đường local không có credit tạo video; TTS, AI ảnh và tài nguyên khác có thể tính riêng.

## Ràng buộc bảo toàn

Đọc `AGENTS.md`, workflow và quy tắc sư phạm/lời thoại/kiểm chứng hiện tại.
Giữ lựa chọn `solutionMode`; `guided` không lộ đáp án qua lời đọc, hình, số vật,
sơ đồ, preview, phụ đề hoặc artifact công bố. Giọng nam xưng thầy; đọc đề tiếng Anh
theo quy tắc hiện hành. Không thay đổi lời giải để làm video hấp dẫn hơn.

Giữ video 1080×1920, chữ/công thức đọc được trên điện thoại và đủ thời gian hiểu.
Chuyển động phải seek-safe/deterministic để preview và render cùng kết quả.
Không lấy API key vào artifact; không phục vụ `solution.md`/`verification.*` qua gallery.
Đổi concept thuần hình thức nên giữ audio/audit còn khớp; thay dữ liệu toán phải audit lại.
Tệp dùng một lần và helper của lượt tạo video nằm trong `output/<session>/`.
Giữ chỉnh sửa không liên quan; không refactor vô tội vạ.

## Tiêu chí nghiệm thu

- [x] Khảo sát và ghi lại phần đáng giữ của pipeline news cũ bằng đường dẫn/commit cụ thể.
- [x] News, Thám tử, Neon có năm layout theo vai trò và treatment khác nhau; chưa kết luận đã đạt thẩm mỹ xuất sắc.
- [x] Có kế hoạch cảnh/timing theo audio; animation trừ cùng số ở hai vế được kiểm tra seek. Chưa căn từng từ.
- [x] Gallery có preview chuyển động, lưu đúng lựa chọn, giữ chỉnh sửa tay và phát hiện script đã đổi.
- [x] Script cũ/rerender thực tế hoạt động trên bản sao; fixture guided đã audit không lộ đáp án trong preview/MP4.
- [x] Kiểm tra browser desktop/mobile, seek ngược và khung hình representative của mỗi concept.
- [x] Typecheck và 157 test đạt; đọc đầy đủ HyperFrames check, ghi rõ 9/14 cảnh báo và motion assertions chưa bật.
- [x] Render ba MP4 mẫu, kiểm tra frame mã hóa/metadata/timing; rerender dùng audio cache thật và kiểm tra tín hiệu. Chưa nghe duyệt toàn bộ lời đọc.
- [x] Báo riêng bằng chứng mock/API, browser, audit/audio cache thật, không có TTS mới và MP4; xem evidence.
- [x] Không gọi provider mới hoặc tiêu credit tạo video để nghiệm thu.

Các checkbox trên phản ánh bằng chứng kỹ thuật ở phạm vi fixture đã chạy. Các phần
chưa nghiệm thu (thẩm mỹ, word alignment, animation đại số phức tạp, TTS mới) được
ghi riêng trong [ISSUE-001-evidence.md](ISSUE-001-evidence.md); không coi issue hoàn tất tuyệt đối.

## Tham khảo OpenMontage và giới hạn bằng chứng

Nghiên cứu ngày 2026-10-10: tree `9327439db69021ab4b0e2776729bf3b58fdb5a87`;
file được đọc trên main có thể thay đổi. Đã đọc code/tài liệu, chưa chạy engine của họ.

- [Animation runtime selector](https://github.com/calesthio/OpenMontage/blob/main/skills/meta/animation-runtime-selector.md): HyperFrames/GSAP, Remotion, Manim, Lottie và 3D theo loại công việc.
- [Bespoke composition](https://github.com/calesthio/OpenMontage/blob/main/skills/meta/bespoke-composition.md): thiết kế cảnh khác nhau, tránh cùng một khung với chữ thay đổi.
- [Flat Motion Graphics](https://github.com/calesthio/OpenMontage/blob/main/styles/flat-motion-graphics.yaml): phối hợp typography, motion, timing và audio.
- [Style menu](https://github.com/calesthio/OpenMontage/blob/main/.agents/skills/create-video/references/visual-styles.md): hướng dẫn phong cách; không phải bằng chứng mọi tên có renderer riêng. Chưa thấy tên literal Detective; Shadow Cut/Contact Sheet có hướng noir/điều tra.
- [Ink Theater](https://github.com/calesthio/OpenMontage/blob/main/ink-theater/README.md): SVG/GSAP, IK và motion capture cho nhân vật doodle.
- [Character tool](https://github.com/calesthio/OpenMontage/blob/main/tools/character/character_animation.py): beta, có scaffolding/pose first-pass; không suy ra chất lượng Pixar từ đây.
- [AnimeScene](https://github.com/calesthio/OpenMontage/blob/main/remotion-composer/src/components/AnimeScene.tsx): chuyển động ảnh/camera/particles; không phải nhân vật tự diễn.
- [Manim tool](https://github.com/calesthio/OpenMontage/blob/main/tools/graphics/math_animate.py): tool local triển khai thật cho animation toán học.

Showcase Pixar-style banana của OpenMontage dùng Kling; không dùng nó làm bằng chứng
chất lượng renderer SVG local. Học nguyên tắc thiết kế; nếu tái sử dụng code, kiểm tra
license riêng trước, không mặc định nguồn mở có cùng license với dự án này.

Prompt bàn giao: [ISSUE-001-handoff-prompt.md](ISSUE-001-handoff-prompt.md).
