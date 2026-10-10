import { z } from "zod";

export const MathConceptId = z.enum(["classic", "chalkboard", "notebook", "manipulatives"]);
export type MathConceptId = z.infer<typeof MathConceptId>;

export const mathConcepts = [
  { id: "chalkboard", title: "Bảng phấn", description: "Bảng tối, công thức sáng rõ và các dòng lập luận xuất hiện lần lượt.", suitable: "Đại số, chứng minh và bài cần theo dõi từng bước." },
  { id: "notebook", title: "Vở ô ly", description: "Giấy ô ly, lề đỏ và từng dòng bài làm được nhấn theo thứ tự.", suitable: "Bài giảng gần gũi, luyện trình bày lời giải." },
  { id: "manipulatives", title: "Đồ vật trực quan", description: "Các nhóm vật đếm được, sơ đồ và thẻ phép tính tách rõ trên nền sáng.", suitable: "Đếm, nhóm và so sánh; bài nâng cao dùng sơ đồ và thẻ công thức." },
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
