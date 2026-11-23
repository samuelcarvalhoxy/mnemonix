import {database, ensureDatabase, hasDatabase} from './_db.js';
import {bodyOf, clean, json, sameOrigin} from './_http.js';
import {currentUser} from './_session.js';
import {applyChange, fromLegacy} from '../public/assets/progress.js';
import {emptyProgress, MODES, MAJOR} from '../public/assets/training.js';

const UUID = /^[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}$/i;
const isMap = value => value && typeof value === 'object' && !Array.isArray(value);
const int = (value, low, high) => Number.isInteger(value) && value >= low && value <= high;

export function cleanChange(body) {
  const change = {};
  const now = Date.now();
  if (isMap(body.event)) {
    const {id, mode, correct, total, level, seconds, at} = body.event;
    if (!UUID.test(id) || !Object.hasOwn(MODES, mode) || !int(total, 1, 52)
      || !int(correct, 0, total) || !int(level, 1, 5) || !int(seconds, 0, 86400) || !int(at, 1, now + 300000)) return null;
    change.event = {id, mode, correct, total, level, seconds, at};
  }
  if (isMap(body.library)) {
    const {major, dominic, places, study} = body.library;
    const out = {};
    if (isMap(major)) {
      out.major = Object.fromEntries(Object.entries(major).filter(([key, value]) => Object.hasOwn(MAJOR, key) && isMap(value))
        .map(([key, value]) => [key, {word: clean(value.word, 100), hint: clean(value.hint, 500)}]));
    }
    if (isMap(dominic)) {
      out.dominic = Object.fromEntries(Object.entries(dominic).filter(([key, pair]) => /^\d{2}$/.test(key) && Array.isArray(pair) && pair.length === 2)
        .map(([key, pair]) => [key, pair.map(value => clean(value, 80))]).filter(([, pair]) => pair.every(Boolean)));
    }
    if (Array.isArray(places)) out.places = places.slice(0, 15).map(value => clean(value, 75)).filter(Boolean);
    if (Array.isArray(study)) {
      out.study = study.slice(0, 200).filter(card => isMap(card) && UUID.test(card.id))
        .map(card => ({id: card.id, front: clean(card.front, 300), back: clean(card.back, 500)}))
        .filter(card => card.front && card.back);
    }
    change.library = out;
  }
  if (isMap(body.reviews)) {
    change.reviews = Object.fromEntries(Object.entries(body.reviews).slice(0, 900)
      .filter(([key, r]) => /^(major|dominic|study):[a-z0-9-]{1,50}(:reverse)?$/i.test(key) && isMap(r)
        && int(r.box, 0, 5) && int(r.count, 0, 1e6) && int(r.at, 1, now + 300000) && int(r.due, 1, now + 400 * 86400000))
      .map(([key, {box, count, at, due}]) => [key, {box, count, at, due}]));
  }
  if (typeof body.preferences?.offers === 'boolean') change.preferences = {offers: body.preferences.offers, updatedAt: now};
  return Object.keys(change).length ? change : null;
}

async function load(sql, userId) {
  const [existing] = await sql`SELECT state,version FROM mnemonix_training WHERE user_id=${userId}`;
  if (existing) return existing;
  const [legacy] = await sql`SELECT items,metrics FROM mnemonix_profiles WHERE user_id=${userId}`;
  const state = legacy ? {...emptyProgress(), ...fromLegacy(legacy.items, legacy.metrics)} : emptyProgress();
  await sql`INSERT INTO mnemonix_training(user_id,state) VALUES (${userId},${JSON.stringify(state)}::jsonb) ON CONFLICT DO NOTHING`;
  const [created] = await sql`SELECT state,version FROM mnemonix_training WHERE user_id=${userId}`;
  return created;
}

async function update(sql, userId, body, res) {
  if (!UUID.test(body.id)) return json(res, 400, {error: 'Alteração inválida.'});
  const change = cleanChange(body);
  if (!change) return json(res, 400, {error: 'Dados de progresso inválidos.'});
  for (let i = 0; i < 5; i++) {
    const [previous] = await sql`SELECT 1 FROM mnemonix_training_writes WHERE user_id=${userId} AND operation_id=${body.id}`;
    const data = await load(sql, userId);
    if (previous) return json(res, 200, {state: data.state});
    const state = applyChange(data.state, change);
    const [saved] = await sql`WITH updated AS (
      UPDATE mnemonix_training SET state=${JSON.stringify(state)}::jsonb,version=version+1
      WHERE user_id=${userId} AND version=${data.version} AND NOT EXISTS
        (SELECT 1 FROM mnemonix_training_writes WHERE user_id=${userId} AND operation_id=${body.id})
      RETURNING user_id,state
    ), operations AS (
      INSERT INTO mnemonix_training_writes(user_id,operation_id) SELECT user_id,${body.id} FROM updated
    ) SELECT state FROM updated`;
    if (saved) return json(res, 200, {state: saved.state});
  }
  return json(res, 409, {error: 'O progresso mudou em outro dispositivo. Tente sincronizar novamente.'});
}
export default async function handler(req, res) {
  try {
    if (!hasDatabase()) return json(res, 503, {error: 'A sincronização está indisponível.'});
    if (req.method !== 'GET' && req.method !== 'POST') return json(res, 405, {error: 'Método não permitido.'});
    if (req.method === 'POST' && !sameOrigin(req)) return json(res, 403, {error: 'Origem inválida.'});
    await ensureDatabase();
    const user = await currentUser(req);
    if (!user) return json(res, 401, {error: 'Sua sessão expirou. Entre novamente.'});
    if (!user.terms) return json(res, 403, {error: 'Aceite os termos para continuar.'});
    const sql = database();
    if (req.method === 'GET') {
      const {state} = await load(sql, user.id);
      return json(res, 200, {state});
    }
    const body = bodyOf(req);
    if (body.action === 'privacy') {
      const kind = body.kind;
      const details = clean(body.details, 1000);
      if (!['access', 'correction', 'deletion', 'other'].includes(kind) || !details) return json(res, 400, {error: 'Confira os dados da solicitação.'});
      const [record] = await sql`INSERT INTO mnemonix_privacy_requests(user_id,kind,details)
        SELECT ${user.id},${kind},${details} WHERE NOT EXISTS (
          SELECT 1 FROM mnemonix_privacy_requests WHERE user_id=${user.id} AND requested_at>now()-interval '5 minutes')
        RETURNING id`;
      return record ? json(res, 201, {message: 'Solicitação registrada.', id: record.id})
        : json(res, 429, {error: 'Uma solicitação foi registrada recentemente. Aguarde antes de enviar outra.'});
    }
    return await update(sql, user.id, body, res);
  } catch (error) {
    console.error('mnemonix.data', error.code || error.name);
    return json(res, 503, {error: 'A sincronização está indisponível. Tente novamente.'});
  }
}
