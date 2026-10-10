import katex from "katex";

export function renderFormula(latex: string): string {
  return katex.renderToString(latex, { displayMode: true, throwOnError: true, trust: false,
    strict: "error", maxExpand: 500, maxSize: 20 });
}
