import path from 'node:path';
import { app, BrowserWindow } from 'electron';
import { SCHEME, parseDeepLink, parseDeepLinkArgs } from '@wakeup/deep-link';

// Windows 与 Linux 首次通过协议启动时，链接在当前进程的命令行参数中。
// macOS 由系统通过 open-url 交付，不从这里读取。
const readsStartupArgs =
  process.platform === 'win32' || process.platform === 'linux';

let pendingPage = readsStartupArgs ? parseDeepLinkArgs(process.argv) : null;

// macOS 的启动链接可能先于 ready 到达，因此提前监听。
app.on('open-url', (event, url) => {
  event.preventDefault();
  const page = parseDeepLink(url);

  if (!page) {
    return;
  }

  if (app.isReady()) {
    openWindow(page);
  } else {
    pendingPage = page;
  }
});

if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  // Windows 与 Linux 再次唤起时，系统会另起一个进程，链接由它转交给
  // 持有单实例锁的进程。
  app.on('second-instance', (_event, argv) => {
    const page = parseDeepLinkArgs(argv);

    if (page) {
      openWindow(page);
    }
  });

  app.whenReady().then(() => {
    // Linux 不调用 setAsDefaultProtocolClient：协议关联由安装包里的 .desktop
    // 文件建立（见 packaging/linux），系统据此解析默认处理程序，无需应用注册。
    // 而 Electron 在 Linux 上把它实现为 `xdg-settings set
    // default-url-scheme-handler`；麒麟的 XDG 将桌面识别为 gnome3，该分支会把
    // 默认 MIME 落成 text/html，让本应用顶替浏览器成为 .html 的默认程序。
    if (app.isPackaged && process.platform !== 'linux') {
      app.setAsDefaultProtocolClient(SCHEME);
    }

    // 链接启动时打开目标窗口；手动启动时默认打开首页。
    openWindow(pendingPage || 'home');
    pendingPage = null;

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        openWindow('home');
      }
    });
  });
}

function openWindow(page) {
  const window = new BrowserWindow({
    width: 640,
    height: 480,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  window.loadFile(path.join(__dirname, `${page}.html`));
}
