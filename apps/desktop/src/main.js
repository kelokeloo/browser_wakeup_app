import path from 'node:path';
import { app, BrowserWindow } from 'electron';
import { SCHEME, parseDeepLink } from '@wakeup/deep-link';

let pendingPage = null;

// 系统已有协议关联时，启动链接可能先于 ready 到达。
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
  app.whenReady().then(() => {
    if (app.isPackaged) {
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
