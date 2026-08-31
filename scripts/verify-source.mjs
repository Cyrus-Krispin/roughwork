import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';

const tracked = execFileSync('git', [
  'ls-files',
  '--cached',
  '--others',
  '--exclude-standard',
  '-z',
])
  .toString('utf8')
  .split('\0')
  .filter(Boolean);

assert.deepEqual(
  tracked.filter((path) => /(^|\/)\.env($|\.)/.test(path)),
  ['.env.example'],
);

const secretPatterns = [
  /sk-[A-Za-z0-9_-]{20,}/,
  /DEEPSEEK_API_KEY[ \t]*=[ \t]*[^\s#]+/,
  /APPLE_APP_SPECIFIC_PASSWORD[ \t]*=[ \t]*[^\s#]+/,
];
for (const path of tracked) {
  const file = await readFile(path).catch(() => null);
  if (!file || file.includes(0)) continue;
  const text = file.toString('utf8');
  for (const pattern of secretPatterns) {
    assert.doesNotMatch(text, pattern, `${path} resembles a committed secret`);
  }
}

console.log(
  `Checked ${tracked.length} repository files for secrets and private data.`,
);
