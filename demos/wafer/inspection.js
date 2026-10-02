"use strict";
const cases = [...document.querySelectorAll(".case")];
const picker = document.querySelector(".case-picker");
const workspace = document.querySelector(".workspace");
const previous = document.querySelector("#previous-case");
const next = document.querySelector("#next-case");
let selected = 0;
function setSection(section) {
  workspace.dataset.section = section;
  document.querySelectorAll("a[data-section]").forEach(link => {
    if (link.dataset.section === section) link.setAttribute("aria-current", "page");
    else link.removeAttribute("aria-current");
  });
  if (section === "map" && window.Plotly) {
    requestAnimationFrame(() => document.querySelectorAll(".plotly-graph-div").forEach(plot => window.Plotly.Plots.resize(plot)));
  }
}
function selectCase(index) {
  selected = Math.max(0, Math.min(cases.length - 1, index));
  cases.forEach((panel, n) => {
    panel.hidden = n !== selected;
    picker.children[n].setAttribute("aria-pressed", String(n === selected));
  });
  const current = cases[selected];
  const label = picker.children[selected].querySelector(".case-name").textContent;
  document.querySelector("#case-label").textContent = `사례 ${String(selected+1).padStart(2,"0")} / ${String(cases.length).padStart(2,"0")} · ${label}`;
  document.querySelector("#selection-status").textContent = `선택: ${label}`;
  document.querySelector("#validation-status").textContent = current.querySelector(".card-head .ok, .card-head .bad")?.textContent || "기록된 판독 카드";
  previous.disabled = selected === 0;
  next.disabled = selected === cases.length - 1;
  setSection("inspection");
  workspace.scrollTop = 0;
}
if (picker && cases.length) {
  cases.forEach((item, index) => {
    [...item.querySelectorAll(".maps .big")].forEach((figure, i) => {
      figure.classList.add(i ? "heat-figure" : "original-figure");
      const label = document.createElement("span");
      label.className = "map-label";
      label.textContent = i ? "GRAD-CAM" : "WAFER MAP";
      figure.prepend(label);
    });
    const unknown = !!item.querySelector(".pattern .warn");
    const button = document.createElement("button");
    button.type = "button";
    button.className = "case-button";
    const number = document.createElement("span");
    number.className = "case-number";
    number.textContent = String(index+1).padStart(2,"0");
    const dot = document.createElement("i");
    dot.className = "case-dot" + (unknown ? " unknown" : "");
    const name = document.createElement("span");
    name.className = "case-name";
    name.textContent = item.querySelector(".pattern").childNodes[0].textContent.trim();
    const badge = document.createElement("span");
    badge.className = "case-badge";
    badge.textContent = unknown ? "확인" : "분류";
    button.append(number, dot, name, badge);
    button.setAttribute("aria-controls", item.id);
    button.addEventListener("click", () => selectCase(index));
    button.addEventListener("keydown", event => {
      if (event.key === "ArrowDown" || event.key === "ArrowRight") {
        event.preventDefault(); selectCase(Math.min(index+1,cases.length-1)); picker.children[selected].focus();
      } else if (event.key === "ArrowUp" || event.key === "ArrowLeft") {
        event.preventDefault(); selectCase(Math.max(index-1,0)); picker.children[selected].focus();
      }
    });
    picker.append(button);
  });
  selectCase(0);
  previous.addEventListener("click", () => selectCase(selected-1));
  next.addEventListener("click", () => selectCase(selected+1));
}
document.querySelectorAll("[data-map-view]").forEach(button => {
  if (button.tagName !== "BUTTON") return;
  button.addEventListener("click", () => {
    setSection("inspection");
    workspace.dataset.mapView = button.dataset.mapView;
    document.querySelectorAll("button[data-map-view]").forEach(other => other.setAttribute("aria-pressed",String(other === button)));
  });
});
function showSection() {
  setSection(location.hash === "#map" ? "map" : "inspection");
}
document.querySelectorAll("a[data-section]").forEach(link => link.addEventListener("click", () => setSection(link.dataset.section)));
document.querySelectorAll("[data-open]").forEach(link => link.addEventListener("click", () => {
  document.getElementById(link.dataset.open).open = true;
}));
window.addEventListener("hashchange",showSection);
showSection();

