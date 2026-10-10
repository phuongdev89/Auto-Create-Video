---
name: create-math-video
description: "Tạo video giải toán và giảng bài từng bước từ đề văn bản, file, ảnh hoặc URL, mọi cấp độ; đọc đề tiếng Anh bằng Vbee English TTS và lời giảng nam tiếng Việt. Workflow chính của Auto-Create-Video."
---

# Create Math Video

Use for math requests, solution videos and animated lessons in this project.

Before solving or drafting, follow "Chọn cách giải" in the shared workflow.
Show a clickable question with exactly "Giải ra đáp án" and "Hướng dẫn giải và
để ngỏ đáp án" using the chat's question tool (Codex: request_user_input_async;
request_user_input only when available and allowed). Wait for an actual response,
never infer it from a preselected option or a timeout. Reuse the choice when
continuing the same problem; ask again for a new problem. Save solutionMode as
answer or guided. In guided mode, verify privately, teach the method, leave the
decisive step for the learner, and do not disclose the final answer anywhere in
the delivered text, visuals, narration, subtitles or links to private solution.md.

1. Read [shared workflow](../../../docs/math-video-workflow.md) and
   [narration rules](../../../docs/voice-text-rules.md), plus
   [math pedagogy rules](../../../docs/math-pedagogy-rules.md) before teaching.
   Explain why key steps work, match prerequisite knowledge, and leave a
   meaningful learner step in guided mode. Review the pedagogy checklist
   before delivering the lesson or calling TTS. Use the actual v2 schema
   in src/render/math-schema.ts.
2. Read/transcribe the complete problem including diagram, units and choices.
   Resolve unreadable/missing data before claiming a solution.
3. Solve and independently check. Save original input and solution.md in a unique
   output/<session>/. Code validates production structure, not mathematical truth.
   Follow [verification rules](../../../docs/math-verification-rules.md).
   Include complete private reasoning, conditions/cases and actual checks in
   solution.md. Copy necessary original diagrams into the session and declare
   problem.imagePaths; never substitute a reconstructed diagram for the source.
4. Write script.json version 2.0 there. Use examples/math/ as runnable references.
   Prefer one reasoning step per scene, retaining domain restrictions and cases.
   Guided scripts omit problem.answer and all answer scenes/templates; require
   strategy, solution hints, a check explaining how to self-check, and one
   practice scene using math-step. Review for answer leaks before TTS.
   Any grade/topic is allowed. Do not impose one minute or eight scenes.
5. Use the male teacher persona. Greeting → today's purpose → full problem →
   solution → verification → answer (guided: practice) → closing wish. English problems require
   opening/announcement → verbatim Vbee English TTS (`VBEE_VOICE_CODE_EN=am_echo`) at 0.9× → complete
   Vietnamese translation → solution. English uses englishText outside voiceText.
   Vietnamese numbers/operators are written in words.
6. Use math templates, LaTeX and declarative diagrams. Keep equations readable.
   SFX default off. Split long passages without losing source text.
7. Run npm run pipeline -- output/<session>/script.json --validate. Fix errors
   then run the same command with --audit before paid TTS. AUDIT_AI_* selects
   the independent verifier. Resolve failed/uncertain findings and audit again;
   only a matching pass permits production. Missing verifier configuration or
   evidence blocks TTS/render. Never manually mark a report pass.
   Then run pipeline. Missing Vbee English configuration is a
   blocker; never silently substitute another provider.
8. Inspect frames and MP4 metadata/audio. Report absolute links to video, audio,
   transcript with actual evidence and remaining gaps. Solution and verification
   reports are private in guided mode: do not return their links or answers. Provider
   mocks are not proof of real TTS.

All one-off files/caches belong in the same session. Put helper scripts under
output/<session>/scripts/ and execute them there. Preserve originals; reuse the
same session when continuing the same run.
