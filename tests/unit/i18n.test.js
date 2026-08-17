import assert from 'node:assert/strict';
import test from 'node:test';

import {
  DEFAULT_LOCALE,
  normalizeLocale,
  resolveLocale,
  SUPPORTED_LOCALES,
} from '../../src/i18n/index.js';

test('supported locales are stable and Chinese remains the default', () => {
  assert.deepEqual(SUPPORTED_LOCALES, ['zh-CN', 'en-US']);
  assert.equal(DEFAULT_LOCALE, 'zh-CN');
});

test('browser locale variants normalize to the supported locale pair', () => {
  assert.equal(normalizeLocale('zh-Hans-CN'), 'zh-CN');
  assert.equal(normalizeLocale('zh_TW'), 'zh-CN');
  assert.equal(normalizeLocale('en-GB'), 'en-US');
  assert.equal(normalizeLocale('fr-FR'), null);
});

test('locale resolution follows query, storage, browser, then default priority', () => {
  assert.equal(resolveLocale({ query: 'en', stored: 'zh-CN', languages: ['zh-CN'] }), 'en-US');
  assert.equal(resolveLocale({ stored: 'en-US', languages: ['zh-CN'] }), 'en-US');
  assert.equal(resolveLocale({ stored: 'de-DE', languages: ['fr-FR', 'zh-Hans'] }), 'zh-CN');
  assert.equal(resolveLocale({ languages: ['de-DE'] }), 'zh-CN');
});
