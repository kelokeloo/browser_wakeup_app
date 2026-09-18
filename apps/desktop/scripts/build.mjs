import { build } from 'esbuild';
import { rm, mkdir, copyFile } from 'node:fs/promises';

await rm('dist', { recursive: true, force: true });
await mkdir('dist', { recursive: true });

await build({
  entryPoints: ['src/main.js'],
  outdir: 'dist',
  outExtension: { '.js': '.cjs' },
  bundle: true,
  platform: 'node',
  format: 'cjs',
  external: ['electron'],
});

await copyFile('src/home.html', 'dist/home.html');
await copyFile('src/detail.html', 'dist/detail.html');
