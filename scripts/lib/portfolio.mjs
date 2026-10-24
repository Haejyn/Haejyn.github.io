// Shared helpers for the facts pipeline. Node 20+, no dependencies.
import { readFileSync, writeFileSync, existsSync, readdirSync, mkdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";

export const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
export const REPO = "Haejyn/Haejyn.github.io";
export const SITE = "https://haejyn.github.io";
// Pages that carry fact placeholders and the changelog block. `/` is a copy of `/tving/`.
export const PAGES = ["tving/index.html", "index.html"];
export const HISTORY_DIR = "tving/history";
export const HISTORY_INDEX = `${HISTORY_DIR}/index.html`;
export const FACTS_DIR = "data/facts";
export const CHANGELOG = "data/changelog.json";
// Snapshots start here: earlier versions still linked a private repository.
export const SNAPSHOT_FROM = "069ecea";
export const PROJECT_ORDER = ["willnew", "wasnew"];

export const FACT_RE = /<!-- fact:([A-Za-z0-9_.-]+) -->([\s\S]*?)<!-- \/fact -->/g;
export const META_RE = /<meta name="facts" content="([^"]*)">/;
export const CHANGELOG_RE = /<!-- changelog -->[\s\S]*?<!-- \/changelog -->/;

// Labels used in automatic changelog summaries ("willnew 테스트 94 → 95").
const LABELS = {
  "tests.passed": "테스트",
  "tests.total": "전체 테스트",
  "tests.failed": "실패 테스트",
  "tests.files": "테스트 파일",
  mcpTools: "MCP 도구",
  version: "버전",
  date: "날짜",
};

export const abs = p => join(ROOT, p);
export const read = p => readFileSync(abs(p), "utf8");
export const exists = p => existsSync(abs(p));

/** Write only when content differs. Returns true when the file changed. */
export function writeIfChanged(p, content) {
  if (exists(p) && read(p) === content) return false;
  mkdirSync(dirname(abs(p)), { recursive: true });
  writeFileSync(abs(p), content);
  return true;
}

export function git(args, opts = {}) {
  return execFileSync("git", args, { cwd: ROOT, encoding: "utf8", maxBuffer: 64 << 20, stdio: ["ignore", "pipe", "pipe"], ...opts });
}

export const esc = s => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

// ---------- facts ----------

export function validateFacts(obj, project) {
  const errs = [];
  if (!obj || typeof obj !== "object") return ["JSON 객체가 아님"];
  if (obj.schema !== 1) errs.push(`schema 가 1 이 아님 (${obj.schema})`);
  if (project && obj.project !== project) errs.push(`project 가 ${project} 가 아님 (${obj.project})`);
  if (typeof obj.version !== "string") errs.push("version 없음");
  if (typeof obj.commit !== "string" || !obj.commit) errs.push("commit 없음");
  if (typeof obj.date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(obj.date)) errs.push("date 가 YYYY-MM-DD 가 아님");
  // Hand-entered files ("commit": "manual") may leave values they cannot back up as null.
  const manual = obj.commit === "manual";
  const t = obj.tests;
  if (!t || typeof t !== "object") errs.push("tests 없음");
  else for (const k of ["passed", "failed", "total", "files"]) {
    if (manual && t[k] === null) continue;
    if (!Number.isInteger(t[k]) || t[k] < 0) errs.push(`tests.${k} 가 0 이상 정수가 아님`);
  }
  if ("mcpTools" in obj && (!Number.isInteger(obj.mcpTools) || obj.mcpTools < 0)) errs.push("mcpTools 가 0 이상 정수가 아님");
  return errs;
}

/** { willnew: {...}, wasnew: {...} } from data/facts/*.json */
export function loadFacts() {
  const facts = {};
  if (!exists(FACTS_DIR)) return facts;
  for (const f of readdirSync(abs(FACTS_DIR)).filter(f => f.endsWith(".json")).sort()) {
    const name = f.slice(0, -5);
    facts[name] = JSON.parse(read(`${FACTS_DIR}/${f}`));
  }
  return facts;
}

export function lookup(facts, key) {
  let v = facts;
  for (const part of key.split(".")) {
    if (v == null || typeof v !== "object" || !(part in v)) return undefined;
    v = v[part];
  }
  return v;
}

export function formatFact(v) {
  if (typeof v === "number") return v.toLocaleString("en-US");
  return String(v);
}

export const shortSha = c => (/^[0-9a-f]{40}$/i.test(c) ? c.slice(0, 7) : c);

export function factsMeta(facts) {
  const names = Object.keys(facts).sort((a, b) => {
    const ia = PROJECT_ORDER.indexOf(a), ib = PROJECT_ORDER.indexOf(b);
    return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib) || a.localeCompare(b);
  });
  return names.map(n => `${n}@${shortSha(facts[n].commit ?? "unknown")}`).join(",");
}

export function labelFor(key) {
  const [project, ...rest] = key.split(".");
  const sub = rest.join(".");
  return `${project} ${LABELS[sub] ?? sub}`;
}

/** List every placeholder in an HTML string. */
export function placeholders(html) {
  return [...html.matchAll(FACT_RE)].map(m => ({ key: m[1], value: m[2], index: m.index }));
}

