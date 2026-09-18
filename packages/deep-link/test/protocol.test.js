import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  HOME_URL,
  DETAIL_URL,
  parseDeepLink,
  parseDeepLinkArgs,
} from '../src/index.js';

test('两个固定链接解析为对应页面', () => {
  assert.equal(parseDeepLink(HOME_URL), 'home');
  assert.equal(parseDeepLink(DETAIL_URL), 'detail');
});

test('非法链接不会生成页面指令', () => {
  const invalidUrls = [
    'not a url',
    'https://app/home',
    'wakeup-demo://other/home',
    'wakeup-demo://user@app/home',
    'wakeup-demo://app:80/home',
    'wakeup-demo://app/home#fragment',
    'wakeup-demo://app/unknown',
    'wakeup-demo://app/home?extra=1',
    'wakeup-demo://app/detail?id=1001',
    'wakeup-demo://app/detail?id=',
    'wakeup-demo://app/detail?id=1&id=2',
    'wakeup-demo://app/detail?id=1&extra=2',
    'wakeup-demo://app/detail?id=%3Cscript%3E',
  ];

  for (const url of invalidUrls) {
    assert.equal(parseDeepLink(url), null, url);
  }
});

test('Windows 启动参数中的链接不受位置和额外参数影响', () => {
  const executable = String.raw`C:\Program Files\Wakeup Demo\Wakeup Demo.exe`;

  assert.equal(parseDeepLinkArgs([executable, DETAIL_URL]), 'detail');
  assert.equal(
    parseDeepLinkArgs([
      executable,
      '--allow-file-access-from-files',
      HOME_URL,
      '--original-process-start-time=12345',
    ]),
    'home',
  );
});

// Linux 与 Windows 的接收方式相同：系统执行 .desktop 的 Exec 行，
// 把 URL 作为命令行参数传入。
test('Linux 启动参数中的链接同样按 argv 识别', () => {
  const executable = '/opt/wakeup-demo/wakeup-demo';

  assert.equal(parseDeepLinkArgs([executable, HOME_URL]), 'home');
  assert.equal(
    parseDeepLinkArgs([
      executable,
      '--no-sandbox',
      DETAIL_URL,
      '--original-process-start-time=12345',
    ]),
    'detail',
  );
});

test('普通启动和非法链接参数不会生成页面指令', () => {
  assert.equal(parseDeepLinkArgs([]), null);
  assert.equal(parseDeepLinkArgs(['Wakeup Demo.exe', '--some-flag']), null);
  assert.equal(
    parseDeepLinkArgs([
      'Wakeup Demo.exe',
      'https://app/home',
      'wakeup-demo://app/detail?id=1001',
      'wakeup-demo://app/unknown',
      '--url=wakeup-demo://app/home',
    ]),
    null,
  );
});
