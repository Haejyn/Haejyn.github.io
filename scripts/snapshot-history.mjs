#!/usr/bin/env node
// Save old versions of /tving/ under tving/history/<sha>/ for every "content" changelog entry
// from SNAPSHOT_FROM on, then re-render the history index and the changelog blocks.
//
// Entries added before their commit existed have "commit": "". This script fills them with the
// commit that first added the entry to data/changelog.json, so run it after a content PR merges.
//
//   node scripts/snapshot-history.mjs [--force]
import {
  CHANGELOG, CHANGELOG_RE, HISTORY_DIR, SNAPSHOT_FROM, REPO, PAGE_SCOPE, git, esc, dotDate, exists,
  renderChangelogBlock, loadChangelog, changelogText, writeIfChanged, renderAll,
} from "./lib/portfolio.mjs";

const force = process.argv.includes("--force");
const RAW = `https://raw.githubusercontent.com/${REPO}`;

function tryGit(args) {
  try { return git(args, { stdio: ["ignore", "pipe", "ignore"] }); } catch { return null; }
}

// 1. Fill empty commits.
let entries = loadChangelog();
let filled = 0;
entries = entries.map(e => {
  if (e.commit) return e;
  const needle = JSON.stringify(e.summary);
  const out = tryGit(["log", "--format=%h", "--abbrev=7", "--reverse", "-S", needle, "--", CHANGELOG]);
  const sha = out?.split("\n").find(Boolean);
  if (!sha) return e;
  filled++;
  return { ...e, commit: sha };
});
if (filled && writeIfChanged(CHANGELOG, changelogText(entries))) console.log(`커밋을 채운 항목: ${filled}개`);

// 2. Snapshots.
const isAfterCutoff = sha => tryGit(["merge-base", "--is-ancestor", SNAPSHOT_FROM, sha]) !== null;
const changedPage = sha => {
  const out = tryGit(["diff-tree", "--no-commit-id", "--name-only", "-r", "-m", "--first-parent", sha, "--", "tving/index.html"]);
  return !!out && out.trim().length > 0;
};

function rewrite(html, sha, date, upTo) {
  const media = `${RAW}/${sha}/media/`;
  let out = html
    // Media from the commit itself, so files deleted later still load.
    .replace(/(["'(])(?:\.\.\/)?media\//g, `$1${media}`)
    .replace(/(["'])\.\.\/styles\.css\1/g, "$1styles.css$1")
    .replace(/(["'])\.\.\/site\.js\1/g, "$1site.js$1")
    // Other relative links pointed at the site root.
    .replace(/(href|src)="\.\.\//g, '$1="/')
    // The block saved in that commit may list entries that are now hidden (scope "site").
    .replace(CHANGELOG_RE, () => renderChangelogBlock(upTo));
  const head = [
    '<meta name="robots" content="noindex">',
    "<style>.history-band{position:sticky;top:0;z-index:10;margin:0;padding:10px 16px;background:var(--hi,#000);color:var(--bg,#fff);font-size:15px;line-height:1.5;text-align:center}.history-band a{color:inherit;font-weight:700}.history-band a:hover{color:inherit}@media print{.history-band{position:static}}</style>",
  ].join("\n");
  out = /<meta charset[^>]*>/i.test(out)
    ? out.replace(/<meta charset[^>]*>/i, m => `${m}\n${head}`)
    : out.replace(/<head>/i, `<head>\n${head}`);
  const band = `<p class="history-band" role="note">이전 버전 (${esc(dotDate(date))}, <a href="https://github.com/${REPO}/commit/${esc(sha)}">${esc(sha)}</a>). <a href="/tving/">지금 버전 보기</a> · <a href="/${HISTORY_DIR}/">전체 기록</a></p>`;
  out = out.replace(/<body([^>]*)>/i, `<body$1>\n${band}`);
  return out;
}

let saved = 0;
for (const [i, e] of entries.entries()) {
  if (e.kind !== "content" || e.scope !== PAGE_SCOPE || !e.commit) continue;
  const sha = e.commit;
  if (!isAfterCutoff(sha)) continue;
  if (!changedPage(sha)) continue; // page identical to an earlier version
  const dir = `${HISTORY_DIR}/${sha}`;
  if (exists(`${dir}/index.html`) && !force) continue;
  const page = tryGit(["show", `${sha}:tving/index.html`]);
  if (page === null) { console.warn(`${sha}: tving/index.html 없음, 건너뜀`); continue; }
  writeIfChanged(`${dir}/index.html`, rewrite(page, sha, e.date, entries.slice(0, i + 1)));
  for (const f of ["styles.css", "site.js"]) {
    const body = tryGit(["show", `${sha}:${f}`]);
    if (body !== null) writeIfChanged(`${dir}/${f}`, body);
  }
  saved++;
  console.log(`저장: ${dir}/`);
}

// 3. History index and changelog blocks (they link to snapshots that now exist).
const written = renderAll(undefined, entries);
console.log(saved || written.length ? `스냅샷 ${saved}개, 다시 그린 파일: ${written.join(", ") || "없음"}` : "바뀐 것 없음");
