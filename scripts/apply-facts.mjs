#!/usr/bin/env node
// Fill fact placeholders and <meta name="facts"> from data/facts/*.json.
// When a displayed number changes, append one "facts" entry to data/changelog.json.
// Nothing is written when nothing changed.
//
//   node scripts/apply-facts.mjs [--summary-out <file>]
import { writeFileSync } from "node:fs";
import {
  PAGES, CHANGELOG, read, exists, loadFacts, loadChangelog, changelogText, writeIfChanged,
  placeholders, lookup, formatFact, labelFor, renderAll, todayKST, validateFacts,
} from "./lib/portfolio.mjs";

const args = process.argv.slice(2);
const summaryOut = args.includes("--summary-out") ? args[args.indexOf("--summary-out") + 1] : null;

const facts = loadFacts();
for (const [name, f] of Object.entries(facts)) {
  const errs = validateFacts(f, name);
  if (errs.length) {
    console.error(`data/facts/${name}.json: ${errs.join(", ")}`);
    process.exit(1);
  }
}

// Collect value changes per key (same key may appear in several places and pages).
const changes = new Map();
const missing = new Set();
for (const p of PAGES) {
  if (!exists(p)) continue;
  for (const { key, value } of placeholders(read(p))) {
    const v = lookup(facts, key);
    if (v == null) { missing.add(key); continue; }
    const next = formatFact(v);
    if (value !== next && !changes.has(key)) changes.set(key, { from: value, to: next });
  }
}
for (const key of missing) console.warn(`경고: data/facts 에 ${key} 값이 없어 표시 자리를 그대로 둡니다`);

let entries = loadChangelog();
let summary = "";
if (changes.size) {
  const parts = [...changes].map(([key, c]) => `${labelFor(key)} ${c.from || "(빈 값)"} → ${c.to}`);
  summary = `숫자 갱신: ${parts.join(", ")}`;
  entries = [...entries, { date: todayKST(), commit: "", kind: "facts", summary }];
}

const written = [];
if (changes.size && writeIfChanged(CHANGELOG, changelogText(entries))) written.push(CHANGELOG);
written.push(...renderAll(facts, entries));

if (summaryOut) writeFileSync(summaryOut, summary ? summary + "\n" : "");
if (!written.length) console.log("바뀐 것 없음");
else {
  console.log(`고친 파일: ${written.join(", ")}`);
  if (summary) console.log(`변경 기록: ${summary}`);
}
