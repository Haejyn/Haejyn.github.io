#!/usr/bin/env node
// Download facts.json from each project's "facts-latest" release into data/facts/<project>.json.
// A project whose download or validation fails keeps its current file.
//
//   node scripts/fetch-facts.mjs [project ...]   (default: willnew wasnew)
import { FACTS_DIR, PROJECT_ORDER, validateFacts, writeIfChanged } from "./lib/portfolio.mjs";

const projects = process.argv.slice(2).length ? process.argv.slice(2) : PROJECT_ORDER;
for (const p of projects) {
  const url = `https://github.com/Haejyn/${p}/releases/download/facts-latest/facts.json`;
  try {
    const res = await fetch(url, { redirect: "follow", signal: AbortSignal.timeout(20_000) });
    if (!res.ok) throw new Error(`응답 ${res.status}`);
    const facts = JSON.parse(await res.text());
    const errs = validateFacts(facts, p);
    if (facts.commit === "manual") errs.push('릴리스 파일의 commit 이 "manual"');
    if (errs.length) throw new Error(errs.join(", "));
    const changed = writeIfChanged(`${FACTS_DIR}/${p}.json`, JSON.stringify(facts, null, 2) + "\n");
    console.log(`${p}: ${facts.commit.slice(0, 7)} ${changed ? "받음" : "그대로"}`);
  } catch (e) {
    console.log(`${p}: 받지 못해 기존 파일 유지 (${e.message})`);
    if (process.env.GITHUB_ACTIONS) console.log(`::warning::${p} facts 받기 실패, 기존 파일 유지 (${e.message})`);
  }
}
