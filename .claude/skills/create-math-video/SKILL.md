---
name: create-math-video
description: "Tạo video giải toán và giảng bài từng bước từ đề văn bản, file, ảnh hoặc URL, mọi cấp độ; đọc đề tiếng Anh bằng Vbee English TTS và lời giảng nam tiếng Việt. Workflow chính của Auto-Create-Video."
---

# Create Math Video

Use for math requests, solution videos and animated lessons in this project.

Before solving or drafting, follow "Chọn cách giải" in the shared workflow.
At task start, launch `npm run progress -- output/<session>` in a persistent
terminal before script.json exists, open the private creator URL, and keep it
running through completion/failure. Follow "Progress realtime xuyên suốt task"
in the shared workflow. Update receive/wait/solve stages with the progress CLI;
audit/concepts/pipeline/rerender update production stages automatically. Use
real composition/frame/MP4 previews only; never claim renderer frame streaming
or a percentage that is not measured. Do not share the private URL with students.
Always produce responsive HTML and both portrait 1080x1920 and landscape
1920x1080 videos. Follow "HTML responsive và hai video bắt buộc" in the workflow.
Deliver video-portrait.mp4 and video-landscape.mp4; video.mp4 remains the portrait
compatibility alias. Reuse the same audited narration/audio for both, inspect
both layouts and probe both MP4 files. Do not mark complete with only one video.
Show a clickable question with exactly "Giải ra đáp án" and "Hướng dẫn giải và
để ngỏ đáp án" using the chat's question tool (Codex: request_user_input_async;
request_user_input only when available and allowed). Wait for an actual response,
never infer it from a preselected option or a timeout. Reuse the choice when
continuing the same problem; ask again for a new problem. Save solutionMode as
answer or guided. In guided mode, verify privately, teach the method, leave the
decisive step for the learner, and do not disclose the final answer anywhere in
the student-facing text, visuals, narration, subtitles or public links to private solution.md.
The creator's private review is a separate step: show the full solution and real
audit findings in chat, including guided mode, before concept selection or production.
Follow "Duyệt lời giải và audit" in the shared workflow; never publish that review
in the student lesson or concept gallery.

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
   Validate the draft, then run --audit before opening concept selection.
   Read the actual verification report and show the full solution plus audit
   status/evidence/issues to the creator in chat, not just a link or "passed".
   Report cache reuse honestly. Show failed/uncertain/unverified results too and
   stop production; never fabricate a pass. This review also applies to text-only
   math requests. AUDIT_AI_* selects the independent verifier.
7. For a new video, follow [concept selection](../../../docs/video-concepts.md).
   Run npm run pipeline -- output/<session>/script.json --concepts and open its
   local URL. Let the user compare the actual lesson frames and save a choice;
   wait for an explicit selection, never infer approval from a checked radio.
   Keep the saved visualConcept when resuming. Stop the server before production.
   Concepts do not change the solution or narration. Explicit object groups must
   match the teaching content and must not reveal a guided lesson's final answer.
8. Revalidate/audit if teaching content changed after the creator review. Resolve
   failed/uncertain findings and show the updated solution/audit before continuing;
   only a matching pass permits production. Missing verifier configuration or
   evidence blocks TTS/render. Never manually mark a report pass.
   Then run pipeline. Missing Vbee English configuration is a
   blocker; never silently substitute another provider.
9. Inspect frames and MP4 metadata/audio. Report absolute links to video, audio,
   transcript with actual evidence and remaining gaps. Solution and verification
   reports remain outside the student-facing guided delivery and gallery. The
   separate creator review above may show them in full. Provider
   mocks are not proof of real TTS.

All one-off files/caches belong in the same session. Put helper scripts under
output/<session>/scripts/ and execute them there. Preserve originals; reuse the
same session when continuing the same run.
