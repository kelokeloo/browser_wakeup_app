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
