import packager from '@electron/packager';
import { mkdtemp, cp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';

if (process.platform !== 'win32') {
  throw new Error('请在 Windows 上运行本地打包');
}

const require = createRequire(import.meta.url);
const stage = await mkdtemp(path.join(tmpdir(), 'wakeup-package-win-'));

try {
  await cp('dist', path.join(stage, 'dist'), { recursive: true });
  await writeFile(
    path.join(stage, 'package.json'),
    JSON.stringify({
      name: 'wakeup-demo',
      version: '0.1.0',
      main: 'dist/main.cjs',
    }),
  );
  const paths = await packager({
    name: 'Wakeup Demo',
    dir: stage,
    out: path.resolve('out'),
    platform: 'win32',
    arch: process.arch,
    electronVersion: require('electron/package.json').version,
    overwrite: true,
    asar: true,
  });
  console.log(paths.join('\n'));
} finally {
  await rm(stage, { recursive: true, force: true });
}