// Agent run: replay the recorded judgement as the agent's tool calls, step by step.
const calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
let runTimer = null;
function kv(item, label) {
  const row = [...item.querySelectorAll(".verdict .kv")].find(r => r.querySelector("span").textContent.trim() === label);
  return row ? row.querySelector("b").textContent.trim() : "";
}
function buildRun(item) {
  const unknown = !!item.querySelector(".pattern .warn");
  const pattern = item.querySelector(".pattern").childNodes[0].textContent.trim();
  const sims = [...item.querySelectorAll(".sims figcaption")].map(c => c.textContent.trim());
  const pass = !!item.querySelector(".card-head .ok");
  const first = (item.querySelector(".card-head .muted")?.textContent || "").trim();
  const steps = [
    ["model.forward", "패턴 분류", unknown ? `가장 가까운 후보 · 확신도 ${kv(item, "분류 확신도")} (낮음)` : `${pattern} · 확신도 ${kv(item, "분류 확신도")}`],
    ["Reader.score · 임베딩 kNN", "처음 보는 패턴인지 확인", unknown ? `이상 점수 백분위 ${kv(item, "이상 점수 백분위")} → 처음 보는 패턴 경고` : `이상 점수 백분위 ${kv(item, "이상 점수 백분위")} → 아는 패턴`, unknown ? "tone-warn" : ""],
    ["locate.describe", "불량 위치 계산", `${kv(item, "계산된 위치")} · 불량 다이 ${kv(item, "불량 다이")}`],
    ["heat.gradcam_heat", "근거 히트맵", "모델이 주목한 영역 표시"],
    ["Reader.case_from_map", "유사 사례 검색", sims.slice(0, 2).join(", ") + (sims.length > 2 ? " …" : "")],
    ["agent.read_card", "판독 카드 작성 · qwen3.5:4b", unknown ? "원인을 고르지 않고 사람 확인을 요청" : "논문 근거가 있는 원인 후보 안에서만 작성"],
    ["agent.check", "코드 검사 (판정 · 위치 · 원인 표 · 금지 표현)", pass ? `위반 0건 · ${first || "통과"}` : "위반 발견 → 재질문", pass ? "tone-ok" : "tone-bad"],
  ];
  const run = document.createElement("div");
  run.className = "agent-run";
  run.innerHTML = `<div class="agent-head"><span class="agent-avatar" aria-hidden="true">✦</span><div><b>판독 에이전트</b><span class="agent-sub">분류 · 근거 · 판독 카드 · 코드 검사</span></div><button type="button" class="agent-replay" aria-label="에이전트 실행 다시 보기">↻ 다시 실행</button></div>
    <p class="agent-ask">웨이퍼 맵 1장 판독 요청</p>
    <ol class="agent-steps">${steps.map(([tool, title, result, tone]) => `<li class="agent-step ${tone || ""}"><span class="step-icon" aria-hidden="true"></span><div><span class="step-title">${title}</span><code>${tool}</code><span class="step-result">${result}</span></div></li>`).join("")}</ol>
    <div class="agent-done" role="status"></div>`;
  run.querySelector(".agent-replay").addEventListener("click", () => play(item));
  const card = item.querySelector(".card");
  card.prepend(run);
  card.querySelector(".card-head").classList.add("agent-answer-head");
}
function play(item) {
  clearTimeout(runTimer);
  const card = item.querySelector(".card");
  const steps = [...card.querySelectorAll(".agent-step")];
  const done = card.querySelector(".agent-done");
  const unknown = !!item.querySelector(".pattern .warn");
  const finish = () => {
    card.classList.remove("running");
    done.textContent = unknown ? "완료 · 처음 보는 패턴 — 사람 확인 필요" : "완료 · 판독 카드 검사 통과";
    done.classList.toggle("tone-warn", unknown);
  };
  if (calm) { steps.forEach(s => s.classList.add("is-done")); finish(); return; }
  card.classList.add("running");
  done.textContent = "";
  steps.forEach(s => s.classList.remove("is-done", "is-active"));
  let i = 0;
  const tick = () => {
    if (i > 0) { steps[i - 1].classList.remove("is-active"); steps[i - 1].classList.add("is-done"); }
    if (i === steps.length) { finish(); return; }
    steps[i].classList.add("is-active");
    i += 1;
    runTimer = setTimeout(tick, i === steps.length - 1 ? 1100 : 520);
  };
  tick();
}
cases.forEach(buildRun);
const playSelected = () => play(cases[selected]);
picker?.addEventListener("click", () => requestAnimationFrame(playSelected));
picker?.addEventListener("keydown", e => { if (e.key.startsWith("Arrow")) requestAnimationFrame(playSelected); });
previous?.addEventListener("click", () => requestAnimationFrame(playSelected));
next?.addEventListener("click", () => requestAnimationFrame(playSelected));
playSelected();
