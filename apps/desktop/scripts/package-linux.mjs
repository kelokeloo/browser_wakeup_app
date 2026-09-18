import packager from '@electron/packager';
import {
  mkdtemp,
  cp,
  writeFile,
  mkdir,
  chmod,
  symlink,
  rm,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import config from '../packaging/linux/config.js';

if (process.platform !== 'linux') {
  throw new Error('请在 Linux 上运行本地打包');
}

const run = promisify(execFile);
const require = createRequire(import.meta.url);
const { packageName, version, desktopName, scheme } = config;
const installDir = `/opt/${packageName}`;

// @electron/packager 的 arch 名称与 deb 的架构名称不同。
const DEB_ARCH = { x64: 'amd64', arm64: 'arm64', ia32: 'i386' }[process.arch];

if (!DEB_ARCH) {
  throw new Error(`未适配的架构：${process.arch}`);
}

// 1. 暂存一份最小 package.json，让 Electron 取到 desktopName。
const stage = await mkdtemp(path.join(tmpdir(), 'wakeup-package-linux-'));

try {
  await cp('dist', path.join(stage, 'dist'), { recursive: true });
  await writeFile(
    path.join(stage, 'package.json'),
    JSON.stringify({
      name: packageName,
      version,
      main: 'dist/main.cjs',
      // 决定 CHROME_DESKTOP，必须与安装的 .desktop 文件名一致。
      desktopName,
    }),
  );

  const [appDir] = await packager({
    name: config.appName,
    executableName: packageName,
    dir: stage,
    out: path.resolve('out'),
    platform: 'linux',
    arch: process.arch,
    electronVersion: require('electron/package.json').version,
    overwrite: true,
    asar: true,
  });

  // 2. 组装 deb 目录树。
  const debRoot = path.join(stage, 'deb');
  const destAppDir = path.join(debRoot, installDir.slice(1));

  await mkdir(path.join(debRoot, 'DEBIAN'), { recursive: true });
  await mkdir(path.dirname(destAppDir), { recursive: true });
  await cp(appDir, destAppDir, { recursive: true });

  // 打包产物可能带着仅属主可读的权限，安装到 /opt 后普通用户将无法启动，
  // 这里统一放开读取与目录遍历权限。
  await run('chmod', ['-R', 'a+rX', destAppDir]);

  await writeFile(
    path.join(debRoot, 'DEBIAN', 'control'),
    [
      `Package: ${packageName}`,
      `Version: ${version}`,
      `Architecture: ${DEB_ARCH}`,
      `Maintainer: ${config.maintainer}`,
      `Description: ${config.description}`,
      '',
    ].join('\n'),
  );

  // 3. 安装 .desktop。权限必须是 644，其他权限会被桌面环境忽略。
  const desktopDir = path.join(debRoot, 'usr/share/applications');
  await mkdir(desktopDir, { recursive: true });
  const desktopPath = path.join(desktopDir, desktopName);

  await writeFile(
    desktopPath,
    [
      '[Desktop Entry]',
      'Type=Application',
      `Name=${config.appName}`,
      `Name[zh_CN]=${config.appNameZh}`,
      // %u 表示接收单个 URL，系统据此把链接作为命令行参数传给应用。
      `Exec=${installDir}/${packageName} %u`,
      'Terminal=false',
      `MimeType=x-scheme-handler/${scheme};`,
      'Categories=Development;',
      '',
    ].join('\n'),
  );
  await chmod(desktopPath, 0o644);

  // 4. 提供 /usr/bin 入口。
  const binDir = path.join(debRoot, 'usr/bin');
  await mkdir(binDir, { recursive: true });
  await symlink(`${installDir}/${packageName}`, path.join(binDir, packageName));

  // 5. Electron 的 chrome-sandbox 需要 setuid root，否则应用无法启动。
  const sandbox = path.join(destAppDir, 'chrome-sandbox');
  try {
    await chmod(sandbox, 0o4755);
  } catch {
    // 部分构建没有该文件，忽略。
  }

  // 6. 打 deb。--root-owner-group 让文件属主为 root，无需 fakeroot。
  const outFile = path.resolve(
    'out',
    `${packageName}_${version}_${DEB_ARCH}.deb`,
  );
  const { stderr } = await run('dpkg-deb', [
    '--build',
    '--root-owner-group',
    debRoot,
    outFile,
  ]);

  if (stderr.trim()) {
    console.error(stderr.trim());
  }

  console.log(outFile);
  console.log(`\n安装： sudo dpkg -i ${outFile}`);
} finally {
  await rm(stage, { recursive: true, force: true });
}
