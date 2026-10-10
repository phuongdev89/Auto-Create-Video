import type { MathScript } from "./math-schema.js";

/** Visual-only direction: never derives mathematical facts or changes narration.
 * Final slots come from audio; preview callers explicitly supply simulated slots.
 */
export function sceneDirection(concept: MathScript["visualConcept"], phase: string) {
  const role: "problem" | "reasoning" | "check" | "result" | "bookend" = phase === "problem" || phase.startsWith("read-") ? "problem"
    : phase === "solution" || phase === "strategy" ? "reasoning"
    : phase === "check" ? "check" : phase === "answer" || phase === "practice" ? "result" : "bookend";
  const layouts = {
    news: { problem: "news-brief", reasoning: "news-analysis", check: "news-compare", result: "news-takeaway", bookend: "news-headline" },
    detective: { problem: "case-file", reasoning: "evidence-chain", check: "evidence-review", result: "case-summary", bookend: "case-cover" },
    neon: { problem: "lab-input", reasoning: "lab-process", check: "lab-test", result: "lab-output", bookend: "lab-title" },
  };
  const layout = concept in layouts ? layouts[concept as keyof typeof layouts][role] : "board";
  return { role, layout };
}

export function planMathScenes(script: MathScript, audio: { id: string; durationSec: number }[], gapSec: number, hold = 3) {
  let cursor = 0;
  return script.scenes.map((scene, index) => {
    const slot = audio.find(a => a.id === scene.id);
    if (!slot || !Number.isFinite(slot.durationSec) || slot.durationSec <= 0) throw new Error(`Missing or invalid audio for ${scene.id}`);
    const duration = slot.durationSec + (index < script.scenes.length - 1 ? gapSec : hold);
    const start = cursor; cursor += duration;
    const direction = sceneDirection(script.visualConcept, scene.phase);
    const treatment = script.visualConcept === "news" ? "Opposing editorial operand cards; operations slide from opposing margins"
      : script.visualConcept === "detective" ? "Evidence rail and pinned cards; supplied operations land on both sides"
      : script.visualConcept === "neon" ? "Connected operand cells; supplied operations materialize together; diagram strokes draw in order"
      : "Existing board treatment";
    return { id: scene.id, ...direction, start, duration, entranceSec: Math.min(.45, duration * .08),
      revealUntilSec: duration * .6, holdFromSec: duration * .65,
      subject: scene.templateData.title, treatment, initial: "Only phase and title; teaching elements hidden",
      change: direction.role === "reasoning" ? "Reveal supplied equations in order; emphasize both sides of explicit equality together"
        : direction.role === "check" ? "Present supplied check as comparison; no computed answer"
        : "Reveal supplied text and diagram strokes in declared order",
      emphasis: "Current supplied equation or diagram stroke", exit: "Hard cut at audio slot boundary" };
  });
}
