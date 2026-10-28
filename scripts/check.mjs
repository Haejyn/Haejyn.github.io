#!/usr/bin/env node
// Portfolio checks. Exits non-zero on any failure.
//
//   node scripts/check.mjs [--offline] [--base <ref>]
//
//   1. fact placeholders: not empty, equal to data/facts, meta facts and generated blocks up to date
//   2. external links answer 200 (skipped with --offline)
//   3. benchmark table cells: every number carries a unit
//   4. sensitive data: phone numbers, resident registration numbers, e-mails outside the allow list
//   5. with --base: hand-written changes to the portfolio page need a new "content" changelog entry
import { readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import {
  ROOT, PAGES, HISTORY_DIR, HISTORY_INDEX, CHANGELOG, read, exists, git,
  loadFacts, loadChangelog, validateFacts, placeholders, lookup, formatFact, factsMeta,
  META_RE, CHANGELOG_RE, renderHistoryIndex, stripGenerated,
  SCOPES, PAGE_SCOPE, HIDDEN_WORDS,
} from "./lib/portfolio.mjs";

const args = process.argv.slice(2);
const offline = args.includes("--offline");
const base = args.includes("--base") ? args[args.indexOf("--base") + 1] : null;
if (args.includes("--base") && !base) { console.error("--base 에 ref 를 주세요"); process.exit(2); }

const ALLOWED_EMAILS = new Set(["ssungiven@gmail.com"]);
const UNIT = String.raw`(?:ms|s|µs|us|ns|min|h|MB|GB|KB|kB|TB|B|%|초|분|시간|배|개|건|장)`;

const failures = [];
const warnings = [];
const fail = (where, msg) => failures.push(`${where}: ${msg}`);
const warn = (where, msg) => warnings.push(`${where}: ${msg}`);
const lf = s => s.replace(/\r\n/g, "\n");

// Files a visitor can open. Snapshots are old copies and only get the sensitive-data scan.
function walk(dir, out = []) {
  for (const name of readdirSync(join(ROOT, dir))) {
    if (name === ".git" || name === "node_modules" || name === ".github" || name === "scripts") continue;
    const p = dir ? `${dir}/${name}` : name;
    if (statSync(join(ROOT, p)).isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
}
const files = walk("");
const isSnapshot = p => p.startsWith(`${HISTORY_DIR}/`) && p !== HISTORY_INDEX;
const htmlPages = files.filter(p => p.endsWith(".html") && !isSnapshot(p));
const textFiles = files.filter(p => /\.(html|md|json|js|css|txt|xml|svg)$/i.test(p));

// ---------- 1. facts ----------
const facts = loadFacts();
for (const [name, f] of Object.entries(facts)) {
  for (const e of validateFacts(f, name)) fail(`data/facts/${name}.json`, e);
}
let entries = [];
try { entries = loadChangelog(); } catch (e) { fail(CHANGELOG, e.message); }
entries.forEach((e, i) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(e.date ?? "")) fail(CHANGELOG, `${i}번 항목 date 형식`);
  if (!["facts", "content"].includes(e.kind)) fail(CHANGELOG, `${i}번 항목 kind 는 facts 또는 content`);
  if (typeof e.summary !== "string" || !e.summary.trim()) fail(CHANGELOG, `${i}번 항목 summary 비어 있음`);
  if (typeof e.commit !== "string") fail(CHANGELOG, `${i}번 항목 commit 은 문자열`);
  if (!SCOPES.includes(e.scope)) fail(CHANGELOG, `${i}번 항목 scope 는 ${SCOPES.join(" 또는 ")}`);
  else if (e.kind === "facts" && e.scope !== PAGE_SCOPE) fail(CHANGELOG, `${i}번 facts 항목 scope 는 ${PAGE_SCOPE}`);
});

for (const p of htmlPages) {
  const html = read(p);
  const ph = placeholders(html);
  for (const { key, value } of ph) {
    const v = lookup(facts, key);
    if (!value.trim()) fail(p, `표시 자리 ${key} 가 비어 있음`);
    else if (v === undefined || v === null) fail(p, `표시 자리 ${key} 의 값이 data/facts 에 없음`);
    else if (value !== formatFact(v)) fail(p, `표시 자리 ${key} = ${value}, data/facts 는 ${formatFact(v)}`);
  }
  const unclosed = (html.match(/<!-- fact:/g) ?? []).length - ph.length;
  if (unclosed) fail(p, `닫히지 않은 표시 자리 ${unclosed}개`);
  if (PAGES.includes(p)) {
    const meta = html.match(META_RE);
    if (!meta) fail(p, '<meta name="facts"> 없음');
    else if (meta[1] !== factsMeta(facts)) fail(p, `meta facts = "${meta[1]}", data/facts 는 "${factsMeta(facts)}"`);
    if (CHANGELOG_RE.test(html) || /\bid="changelog-title"|\bhref="\/tving\/history\//.test(html)) {
      fail(p, "포트폴리오에 변경 기록이나 이전 버전 링크가 표시됨");
    }
  }
}
if (!exists(HISTORY_INDEX) || lf(read(HISTORY_INDEX)) !== renderHistoryIndex(entries)) {
  fail(HISTORY_INDEX, "data/changelog.json 과 다름 (node scripts/apply-facts.mjs)");
}

// ---------- 1b. other company names in the TVING changelog ----------
// Only the generated changelog block and the history list. Awards and project text are not checked.
const hiddenRegions = [];
for (const p of files.filter(f => f.endsWith(".html") && (PAGES.includes(f) || f.startsWith(`${HISTORY_DIR}/`)))) {
  const html = read(p);
  const block = html.match(CHANGELOG_RE);
  if (block) hiddenRegions.push([p, block[0]]);
  if (p === HISTORY_INDEX) {
    const list = html.match(/<tbody>[\s\S]*?<\/tbody>/);
    if (list) hiddenRegions.push([p, list[0]]);
  }
}
for (const [p, region] of hiddenRegions) {
  const text = region.replace(/<[^>]+>/g, " ");
  for (const w of HIDDEN_WORDS) if (text.toLowerCase().includes(w.toLowerCase())) fail(p, `변경 기록에 TVING 밖 내용("${w}")이 보임`);
}

// ---------- 3. benchmark cells ----------
const stripTags = s => s.replace(/<[^>]+>/g, "").replace(/&nbsp;/g, " ").trim();
for (const p of htmlPages) {
  const html = read(p);
  for (const d of html.matchAll(/<details[^>]*>([\s\S]*?)<\/details>/g)) {
    const summary = d[1].match(/<summary>([\s\S]*?)<\/summary>/)?.[1] ?? "";
    if (!/벤치마크/.test(summary)) continue;
    for (const t of d[1].matchAll(/<table class="runs">([\s\S]*?)<\/table>/g)) {
      for (const cell of t[1].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)) {
        const text = stripTags(cell[1]);
        for (const n of text.matchAll(/\d[\d,]*(?:\.\d+)?/g)) {
          const after = text.slice(n.index + n[0].length);
          if (!new RegExp(`^\\s?${UNIT}(?![A-Za-z])`).test(after)) fail(p, `벤치마크 셀 "${text}" 의 ${n[0]} 에 단위 없음`);
        }
      }
    }
  }
}

