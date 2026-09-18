export const SCHEME = 'wakeup-demo';

export const HOME_URL = `${SCHEME}://app/home`;
export const DETAIL_URL = `${SCHEME}://app/detail`;

// Demo 只接受这两个固定链接，不处理查询参数。
export function parseDeepLink(url) {
  if (url === HOME_URL) {
    return 'home';
  }

  if (url === DETAIL_URL) {
    return 'detail';
  }

  return null;
}

// Electron 可能调整参数顺序或追加参数，不能假定链接在最后一项。
export function parseDeepLinkArgs(argv) {
  for (const arg of argv) {
    const page = parseDeepLink(arg);

    if (page) {
      return page;
    }
  }

  return null;
}
