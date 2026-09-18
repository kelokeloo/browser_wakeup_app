import { test } from 'node:test';
import assert from 'node:assert/strict';
import { HOME_URL, DETAIL_URL, parseDeepLink } from '../src/index.js';

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
