import assert from 'node:assert/strict';
import test from 'node:test';

import {
  DEFAULT_LOCALE,
  normalizeLocale,
  resolveLocale,
  SUPPORTED_LOCALES,
} from '../../src/i18n/index.js';

test('supported locales include international languages and English is the default', () => {
  assert.deepEqual(SUPPORTED_LOCALES, ['en-US', 'ja-JP', 'ko-KR', 'fr-FR', 'zh-CN']);
  assert.equal(DEFAULT_LOCALE, 'en-US');
});

test('browser locale variants normalize to the supported locales', () => {
  assert.equal(normalizeLocale('zh-Hans-CN'), 'zh-CN');
  assert.equal(normalizeLocale('zh_TW'), 'zh-CN');
  assert.equal(normalizeLocale('en-GB'), 'en-US');
  assert.equal(normalizeLocale('ja_JP'), 'ja-JP');
  assert.equal(normalizeLocale('ko-KR'), 'ko-KR');
  assert.equal(normalizeLocale('fr-CA'), 'fr-FR');
  assert.equal(normalizeLocale('de-DE'), null);
});

test('locale resolution follows query, storage, browser, then default priority', () => {
  assert.equal(resolveLocale({ query: 'en', stored: 'zh-CN', languages: ['zh-CN'] }), 'en-US');
  assert.equal(resolveLocale({ query: 'ja', stored: 'en-US', languages: ['en-US'] }), 'ja-JP');
  assert.equal(resolveLocale({ stored: 'ko-KR', languages: ['en-US'] }), 'ko-KR');
  assert.equal(resolveLocale({ stored: 'de-DE', languages: ['fr-FR', 'zh-Hans'] }), 'fr-FR');
  assert.equal(resolveLocale({ languages: ['de-DE'] }), 'en-US');
});
