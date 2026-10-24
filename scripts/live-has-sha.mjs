#!/usr/bin/env node
// Wait until GitHub Pages has built <sha> (or a later commit that contains it), then confirm the
// live page answers 200. The site deploys from the main branch (build_type "legacy"), so the
// Pages build API tells which commit is live.
//
//   node scripts/live-has-sha.mjs <sha>
// Also used by willnew: --deploy-check "node scripts/live-has-sha.mjs {sha}"
import { execFileSync } from "node:child_process";

const REPO = "Haejyn/Haejyn.github.io";
const URL_TO_CHECK = "https://haejyn.github.io/tving/";
const INTERVAL = 15_000;
const LIMIT = 10 * 60_000;

const sha = (process.argv[2] ?? "").trim();
if (!/^[0-9a-f]{7,40}$/i.test(sha)) { console.error("사용법: node scripts/live-has-sha.mjs <sha>"); process.exit(2); }

const gh = path => JSON.parse(execFileSync("gh", ["api", path], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }));
const sleep = ms => new Promise(r => setTimeout(r, ms));
const same = (a, b) => a.toLowerCase().startsWith(b.toLowerCase()) || b.toLowerCase().startsWith(a.toLowerCase());

/** true when `live` is `sha` or a descendant of it. */
function contains(live) {
  if (same(live, sha)) return true;
  try {
    const cmp = gh(`repos/${REPO}/compare/${sha}...${live}`);
    return cmp.status === "ahead" || cmp.status === "identical";
  } catch { return false; }
}

const started = Date.now();
let built = false;
while (Date.now() - started < LIMIT) {
  let build;
  try { build = gh(`repos/${REPO}/pages/builds/latest`); }
  catch (e) { console.log(`Pages 빌드 조회 실패: ${String(e.stderr || e.message).trim().split("\n")[0]}`); }
  if (build) {
    const live = build.commit ?? "";
    console.log(`Pages 빌드 ${build.status}, 커밋 ${live.slice(0, 7) || "?"}`);
    if (build.status === "errored") { console.error(`Pages 빌드 오류: ${build.error?.message ?? ""}`); process.exit(1); }
    if (build.status === "built" && live && contains(live)) { built = true; break; }
  }
  await sleep(INTERVAL);
}
if (!built) { console.error(`${Math.round(LIMIT / 60000)}분 안에 ${sha} 가 배포되지 않음`); process.exit(1); }

let status = 0;
for (let i = 0; i < 3 && status !== 200; i++) {
  if (i) await sleep(INTERVAL);
  try { status = (await fetch(URL_TO_CHECK, { redirect: "follow", cache: "no-store", signal: AbortSignal.timeout(20_000) })).status; }
  catch (e) { status = `오류 ${e.cause?.code ?? e.name}`; }
}
if (status !== 200) { console.error(`${URL_TO_CHECK} 응답 ${status}`); process.exit(1); }
console.log(`배포 확인: ${sha.slice(0, 7)} 빌드 완료, ${URL_TO_CHECK} 200`);
