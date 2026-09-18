import packager from '@electron/packager';
import { mkdtemp, cp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';
import config from '../packaging/macos/config.js';

if (process.platform !== 'darwin') {
  throw new Error('请在 macOS 上运行本地打包');
}

const require = createRequire(import.meta.url);
const stage = await mkdtemp(path.join(tmpdir(), 'wakeup-package-'));

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
    ...config,
    dir: stage,
    out: path.resolve('out'),
    platform: 'darwin',
    arch: process.arch,
    electronVersion: require('electron/package.json').version,
    overwrite: true,
    asar: true,
  });
  console.log(paths.join('\n'));
} finally {
  await rm(stage, { recursive: true, force: true });
}
