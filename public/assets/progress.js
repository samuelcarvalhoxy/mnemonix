import { emptyProgress, MAJOR } from './training.js';

const GUEST_KEY = 'mnemonix_local_v2';
const LEGACY_KEYS = ['mnemonix_data_v6', 'mnemonix_data_v5', 'mnemonix_data_v4', 'mnemonix_data_v3'];
export function fromLegacy(value, metrics) {
  const pairs = {};
  const reviews = {};
  for (const item of Array.isArray(value) ? value : []) {
    if (!item || !Object.hasOwn(MAJOR, item.numberValue)) continue;
    const key = item.numberValue;
    const savedWord = item.customWord || (item.isCustomized ? item.activeWord : '');
    const word = typeof savedWord === 'string' ? savedWord.slice(0, 100) : '';
    const hint = typeof item.imageHint === 'string' ? item.imageHint.slice(0, 500) : '';
    if (word || hint) pairs[key] = {word, hint};
    const at = new Date(item.lastReviewedAt || 0).getTime();
    if (at > 0) reviews['major:' + key] = {at, due: at, box: Math.min(5, Number(item.masteryLevel) || 0), count: Number(item.reviewCount) || 0};
  }
  const result = {reviews, library: {major: pairs}};
  if (metrics && typeof metrics === 'object') result.legacy = metrics;
  return result;
}
function readStorage(key) {
  try { return JSON.parse(localStorage.getItem(key)); } catch { return null; }
}
function writeStorage(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); return true; } catch { return false; }
}

export async function request(path, body) {
  const response = await fetch('/api/' + path, {
    credentials: 'same-origin',
    ...(body && {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(body)})
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw Object.assign(new Error(payload.error || 'Não foi possível concluir. Tente novamente.'), {status: response.status, code: payload.code});
  return payload;
}

export function loadGuest() {
  const existing = readStorage(GUEST_KEY);
  if (existing?.events && existing?.library && existing?.reviews) return {...emptyProgress(), ...existing};
  const items = LEGACY_KEYS.map(readStorage).find(Array.isArray);
  return {...emptyProgress(), ...fromLegacy(items, readStorage('mnemonix_metrics_v1'))};
}
export const syncKey = user => 'mnemonix_pending_' + user.id;
export const accountCopyKey = user => 'mnemonix_account_' + user.id;
export const getPending = user => readStorage(syncKey(user)) || [];
export const putPending = (user, value) => writeStorage(syncKey(user), value);
export const getAccountCopy = user => readStorage(accountCopyKey(user));
export const putAccountCopy = (user, value) => writeStorage(accountCopyKey(user), value);
export const saveGuest = data => writeStorage(GUEST_KEY, data);

export function applyChange(data, change) {
  if (change.event && !data.events.some(event => event.id === change.event.id)) data.events.push(change.event);
  if (change.reviews) {
    for (const [id, review] of Object.entries(change.reviews)) {
      if (!data.reviews[id] || data.reviews[id].at <= review.at) data.reviews[id] = review;
    }
  }
  if (change.library) {
    for (const key of ['major', 'dominic']) {
      if (change.library[key]) data.library[key] = {...data.library[key], ...change.library[key]};
    }
    for (const key of ['places', 'study']) {
      if (change.library[key]) data.library[key] = change.library[key];
    }
  }
  if (change.preferences) data.preferences = {...data.preferences, ...change.preferences};
  if (change.legacy && !data.legacy) data.legacy = change.legacy;
  return data;
}
