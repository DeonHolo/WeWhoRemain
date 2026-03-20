/**
 * One-off helper: create initial commit via git fast-import (avoids index issues).
 * Run from repo root: node scripts/fast-import-initial.mjs
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const repoRoot = path.resolve(import.meta.dirname, "..");

const IGNORE_DIRS = new Set([
  ".git",
  "node_modules",
  "dist",
  "build",
  "coverage",
  ".cursor",
]);

function walk(relDir = "") {
  const abs = path.join(repoRoot, relDir);
  const entries = fs.readdirSync(abs, { withFileTypes: true });
  const files = [];
  for (const e of entries) {
    const name = e.name;
    const rel = relDir ? `${relDir}/${name}` : name;
    if (e.isDirectory()) {
      if (IGNORE_DIRS.has(name)) continue;
      files.push(...walk(rel));
    } else {
      files.push(rel.split(path.sep).join("/"));
    }
  }
  return files;
}

const files = walk().sort((a, b) => a.localeCompare(b));
const authorName = "DeonHolo";
const authorEmail = "holodeon@gmail.com";
const now = Math.floor(Date.now() / 1000);
const tz = "+0000";

const subject =
  'feat: Initialize project with "We Who Remain" LitRPG app';
const body =
  'Sets up the project structure, dependencies, and basic configuration for the "We Who Remain" text-based apocalyptic LitRPG. Includes initial HTML, CSS, TypeScript, Vite configuration, and example environment variables.';
const commitMsg = `${subject}\n\n${body}\n`;

const parts = [];
parts.push("feature done\n");

let mark = 1;
const marksByPath = new Map();

for (const rel of files) {
  const buf = fs.readFileSync(path.join(repoRoot, rel));
  parts.push(`blob\nmark :${mark}\ndata ${buf.length}\n`);
  parts.push(buf);
  marksByPath.set(rel, mark);
  mark++;
}

parts.push(`commit refs/heads/main\n`);
const msgBuf = Buffer.from(commitMsg, "utf8");
parts.push(
  `author ${authorName} <${authorEmail}> ${now} ${tz}\n` +
    `committer ${authorName} <${authorEmail}> ${now} ${tz}\n` +
    `data ${msgBuf.length}\n`,
);
parts.push(msgBuf);
parts.push(`from 0000000000000000000000000000000000000000\n`);

for (const rel of files) {
  const m = marksByPath.get(rel);
  parts.push(`M 100644 :${m} ${rel}\n`);
}

const input = Buffer.concat(parts.map((p) => (Buffer.isBuffer(p) ? p : Buffer.from(p, "utf8"))));

const res = spawnSync("git", ["fast-import", "--quiet"], {
  cwd: repoRoot,
  input,
  encoding: "buffer",
  maxBuffer: 50 * 1024 * 1024,
});

if (res.status !== 0) {
  const err = res.stderr?.toString("utf8") || "";
  const out = res.stdout?.toString("utf8") || "";
  console.error(err || out || `git fast-import exited ${res.status}`);
  process.exit(res.status ?? 1);
}

fs.writeFileSync(path.join(repoRoot, ".git", "HEAD"), "ref: refs/heads/main\n");
console.log("Initial commit created on refs/heads/main; HEAD set to main.");
