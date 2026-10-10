import { readFile } from "node:fs/promises";
import { join } from "node:path";

/** Private creator output only; never mount it in the concept gallery. */
export async function creatorAuditReview(dir: string): Promise<string> {
  const read = async (name: string) => {
    try { return await readFile(join(dir, name), "utf8"); }
    catch { return `Chưa có ${name}; không có bằng chứng để trình bày.`; }
  };
  const [solution, audit] = await Promise.all([read("solution.md"), read("verification.md")]);
  return ["# Duyệt lời giải và audit — dành riêng cho người tạo",
    "Có thể chứa đáp án cuối, kể cả khi solutionMode là guided. Không đưa phần này vào video, phụ đề, gallery hoặc nội dung cho học sinh.",
    "", "## Lời giải của agent", "", solution, "", "## Kết quả audit thực tế", "", audit].join("\n");
}
