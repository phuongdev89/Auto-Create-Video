import { mathConcepts, type MathConceptId } from "../render/math-concepts.js";

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
export function conceptGallery(title: string, selected: MathConceptId, token: string): string {
  return `<!doctype html><html lang="vi"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Chọn concept video</title><style>
*{box-sizing:border-box}body{margin:0;background:#f5f3ee;color:#24342d;font-family:system-ui,sans-serif}main{max-width:1200px;margin:auto;padding:36px 24px 120px}.eyebrow{font-size:12px;letter-spacing:2px;color:#566a60}h1{font-size:36px;margin:12px 0}p{line-height:1.6}h2{font-size:22px;margin:0 0 10px}.tabs{display:flex;gap:8px;margin:24px 0;flex-wrap:wrap}button{font:inherit;cursor:pointer;border:1px solid #a9b9ad;background:#fff;padding:12px 18px;border-radius:8px;color:inherit}button[aria-pressed=true]{background:#243f31;color:#fff}.cards{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:22px}.card{border:2px solid #d5ddd5;border-radius:12px;padding:18px;background:#fff}.card:has(input:checked){border-color:#246640;box-shadow:0 0 0 2px #24664020}.pick{display:flex;align-items:center;gap:10px;cursor:pointer}input{width:20px;height:20px;accent-color:#246640}.frame{position:relative;width:100%;aspect-ratio:9/16;overflow:hidden;margin:16px 0;background:#eee;border-radius:6px}iframe{position:absolute;left:0;top:0;width:1080px;height:1920px;border:0;transform-origin:top left;pointer-events:none}.card p{font-size:14px;margin:12px 0}.suitable{color:#52695b}.action{position:fixed;bottom:0;left:0;right:0;padding:18px 24px;background:#fffffff5;border-top:1px solid #d5ddd5;display:flex;align-items:center;justify-content:center;gap:20px}.action button{background:#246640;color:white;border-color:#246640}button:disabled{opacity:.5;cursor:default}#status{font-size:14px;max-width:600px}.notice{font-size:14px;color:#52695b}@media(max-width:760px){.cards{grid-template-columns:1fr}.card{max-width:420px;width:100%;margin:auto}h1{font-size:28px}.action{align-items:flex-start}main{padding:24px 16px 150px}}
</style></head><body><main><div class="eyebrow">PHONG CÁCH VIDEO · 1080 × 1920</div><h1>Chọn cách thể hiện bài giảng</h1><p>${esc(title)}</p><p class="notice">Xem cùng nội dung bài qua ba concept. Lựa chọn áp dụng cho toàn bộ video. Đây là khung hình tĩnh để duyệt bố cục, chưa có lời đọc.</p><div class="tabs" aria-label="Khung hình xem trước">${["Đề bài", "Bước giải", "Kết thúc"].map((label, i) => `<button type="button" data-frame="${i}" aria-pressed="${i === 0}">${label}</button>`).join("")}</div><div class="cards">${mathConcepts.map(concept => `<article class="card"><label class="pick"><input type="radio" name="concept" value="${concept.id}" ${selected === concept.id ? "checked" : ""}><h2>${concept.title}</h2></label><p>${concept.description}</p><div class="frame"><iframe title="${concept.title} — khung hình bài giảng" src="${concept.id}-0.html"></iframe></div><p class="suitable">${concept.suitable}</p></article>`).join("")}</div></main><div class="action"><button id="save" type="button" ${selected === "classic" ? "disabled" : ""}>Sử dụng concept này</button><span id="status" role="status" aria-live="polite">${selected === "classic" ? "Chọn một concept để tiếp tục." : "Concept đã lưu được đánh dấu. Có thể chọn lại."}</span></div><script>
const save = document.getElementById('save'), status = document.getElementById('status');
const radios = [...document.querySelectorAll('input[name=concept]')];
radios.forEach(radio => radio.addEventListener('change', () => { save.disabled = false; status.textContent = 'Đã chọn ' + radio.closest('label').innerText + '. Bấm sử dụng để lưu.'; }));
document.querySelectorAll('[data-frame]').forEach(button => button.addEventListener('click', () => {
  document.querySelectorAll('[data-frame]').forEach(other => other.setAttribute('aria-pressed', String(other === button)));
  document.querySelectorAll('.card').forEach(card => { card.querySelector('iframe').src = card.querySelector('input').value + '-' + button.dataset.frame + '.html'; });
}));
const observer = new ResizeObserver(entries => entries.forEach(entry => { entry.target.querySelector('iframe').style.transform = 'scale(' + entry.contentRect.width / 1080 + ')'; }));
document.querySelectorAll('.frame').forEach(frame => observer.observe(frame));
save.addEventListener('click', async () => {
  const radio = radios.find(radio => radio.checked); if (!radio) return;
  save.disabled = true; radios.forEach(r => r.disabled = true); status.textContent = 'Đang lưu…';
  try { const response = await fetch('/select', { method:'POST', headers:{'Content-Type':'application/json','X-Concept-Token':${JSON.stringify(token)}}, body:JSON.stringify({concept:radio.value}) });
    const data = await response.json(); if (!response.ok) throw new Error(data.error);
    status.textContent = 'Đã lưu ' + radio.closest('label').innerText + '. Có thể đóng trang và tiếp tục dựng video.';
  } catch (error) { status.textContent = error.message || 'Không lưu được. Hãy mở lại trang chọn concept.'; }
  finally { save.disabled = false; radios.forEach(r => r.disabled = false); }
});
</script></body></html>`;
}
