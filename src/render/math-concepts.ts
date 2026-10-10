import { z } from "zod";

export const MathConceptId = z.enum(["classic", "chalkboard", "notebook", "manipulatives", "news", "detective", "neon"]);
export type MathConceptId = z.infer<typeof MathConceptId>;

export const mathConcepts = [
  { id: "news", title: "Giấy note", description: "Nền giấy, tiêu đề lớn và các nét highlight nhấn từng bước giải.", suitable: "Tách dữ kiện, phép biến đổi và ý cần nhớ thành các nhịp rõ ràng." },
  { id: "detective", title: "Thám tử", description: "Hồ sơ đề bài, manh mối và chuỗi bằng chứng nối từng bước.", suitable: "Theo dõi giả thiết, suy luận và đối chiếu kết quả." },
  { id: "neon", title: "Neon Lab", description: "Sơ đồ vẽ dần, công thức kết nối và ánh sáng nhấn bước đang xét.", suitable: "Quan hệ hình học và biến đổi đại số trên nền tối." },
  { id: "chalkboard", title: "Bảng phấn", description: "Bảng tối, công thức sáng rõ và các dòng lập luận xuất hiện lần lượt.", suitable: "Đại số, chứng minh và bài cần theo dõi từng bước." },
  { id: "notebook", title: "Vở ô ly", description: "Giấy ô ly, lề đỏ và từng dòng bài làm được nhấn theo thứ tự.", suitable: "Bài giảng gần gũi, luyện trình bày lời giải." },
  { id: "manipulatives", title: "Đồ vật trực quan", description: "Giáo cụ được thiết kế và dựng riêng theo dữ kiện, lời giải của từng bài.", suitable: "Minh họa thao tác toán học bằng đồ vật riêng cho bài, kiểm chứng số lượng và ý nghĩa." },
] as const;

// Explicit teaching data only. Never infer quantities or a final answer from LaTeX.
export const MathObjects = z.array(z.object({
  label: z.string().trim().min(1),
  count: z.number().int().min(1).max(20),
  color: z.enum(["blue", "green", "orange"]).default("blue"),
})).min(1).max(3).superRefine((groups, ctx) => {
  if (groups.reduce((sum, group) => sum + group.count, 0) > 30)
    ctx.addIssue({ code: "custom", message: "Use at most 30 objects per scene for readability" });
});
