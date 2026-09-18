import { SCHEME } from '@wakeup/deep-link';

export default {
  // deb 包名，同时决定 /opt 下的安装目录
  packageName: 'wakeup-demo',
  version: '0.1.0',
  architecture: 'amd64',

  // Electron 用它定位 .desktop 文件（CHROME_DESKTOP），必须与安装到
  // /usr/share/applications/ 的文件名一致，否则协议注册会静默失败。
  desktopName: 'wakeup-demo.desktop',

  appName: 'Wakeup Demo',
  appNameZh: '唤起示例',
  description: '浏览器唤起 Electron 应用的最小示例',
  maintainer: 'kelokeloo <kelokeloo@163.com>',

  scheme: SCHEME,
};
