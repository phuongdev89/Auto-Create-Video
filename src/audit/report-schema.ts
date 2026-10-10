import { z } from "zod";

const text = z.string().trim().min(1);
export const IndependentSolutionSchema = z.object({
  status: z.enum(["solved", "uncertain"]),
  answer: text.nullable(),
  derivation: z.array(z.object({ statement: text, justification: text }).strict()),
  conditions: z.array(text),
  checks: z.array(z.object({ method: z.enum(["substitution", "independent_calculation", "symbolic", "logical_proof", "enumeration", "counterexample"]), evidence: z.array(text).min(1) }).strict()),
  unresolved: z.array(text),
}).strict().superRefine((s, ctx) => {
  if (s.status === "solved" && (!s.answer || !s.derivation.length || !s.checks.length || s.unresolved.length))
    ctx.addIssue({ code: "custom", message: "A solved problem needs a justified derivation, answer, concrete check and no unresolved points." });
});
export const aspects = ["problem_fidelity", "reasoning", "conditions_and_cases", "answer", "lesson_consistency", "guided_no_answer_leak"] as const;
export const ReviewSchema = z.object({
  verdict: z.enum(["pass", "fail", "uncertain"]),
  summary: text,
  checks: z.array(z.object({ aspect: z.enum(aspects), status: z.enum(["pass", "fail", "uncertain"]), evidence: z.array(text).min(1) }).strict()),
  issues: z.array(z.object({ location: text, description: text, correction: text }).strict()),
  unresolved: z.array(text),
}).strict();
export type IndependentSolution = z.infer<typeof IndependentSolutionSchema>;
export type AuditReview = z.infer<typeof ReviewSchema>;

export function reviewStatus(review: AuditReview, guided: boolean): "pass" | "fail" | "uncertain" {
  if (review.verdict === "fail" || review.issues.length || review.checks.some(check => check.status === "fail")) return "fail";
  const required = aspects.filter(aspect => guided || aspect !== "guided_no_answer_leak");
  if (review.verdict !== "pass" || review.unresolved.length || review.checks.some(check => check.status !== "pass")
    || new Set(review.checks.map(check => check.aspect)).size !== review.checks.length
    || required.some(aspect => !review.checks.some(check => check.aspect === aspect))) return "uncertain";
  return "pass";
}
