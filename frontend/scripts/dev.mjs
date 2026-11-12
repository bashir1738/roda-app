import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const projectRoot = path.resolve(fileURLToPath(new URL('..', import.meta.url)));
const devDirPath = path.join(projectRoot, '.next', 'dev');
const devLockPath = path.join(devDirPath, 'lock');

process.chdir(projectRoot);

function isFrontendNextProcess(pid) {
  try {
    process.kill(pid, 0);
    const processRoot = fs.realpathSync(`/proc/${pid}/cwd`);
    const command = fs.readFileSync(`/proc/${pid}/cmdline`, 'utf8');
    return processRoot === projectRoot && command.includes('next');
  } catch (error) {
    if (error?.code === 'ESRCH') return false;
    if (error?.code === 'ENOENT' || error?.code === 'EACCES' || error?.code === 'EPERM') return false;
    throw error;
  }
}

if (fs.existsSync(devLockPath)) {
  const lockContents = fs.readFileSync(devLockPath, 'utf8');
  let lock;
  try {
    lock = JSON.parse(lockContents);
  } catch {
    throw new Error(`Next development lock is invalid: ${devLockPath}. Remove it and retry.`);
  }

  if (Number.isInteger(lock.pid) && isFrontendNextProcess(lock.pid)) {
    console.error(
      `Another Next dev server is already running (PID ${lock.pid}, port ${lock.port ?? 'unknown'}).`,
    );
    console.error(`Stop it with: kill ${lock.pid}`);
    process.exit(1);
  }

  fs.rmSync(devDirPath, { recursive: true, force: true });
  console.log(`Removed stale Next development state for PID ${lock.pid ?? 'unknown'}.`);
}

// Linux hosts with low fs.inotify.max_user_instances (e.g. 128) hit EMFILE in
// Next.js's internal Watchpack instances because Watchpack reads
// WATCHPACK_POLLING at import time before next.config.ts or .env* load.
if (!process.env.WATCHPACK_POLLING) {
  process.env.WATCHPACK_POLLING = '1000';
}

const require = createRequire(import.meta.url);
const nextPkgPath = require.resolve('next/package.json');
const nextPkg = JSON.parse(fs.readFileSync(nextPkgPath, 'utf8'));
const binRel = typeof nextPkg.bin === 'string' ? nextPkg.bin : nextPkg.bin?.next;
if (!binRel) {
  throw new Error('Could not locate Next.js CLI binary in node_modules/next/package.json');
}

const extraArgs = process.argv.slice(2);
const usesExplicitBundler = extraArgs.some(
  (arg) => arg === '--webpack' || arg === '--turbopack' || arg === '--turbo',
);
const bundlerArgs = usesExplicitBundler ? [] : ['--webpack'];

const nextBin = path.resolve(path.dirname(nextPkgPath), binRel);
process.argv = [process.argv[0], nextBin, 'dev', ...bundlerArgs, ...extraArgs];
await import(pathToFileURL(nextBin).href);