// ---------- 4. sensitive data ----------
const PHONE = /(?<![\d-])01[016789][-. ]?\d{3,4}[-. ]?\d{4}(?![\d-])/g;
const RRN = /(?<!\d)\d{2}(?:0[1-9]|1[0-2])(?:0[1-9]|[12]\d|3[01])-[1-8]\d{6}(?!\d)/g;
const EMAIL = /[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}/g;
for (const p of textFiles) {
  const text = read(p);
  for (const m of text.matchAll(PHONE)) fail(p, `휴대폰 번호 꼴 ${m[0].slice(0, 3)}…`);
  for (const m of text.matchAll(RRN)) fail(p, `주민등록번호 꼴 ${m[0].slice(0, 6)}-…`);
  for (const m of text.matchAll(EMAIL)) {
    if (!ALLOWED_EMAILS.has(m[0].toLowerCase())) fail(p, `허용 목록 밖 이메일 ${m[0]}`);
  }
  if (text.includes("[PRIVATE:")) fail(p, "[PRIVATE: …] 표시가 남아 있음");
}

// ---------- 5. --base ----------
if (base) {
  const show = path => { try { return git(["show", `${base}:${path}`], { stdio: ["ignore", "pipe", "ignore"] }); } catch { return null; } };
  const key = e => JSON.stringify([e.date, e.kind, e.scope, e.summary]);
  let baseEntries = [];
  try { baseEntries = loadChangelog(show(CHANGELOG) ?? "[]"); } catch { /* treat as empty */ }
  const before = new Set(baseEntries.map(key));
  const newContent = scope => entries.filter(e => e.kind === "content" && e.scope === scope && !before.has(key(e)));
  // TVING page or its copy at /: needs a new "tving" content entry.
  for (const p of PAGES) {
    const old = show(p);
    if (old === null || !exists(p)) continue;
    if (lf(stripGenerated(old)) !== lf(stripGenerated(read(p))) && !newContent("tving").length) {
      fail(p, `${base} 대비 표시 자리 밖 문장이 바뀌었는데 ${CHANGELOG} 에 새 content 항목(scope tving)이 없음`);
    }
  }
  // Other pages (chooser, other companies): a new "site" content entry is enough.
  const names = s => s.split("\n").map(l => l.trim()).filter(Boolean);
  const otherPages = [...new Set([
    ...names(git(["-c", "core.quotepath=false", "diff", "--name-only", base, "--", "*.html"])),
    ...names(git(["-c", "core.quotepath=false", "ls-files", "--others", "--exclude-standard", "--", "*.html"])),
  ])].filter(p => !PAGES.includes(p) && !p.startsWith(`${HISTORY_DIR}/`));
  if (otherPages.length && !newContent("site").length) {
    fail(otherPages.join(", "), `${base} 대비 바뀌었는데 ${CHANGELOG} 에 새 content 항목(scope site)이 없음`);
  }
}

