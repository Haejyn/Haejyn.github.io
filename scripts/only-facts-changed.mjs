#!/usr/bin/env node
// Decide whether a change may merge without a person: compared with <base>, the working tree may
// only differ inside fact placeholders, <meta name="facts">, generated changelog regions,
// data/facts/*.json, appended "facts" entries in data/changelog.json and the generated history index.
//
//   node scripts/only-facts-changed.mjs <base>
// Exit 0: only facts changed. Exit 1: something else changed (needs review).
import {
  CHANGELOG, FACTS_DIR, HISTORY_INDEX, PAGES, git, read, exists, loadChangelog,
  validateFacts, stripGenerated,
} from "./lib/portfolio.mjs";

const base = process.argv[2];
if (!base) { console.error("사용법: node scripts/only-facts-changed.mjs <base>"); process.exit(2); }

const lf = s => s.replace(/\r\n/g, "\n");
const show = p => { try { return git(["show", `${base}:${p}`], { stdio: ["ignore", "pipe", "ignore"] }); } catch { return null; } };
const lines = s => s.split("\n").map(l => l.trim()).filter(Boolean);
const changed = new Set([
  ...lines(git(["-c", "core.quotepath=false", "diff", "--name-only", base, "--"])),
  ...lines(git(["-c", "core.quotepath=false", "ls-files", "--others", "--exclude-standard"])),
]);

const problems = [];
for (const p of changed) {
  const now = exists(p) ? read(p) : null;
  const old = show(p);
  if (now === null) { problems.push(`${p}: 삭제됨`); continue; }

  if (p.startsWith(`${FACTS_DIR}/`) && p.endsWith(".json")) {
    const name = p.slice(FACTS_DIR.length + 1, -5);
    try {
      const errs = validateFacts(JSON.parse(now), name);
      if (errs.length) problems.push(`${p}: ${errs.join(", ")}`);
    } catch (e) { problems.push(`${p}: JSON 아님 (${e.message})`); }
    continue;
  }

  if (p === CHANGELOG) {
    try {
      const before = loadChangelog(old ?? "[]");
      const after = loadChangelog(now);
      const kept = before.every((e, i) => JSON.stringify(e) === JSON.stringify(after[i]));
      const added = after.slice(before.length);
      if (!kept) problems.push(`${p}: 기존 항목이 바뀜`);
      else if (added.some(e => e.kind !== "facts" || e.scope !== "tving")) problems.push(`${p}: facts (scope tving) 가 아닌 항목 추가`);
    } catch (e) { problems.push(`${p}: ${e.message}`); }
    continue;
  }

  // Generated from data/changelog.json; check.mjs confirms it matches.
  if (p === HISTORY_INDEX) continue;

  if (PAGES.includes(p) && old !== null) {
    if (lf(stripGenerated(old)) !== lf(stripGenerated(now))) problems.push(`${p}: 표시 자리 밖이 바뀜`);
    continue;
  }

  problems.push(`${p}: 숫자 갱신에서 바뀌면 안 되는 파일`);
}

if (problems.length) {
  for (const m of problems) console.error(`사람 확인 필요 ${m}`);
  process.exit(1);
}
console.log(`숫자만 바뀜 (${changed.size}개 파일, 기준 ${base})`);
