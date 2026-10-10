---
name: create-math-video
description: "Tạo video giải toán và giảng bài từng bước từ đề văn bản, file, ảnh hoặc URL, mọi cấp độ; đọc đề tiếng Anh bằng Vbee English TTS và lời giảng nam tiếng Việt. Workflow chính của Auto-Create-Video."
---

# Create Math Video

Use for math solution videos and animated lessons in this project.

1. Read [shared workflow](../../../docs/math-video-workflow.md) and
   [narration rules](../../../docs/voice-text-rules.md). Use the actual v2 schema
   in src/render/math-schema.ts, not the old news design spec.
2. Read/transcribe the complete problem including diagram, units and choices.
   Resolve unreadable/missing data before claiming a solution.
3. Solve and independently check. Save original input and solution.md in a unique
   output/<session>/. Code validates production structure, not mathematical truth.
4. Write script.json version 2.0 there. Use examples/math/ as runnable references.
   Prefer one reasoning step per scene, retaining domain restrictions and cases.
   Any grade/topic is allowed. Do not impose one minute or eight scenes.
5. Use the male teacher persona. Greeting → today's purpose → full problem →
   solution → verification → answer → closing wish. English problems require
   opening/announcement → verbatim Vbee English TTS (`VBEE_VOICE_CODE_EN=am_echo`) at 0.9× → complete
   Vietnamese translation → solution. English uses englishText outside voiceText.
   Vietnamese numbers/operators are written in words.
6. Use math templates, LaTeX and declarative diagrams. Keep equations readable.
   SFX default off. Split long passages without losing source text.
7. Run npm run pipeline -- output/<session>/script.json --validate. Fix errors
   before paid TTS, then run pipeline. Missing Vbee English configuration is a
   blocker; never silently substitute another provider.
8. Inspect frames and MP4 metadata/audio. Report absolute links to video, audio,
   transcript and solution with actual evidence and remaining gaps. Provider
   mocks are not proof of real TTS.

All one-off files/caches belong in the same session. Put helper scripts under
output/<session>/scripts/ and execute them there. Preserve originals; reuse the
same session when continuing the same run.