// ---------- 2. links ----------
async function checkLinks() {
  const urls = new Map();
  for (const p of htmlPages) {
    for (const m of read(p).matchAll(/\b(?:href|src|poster)="(https?:\/\/[^"]+)"/g)) {
      const url = m[1].replace(/&amp;/g, "&").split("#")[0];
      if (!urls.has(url)) urls.set(url, new Set());
      urls.get(url).add(p);
    }
  }
  const list = [...urls.keys()];
  const status = async url => {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        let res = await fetch(url, { method: "HEAD", redirect: "follow", signal: AbortSignal.timeout(15000), headers: { "user-agent": "portfolio-check" } });
        if (res.status === 405 || res.status === 403) {
          res = await fetch(url, { redirect: "follow", signal: AbortSignal.timeout(15000), headers: { "user-agent": "portfolio-check" } });
          res.body?.cancel();
        }
        if (res.status >= 500 && attempt === 0) continue;
        return res.status;
      } catch (e) {
        if (attempt === 1) return `오류 ${e.cause?.code ?? e.name}`;
      }
    }
  };
  let i = 0;
  const results = new Map();
  await Promise.all(Array.from({ length: 6 }, async () => {
    while (i < list.length) { const url = list[i++]; results.set(url, await status(url)); }
  }));
  const repoStatus = new Map();
  for (const [url, s] of results) {
    const where = [...urls.get(url)].join(", ");
    if (s === 200) continue;
    if (s === 429) { warn(where, `${url} 응답 429 (요청 제한), 건너뜀`); continue; }
    const repo = url.match(/^https:\/\/github\.com\/Haejyn\/([^/?#]+)/);
    if (s === 404 && repo) {
      // GitHub answers 404 for private repositories, so tell a hidden repo from a wrong path.
      const root = `https://github.com/Haejyn/${repo[1]}`;
      if (!repoStatus.has(root)) repoStatus.set(root, results.get(root) ?? await status(root));
      if (repoStatus.get(root) === 404) fail(where, `${url} 404: 비공개 저장소 링크 (방문자에게 안 보이는 Haejyn/${repo[1]})`);
      else fail(where, `${url} 404: 저장소에 없는 경로`);
    } else fail(where, `${url} 응답 ${s}`);
  }
  return list.length;
}

let linkCount = 0;
if (!offline) linkCount = await checkLinks();

for (const w of warnings) console.warn(`경고 ${w}`);
if (failures.length) {
  for (const f of failures) console.error(`실패 ${f}`);
  console.error(`\n검사 실패 ${failures.length}건`);
  process.exit(1);
}
console.log(`검사 통과: 페이지 ${htmlPages.length}개, 파일 ${textFiles.length}개${offline ? ", 링크 검사 끔" : `, 외부 링크 ${linkCount}개`}${base ? `, ${base} 대비 변경 기록 확인` : ""}`);
