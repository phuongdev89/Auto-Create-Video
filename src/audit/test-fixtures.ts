import { aspects, type AuditReview, type IndependentSolution } from "./report-schema.js";
export const independentFixture = (): IndependentSolution => ({
  status: "solved", answer: "x = 6", conditions: ["x thuộc R"],
  derivation: [{ statement: "2x = 12 nên x = 6", justification: "Trừ 5 và chia 2 ở cả hai vế là phép biến đổi tương đương." }],
  checks: [{ method: "substitution", evidence: ["2*6+5 = 17 khớp vế phải của đề gốc."] }], unresolved: [],
});
export const reviewFixture = (): AuditReview => ({ verdict: "pass", summary: "Các bước biến đổi và phần tự làm phù hợp đề.",
  checks: aspects.map(aspect => ({ aspect, status: "pass", evidence: [`Kiểm tra ${aspect}: phép trừ 5 và chia 2 giữ phương trình tương đương; phần tự làm không công bố nghiệm.`] })),
  issues: [], unresolved: [],
});
export const completion = (value: unknown) => ({ choices: [{ index: 0, message: { content: JSON.stringify(value) }, finish_reason: "stop" }] });
