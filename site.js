"use strict";
// Playback starts on request; stop other and off-screen demos to save resources.
const videos = [...document.querySelectorAll("video")];
videos.forEach(video => {
  video.addEventListener("play", () => {
    videos.forEach(other => { if (other !== video) other.pause(); });
  });
  const status = video.closest(".media, .block")?.querySelector(".media-status");
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
