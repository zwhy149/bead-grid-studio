import enUS from './en-US.js';
import zhCN from './zh-CN.js';

export const DEFAULT_LOCALE = 'zh-CN';
export const SUPPORTED_LOCALES = Object.freeze(['zh-CN', 'en-US']);
export const LOCALE_STORAGE_KEY = 'bead-grid-studio:locale';

const dictionaries = Object.freeze({ 'zh-CN': zhCN, 'en-US': enUS });
const listeners = new Set();

export function normalizeLocale(value) {
  const text = String(value || '').trim().replace('_', '-').toLowerCase();
  if (text === 'zh' || text.startsWith('zh-')) return 'zh-CN';
  if (text === 'en' || text.startsWith('en-')) return 'en-US';
  return null;
}

function queryLocale() {
  try {
    return normalizeLocale(new URL(location.href).searchParams.get('lang'));
  } catch (_) {
    return null;
  }
}

function storedLocale() {
  try {
    return normalizeLocale(localStorage.getItem(LOCALE_STORAGE_KEY));
  } catch (_) {
    return null;
  }
}

function browserLocale() {
  if (typeof navigator === 'undefined') return DEFAULT_LOCALE;
  const candidates = Array.isArray(navigator.languages) && navigator.languages.length
    ? navigator.languages
    : [navigator.language];
  for (const candidate of candidates) {
    const normalized = normalizeLocale(candidate);
    if (normalized) return normalized;
  }
  return DEFAULT_LOCALE;
}

let activeLocale = queryLocale() || storedLocale() || browserLocale();

export function getLocale() {
  return activeLocale;
}

export function isEnglish() {
  return activeLocale === 'en-US';
}

export function t(key, params = {}) {
  const dictionary = dictionaries[activeLocale] || dictionaries[DEFAULT_LOCALE];
  const fallback = dictionaries[DEFAULT_LOCALE][key];
  const value = dictionary[key] ?? fallback ?? key;
  if (typeof value === 'function') return value(params);
  return String(value).replace(/\{(\w+)\}/g, (_, name) => String(params[name] ?? `{${name}}`));
}

export function formatNumber(value, options) {
  return new Intl.NumberFormat(activeLocale, options).format(Number(value) || 0);
}

export function localizedAppUrl(locale = activeLocale) {
  const url = new URL('https://zwhy149.github.io/bead-grid-studio/');
  url.searchParams.set('lang', normalizeLocale(locale) || DEFAULT_LOCALE);
  return url.toString();
}

function setMeta(selector, value) {
  const node = document.querySelector(selector);
  if (node) node.setAttribute('content', value);
}

function translationParams(node) {
  const params = {};
  for (const [key, value] of Object.entries(node.dataset || {})) {
    if (!key.startsWith('i18n') || ['i18n', 'i18nAria', 'i18nTitle', 'i18nPlaceholder', 'i18nAlt'].includes(key)) continue;
    const name = key.slice(4);
    if (name) params[name[0].toLowerCase() + name.slice(1)] = value;
  }
  return params;
}

function syncLocalizedLegalLinks(root) {
  const english = activeLocale === 'en-US';
  root.querySelectorAll('a[href$="privacy.html"],a[href$="privacy.en.html"]').forEach((link) => {
    link.setAttribute('href', english ? './privacy.en.html' : './privacy.html');
  });
  root.querySelectorAll('a[href$="terms.html"],a[href$="terms.en.html"]').forEach((link) => {
    link.setAttribute('href', english ? './terms.en.html' : './terms.html');
  });
}

export function applyDocumentTranslations(root = document) {
  document.documentElement.lang = activeLocale;
  document.documentElement.dataset.locale = activeLocale;
  document.title = t('meta.title');
  setMeta('meta[name="description"]', t('meta.description'));
  setMeta('meta[property="og:title"]', t('meta.ogTitle'));
  setMeta('meta[property="og:description"]', t('meta.ogDescription'));
  setMeta('meta[property="og:locale"]', t('meta.ogLocale'));
  setMeta('meta[name="twitter:title"]', t('meta.ogTitle'));
  setMeta('meta[name="twitter:description"]', t('meta.ogDescription'));

  root.querySelectorAll('[data-i18n]').forEach((node) => {
    node.textContent = t(node.dataset.i18n, translationParams(node));
  });
  for (const [dataKey, attribute] of [
    ['i18nAria', 'aria-label'],
    ['i18nTitle', 'title'],
    ['i18nPlaceholder', 'placeholder'],
    ['i18nAlt', 'alt'],
  ]) {
    root.querySelectorAll(`[data-${dataKey.replace(/[A-Z]/g, (match) => `-${match.toLowerCase()}`)}]`).forEach((node) => {
      node.setAttribute(attribute, t(node.dataset[dataKey], translationParams(node)));
    });
  }
  root.querySelectorAll('[data-locale]').forEach((button) => {
    const selected = button.dataset.locale === activeLocale;
    button.setAttribute('aria-pressed', String(selected));
    button.tabIndex = selected ? 0 : -1;
  });
  syncLocalizedLegalLinks(root);

  const schema = document.getElementById('softwareJsonLd');
  if (schema) {
    schema.textContent = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      name: t('meta.schemaName'),
      description: t('meta.schemaDescription'),
      applicationCategory: 'DesignApplication',
      operatingSystem: 'Any modern web browser',
      url: localizedAppUrl(activeLocale),
      isAccessibleForFree: true,
      license: 'https://www.apache.org/licenses/LICENSE-2.0',
      inLanguage: activeLocale,
    });
  }
}

export function setLocale(locale, { persist = true, updateUrl = true } = {}) {
  const normalized = normalizeLocale(locale);
  if (!normalized || normalized === activeLocale) return false;
  activeLocale = normalized;
  if (persist) {
    try { localStorage.setItem(LOCALE_STORAGE_KEY, activeLocale); } catch (_) { /* Storage may be disabled. */ }
  }
  if (updateUrl && location.protocol !== 'file:') {
    try {
      const url = new URL(location.href);
      url.searchParams.set('lang', activeLocale);
      history.replaceState(history.state, '', url);
    } catch (_) { /* Keep the current URL when history is unavailable. */ }
  }
  applyDocumentTranslations();
  listeners.forEach((listener) => listener(activeLocale));
  return true;
}

export function onLocaleChange(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function initializeI18n() {
  applyDocumentTranslations();
  return activeLocale;
}

export function resolveLocale({ query, stored, languages = [] } = {}) {
  const queryMatch = normalizeLocale(query);
  if (queryMatch) return queryMatch;
  const storedMatch = normalizeLocale(stored);
  if (storedMatch) return storedMatch;
  for (const language of languages) {
    const match = normalizeLocale(language);
    if (match) return match;
  }
  return DEFAULT_LOCALE;
}

export const __test = Object.freeze({ normalizeLocale, resolveLocale, translationParams });
