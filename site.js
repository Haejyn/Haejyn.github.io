"use strict";
// Playback starts on request; stop other and off-screen demos to save resources.
const videos = [...document.querySelectorAll("video:not(.flow-clip)")];
videos.forEach(video => {
  video.addEventListener("play", () => {
    videos.forEach(other => { if (other !== video) other.pause(); });
  });
  const status = video.closest(".media")?.querySelector(".media-status");
  const showError = () => {
    if (status) status.textContent = "영상을 불러오지 못했습니다. 영상 파일 링크에서 직접 열거나 저장소에서 데모를 확인해주세요.";
  };
  video.addEventListener("error", showError);
  const sources = [...video.querySelectorAll("source")];
  const failed = new Set();
  sources.forEach(source => source.addEventListener("error", () => {
    failed.add(source);
    if (failed.size === sources.length) showError();
  }));
  if (video.error) showError();
  video.addEventListener("loadeddata", () => {failed.clear(); if (status) status.textContent = "";});
});
if ("IntersectionObserver" in window) {
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {if (!entry.isIntersecting) entry.target.pause();});
  }, {threshold: 0.05});
  videos.forEach(video => observer.observe(video));
}
// BIW: switch the demo between the simulation video and the AI judgement GIF.
document.querySelectorAll(".swap").forEach(button => {
  const figure = button.closest(".media");
  const video = figure.querySelector("video");
  let gif;
  button.addEventListener("click", () => {
    if (!gif) {
      gif = document.createElement("img");
      gif.src = button.dataset.gif;
      gif.alt = "설계 조건에 따른 AI 제조성 판정과 비교 결과";
      video.after(gif);
    } else {
      gif.hidden = !gif.hidden;
    }
    const showingGif = !gif.hidden;
    video.hidden = showingGif;
    if (showingGif) video.pause();
    button.textContent = showingGif ? "시뮬레이션 영상 보기" : "AI 제조성 판정 데모 보기";
  });
});
// Print / Save as PDF: open collapsed sections and load lazy images first.
let openedForPrint = [];
window.addEventListener("beforeprint", () => {
  openedForPrint = [...document.querySelectorAll("details:not([open])")];
  openedForPrint.forEach(d => { d.open = true; });
  document.querySelectorAll('img[loading="lazy"]').forEach(img => { img.loading = "eager"; });
});
window.addEventListener("afterprint", () => {
  openedForPrint.forEach(d => { d.open = false; });
  openedForPrint = [];
});
// Workflow clips: play silently while on screen (unless reduced motion), pause otherwise.
const clips = [...document.querySelectorAll("video.flow-clip")];
const calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
if (calm) clips.forEach(c => { c.controls = true; });
else if ("IntersectionObserver" in window) {
  const clipObserver = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) e.target.play().catch(() => {}); else e.target.pause(); });
  }, {threshold: 0.35});
  clips.forEach(c => clipObserver.observe(c));
}