/** Blank out every generated region so two versions can be compared on hand-written text only. */
export function stripGenerated(html) {
  return html
    .replace(FACT_RE, (_, k) => `<!-- fact:${k} --><!-- /fact -->`)
    .replace(META_RE, '<meta name="facts" content="">')
    .replace(CHANGELOG_RE, "<!-- changelog --><!-- /changelog -->");
}

// ---------- changelog ----------

export function loadChangelog(text) {
  const raw = text ?? (exists(CHANGELOG) ? read(CHANGELOG) : "[]");
  const list = JSON.parse(raw);
  if (!Array.isArray(list)) throw new Error(`${CHANGELOG} 는 배열이어야 합니다`);
  return list;
}

export const changelogText = entries => JSON.stringify(entries, null, 2) + "\n";

export const dotDate = d => String(d).replace(/-/g, ".");

export function todayKST() {
  return new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 10);
}

export const snapshotExists = sha => !!sha && exists(`${HISTORY_DIR}/${sha}/index.html`);

const KIND = { facts: "숫자", content: "내용" };

function commitLink(sha) {
  return sha ? `<a href="https://github.com/${REPO}/commit/${esc(sha)}"><code>${esc(sha)}</code></a>` : "";
}

/** Recent entries for the bottom of the portfolio page. */
export function renderChangelogBlock(entries, limit = 5) {
  const recent = [...entries].reverse().slice(0, limit);
  const items = recent.map(e => {
    const old = e.kind === "content" && snapshotExists(e.commit)
      ? ` <a class="change-old" href="/${HISTORY_DIR}/${esc(e.commit)}/">이 버전 보기</a>` : "";
    return `    <li><time datetime="${esc(e.date)}">${esc(dotDate(e.date))}</time><span class="change-kind">${KIND[e.kind] ?? esc(e.kind)}</span><span class="change-text">${esc(e.summary)}${old}</span></li>`;
  });
  return [
    "<!-- changelog -->",
    '  <section class="changelog" aria-labelledby="changelog-title">',
    '  <h2 id="changelog-title"><span>변경 기록</span></h2>',
    '  <ol class="changes">',
    ...items,
    "  </ol>",
    `  <p class="changes-more"><a href="/${HISTORY_DIR}/">전체 변경 기록과 이전 버전</a></p>`,
    "  </section>",
    "<!-- /changelog -->",
  ].join("\n");
}

/** Full table at /tving/history/. */
export function renderHistoryIndex(entries) {
  const rows = [...entries].reverse().map(e => {
    const snap = e.kind === "content" && snapshotExists(e.commit) ? `<a href="./${esc(e.commit)}/">열기</a>` : "";
    return `        <tr><td><time datetime="${esc(e.date)}">${esc(dotDate(e.date))}</time></td><td>${KIND[e.kind] ?? esc(e.kind)}</td><td>${esc(e.summary)}</td><td>${commitLink(e.commit)}</td><td>${snap}</td></tr>`;
  });
  return `<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="theme-color" content="#faf6f1">
<title>변경 기록과 이전 버전 | 이해준 포트폴리오</title>
<meta name="description" content="TVING 포트폴리오 페이지의 변경 기록과 이전 버전 스냅샷">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css">
<link rel="stylesheet" href="../../styles.css">
</head>
<body>
<main class="doc">
  <p class="back"><a href="/tving/">지금 버전으로 돌아가기</a></p>
  <h1 class="history-title">변경 기록과 이전 버전</h1>
  <p class="history-note">숫자는 willnew, wasnew CI 가 만든 facts.json 에서 자동으로 갱신하고, 문장 변경은 사람이 승인한 뒤 기록합니다. 이전 버전은 그 커밋 시점의 페이지를 그대로 저장한 것이고 검색에 노출하지 않습니다.</p>
  <div class="table-scroll"><table class="runs history">
    <thead><tr><th scope="col">날짜</th><th scope="col">종류</th><th scope="col">내용</th><th scope="col">커밋</th><th scope="col">이전 버전</th></tr></thead>
    <tbody>
${rows.join("\n")}
    </tbody>
  </table></div>
</main>
</body>
</html>
`;
}

/** Fill placeholders, meta and changelog block in one page's HTML. */
export function renderPage(html, facts, entries) {
  let out = html.replace(FACT_RE, (whole, key, value) => {
    const v = lookup(facts, key);
    return v == null ? whole : `<!-- fact:${key} -->${formatFact(v)}<!-- /fact -->`;
  });
  out = out.replace(META_RE, `<meta name="facts" content="${esc(factsMeta(facts))}">`);
  out = out.replace(CHANGELOG_RE, renderChangelogBlock(entries));
  return out;
}

// Keep the line endings a checkout gave the file (core.autocrlf on Windows), so a second run
// writes nothing.
const sameEol = (text, like) => {
  const lf = text.replace(/\r\n/g, "\n");
  return like?.includes("\r\n") ? lf.replace(/\n/g, "\r\n") : lf;
};
const writeGenerated = (p, text) => writeIfChanged(p, sameEol(text, exists(p) ? read(p) : null));

/** Re-render every generated file from data/. Returns the list of files written. */
export function renderAll(facts = loadFacts(), entries = loadChangelog()) {
  const written = [];
  for (const p of PAGES) {
    if (!exists(p)) continue;
    if (writeGenerated(p, renderPage(read(p), facts, entries))) written.push(p);
  }
  if (writeGenerated(HISTORY_INDEX, renderHistoryIndex(entries))) written.push(HISTORY_INDEX);
  return written;
}
