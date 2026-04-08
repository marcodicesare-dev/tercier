import { cpSync, existsSync, mkdirSync, rmSync } from 'node:fs';
import { basename, dirname, resolve } from 'node:path';

const ROOT = process.cwd();
const DEST = resolve(ROOT, '.deploy/kempinski-worker');
const ITEMS_TO_COPY = [
  'package.json',
  'pnpm-lock.yaml',
  'tsconfig.json',
  'Dockerfile.kempinski-worker',
  'railway.toml',
  'scripts',
] as const;

function copyItem(relativePath: string): void {
  const source = resolve(ROOT, relativePath);
  const destination = resolve(DEST, relativePath);

  if (!existsSync(source)) {
    throw new Error(`Missing required deploy asset: ${relativePath}`);
  }

  mkdirSync(dirname(destination), { recursive: true });
  cpSync(source, destination, {
    filter: sourcePath => {
      const name = basename(sourcePath);
      if (name === 'cache' || name === 'output' || name === 'node_modules' || name === '.DS_Store') {
        return false;
      }
      return true;
    },
    recursive: true,
  });
}

rmSync(DEST, { force: true, recursive: true });
mkdirSync(DEST, { recursive: true });

for (const item of ITEMS_TO_COPY) {
  copyItem(item);
}

process.stdout.write(`${DEST}\n`);
