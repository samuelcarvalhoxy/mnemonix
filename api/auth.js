import bcrypt from 'bcryptjs';
import {randomBytes} from 'node:crypto';
import {database, ensureDatabase, hasDatabase} from './_db.js';
import {bodyOf, clean, json, sameOrigin} from './_http.js';
import {clearSession, createSession, currentUser, hash, publicUser, token, validToken} from './_session.js';
import {mailConfigured, sendAccountMail} from './_mail.js';
import {TERMS_VERSION} from '../public/assets/legal.js';
import {emptyProgress} from '../public/assets/training.js';

const GENERIC = 'Se o endereço puder receber a mensagem, enviamos um link para continuar.';
const EMAIL = /^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+@(?:[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?\.)+[A-Za-z]{2,}$/;
const DUMMY_HASH = '$2b$12$1KTPRkz1W1u0lEtCqQ4UG.nh/k7BN.iz2sAkG1QM/nTxxr2S1npZS';
const newPassword = value => typeof value === 'string' && value.length >= 8 && Buffer.byteLength(value) <= 72;
const fail = (res, status, error, code) => json(res, status, {error, code});
const verifiedEmail = value => typeof value === 'string' && value.trim().length <= 254 && EMAIL.test(value.trim());

async function permit(req, sql, key, kind) {
  const ip = String(req.headers['x-vercel-forwarded-for'] || req.socket?.remoteAddress || 'unknown').split(',')[0].trim();
  const ipLimit = kind === 'login' ? 45 : 18;
  const accountLimit = kind === 'login' ? 15 : 5;
  const rows = await sql`INSERT INTO mnemonix_email_limits(rate_key,bucket,count) VALUES
    (${hash(kind + ':ip:' + ip)}, date_trunc('hour', now()), 1),
    (${hash(kind + ':account:' + key)}, date_trunc('hour', now()), 1)
    ON CONFLICT (rate_key) DO UPDATE SET
      count=CASE WHEN mnemonix_email_limits.bucket=excluded.bucket THEN mnemonix_email_limits.count+1 ELSE 1 END,
      bucket=excluded.bucket
    RETURNING count`;
  return rows[0].count <= ipLimit && rows[1].count <= accountLimit;
}

async function signup(req, res, sql, body) {
  if (!mailConfigured()) return fail(res, 503, 'Novos cadastros estarão disponíveis quando o envio de e-mail for ativado.');
  const name = clean(body.name, 81);
  if (name.length < 2 || name.length > 80 || !verifiedEmail(body.email) || !newPassword(body.password) || body.terms !== true || body.termsVersion !== TERMS_VERSION) {
    return fail(res, 400, 'Confira nome, e-mail, senha de 8 caracteres ou mais e aceite os termos.');
  }
  const email = body.email.trim().toLowerCase();
  if (!await permit(req, sql, email, 'signup')) return fail(res, 429, 'Muitas solicitações. Tente novamente mais tarde.');
  const [existing] = await sql`SELECT password_hash FROM mnemonix_pending_accounts WHERE email=${email} AND expires_at>now()`;
  if (existing && !await bcrypt.compare(body.password, existing.password_hash)) return json(res, 202, {message: GENERIC});
  const passwordHash = existing?.password_hash || await bcrypt.hash(body.password, 12);
  const code = token();
  const fingerprint = hash(code);
  const [pending] = await sql`INSERT INTO mnemonix_pending_accounts(email,display_name,password_hash,offers,terms_version,token_hash,expires_at)
    SELECT ${email},${name},${passwordHash},${body.offers === true},${TERMS_VERSION},${fingerprint},now()+interval '60 minutes'
    WHERE NOT EXISTS (SELECT 1 FROM mnemonix_users WHERE lower(email)=${email})
    ON CONFLICT (email) DO UPDATE SET display_name=excluded.display_name,password_hash=excluded.password_hash,
      offers=excluded.offers,terms_version=excluded.terms_version,token_hash=excluded.token_hash,expires_at=excluded.expires_at
    WHERE mnemonix_pending_accounts.expires_at <= now() OR
      (mnemonix_pending_accounts.password_hash=excluded.password_hash AND mnemonix_pending_accounts.expires_at <= now()+interval '59 minutes')
    RETURNING email`;
  if (pending) {
    try { await sendAccountMail(email, 'verify', code); }
    catch {
      await sql`DELETE FROM mnemonix_pending_accounts WHERE token_hash=${fingerprint}`;
      return fail(res, 502, 'O e-mail não pôde ser enviado agora. Tente novamente em instantes.');
    }
  }
  return json(res, 202, {message: GENERIC});
}

async function confirm(res, sql, body) {
  if (!validToken(body.token)) return fail(res, 400, 'Link inválido ou expirado.');
  const fingerprint = hash(body.token);
  const username = 'm_' + randomBytes(11).toString('hex');
  const [user] = await sql`WITH pending AS (
    DELETE FROM mnemonix_pending_accounts WHERE token_hash=${fingerprint} AND expires_at>now() AND terms_version=${TERMS_VERSION}
    RETURNING *
  ), account AS (
    INSERT INTO mnemonix_users(display_name,username,email,password_hash,email_verified_at)
    SELECT display_name,${username},email,password_hash,now() FROM pending
    ON CONFLICT DO NOTHING RETURNING id,email
  ), accepted AS (
    INSERT INTO mnemonix_consents(user_id,version) SELECT id,${TERMS_VERSION} FROM account
  ), settings AS (
    INSERT INTO mnemonix_training(user_id,state)
    SELECT account.id, ${JSON.stringify(emptyProgress())}::jsonb ||
      jsonb_build_object('preferences',jsonb_build_object('offers',pending.offers))
    FROM account JOIN pending ON account.email=pending.email
  ) SELECT id FROM account`;
  if (!user) return fail(res, 400, 'Link inválido, expirado ou já utilizado. Tente entrar ou refazer o cadastro.');
  return json(res, 200, {message: 'E-mail confirmado. Você já pode entrar.'});
}

async function login(req, res, sql, body) {
  const identifier = clean(body.identifier, 254).toLowerCase();
  const password = typeof body.password === 'string' ? body.password : '';
  if (!identifier || !password || password.length > 256) return fail(res, 400, 'Informe suas credenciais.');
  if (!await permit(req, sql, identifier, 'login')) return fail(res, 429, 'Muitas tentativas. Tente novamente mais tarde.');
  const [user] = await sql`SELECT u.id,u.display_name,u.email,u.username,(u.email_verified_at IS NOT NULL) AS verified,u.password_hash,
    EXISTS(SELECT 1 FROM mnemonix_consents c WHERE c.user_id=u.id AND c.version=${TERMS_VERSION}) AS terms
    FROM mnemonix_users u WHERE u.active AND (lower(email)=${identifier} OR lower(username)=${identifier})
    ORDER BY (lower(email)=${identifier}) DESC LIMIT 1`;
  const match = await bcrypt.compare(password, user?.password_hash || DUMMY_HASH);
  if (!user || !match) return fail(res, 401, 'E-mail ou senha inválidos. Confirme seu e-mail se o cadastro for recente.');
  if (!await createSession(res, user.id, user.password_hash)) return fail(res, 401, 'As credenciais mudaram. Entre novamente.');
  return json(res, 200, {user: publicUser(user)});
}

async function forgot(req, res, sql, body) {
  if (!mailConfigured()) return fail(res, 503, 'A recuperação por e-mail ainda não está disponível.');
  if (!verifiedEmail(body.email)) return fail(res, 400, 'Informe um e-mail válido.');
  const email = body.email.trim().toLowerCase();
  if (!await permit(req, sql, email, 'forgot')) return fail(res, 429, 'Muitas solicitações. Tente novamente mais tarde.');
  const code = token();
  const fingerprint = hash(code);
  const [link] = await sql`INSERT INTO mnemonix_password_links(user_id,token_hash,expires_at)
    SELECT id,${fingerprint},now()+interval '30 minutes' FROM mnemonix_users WHERE lower(email)=${email} AND active
    ON CONFLICT (user_id) DO UPDATE SET token_hash=excluded.token_hash,expires_at=excluded.expires_at
    WHERE mnemonix_password_links.expires_at <= now()+interval '29 minutes' RETURNING user_id`;
  if (link) {
    try { await sendAccountMail(email, 'reset', code); }
    catch { await sql`DELETE FROM mnemonix_password_links WHERE token_hash=${fingerprint}`; }
  }
  return json(res, 202, {message: GENERIC});
}

async function reset(res, sql, body) {
  if (!validToken(body.token) || !newPassword(body.password)) return fail(res, 400, 'Confira o link e a nova senha.');
  const fingerprint = hash(body.token);
  const [valid] = await sql`SELECT 1 FROM mnemonix_password_links WHERE token_hash=${fingerprint} AND expires_at>now()`;
  if (!valid) return fail(res, 400, 'Link inválido, expirado ou já utilizado.');
  const passwordHash = await bcrypt.hash(body.password, 12);
  const [user] = await sql`WITH link AS (
    DELETE FROM mnemonix_password_links WHERE token_hash=${fingerprint} AND expires_at>now() RETURNING user_id
  ), account AS (
    UPDATE mnemonix_users SET password_hash=${passwordHash}, email_verified_at=COALESCE(email_verified_at,now()),
      updated_at=now(), failed_logins=0, locked_until=NULL
    WHERE id=(SELECT user_id FROM link) AND active RETURNING id
  ), revoked AS (
    DELETE FROM mnemonix_sessions WHERE user_id=(SELECT id FROM account)
  ) SELECT id FROM account`;
  if (!user) return fail(res, 400, 'Link inválido, expirado ou já utilizado.');
  return json(res, 200, {message: 'Senha atualizada. Entre com sua nova senha.'});
}

export default async function handler(req, res) {
  try {
    if (!hasDatabase()) return fail(res, 503, 'Contas indisponíveis neste ambiente. Você pode treinar localmente.');
    if (req.method !== 'GET' && req.method !== 'POST') return fail(res, 405, 'Método não permitido.');
    if (req.method === 'POST' && !sameOrigin(req)) return fail(res, 403, 'Origem inválida.');
    const body = bodyOf(req);
    if (req.method === 'GET' && !req.headers.cookie) return json(res, 200, {user: null, registration: mailConfigured()});
    await ensureDatabase();
    const sql = database();
    if (req.method === 'GET') {
      const user = await currentUser(req);
      return json(res, 200, {user: user ? publicUser(user) : null, registration: mailConfigured()});
    }
    switch (body.action) {
      case 'signup': return await signup(req, res, sql, body);
      case 'verify': return await confirm(res, sql, body);
      case 'login': return await login(req, res, sql, body);
      case 'forgot': return await forgot(req, res, sql, body);
      case 'reset': return await reset(res, sql, body);
      case 'logout': await clearSession(req, res); return json(res, 200, {user: null});
      case 'change_password': {
        const user = await currentUser(req);
        if (!user) return fail(res, 401, 'Sua sessão expirou. Entre novamente.');
        if (!newPassword(body.password) || typeof body.current !== 'string' || body.current.length > 256) {
          return fail(res, 400, 'Confira a senha atual e a nova senha.');
        }
        if (!await permit(req, sql, user.id, 'change_password')) return fail(res, 429, 'Muitas tentativas. Tente novamente mais tarde.');
        const [stored] = await sql`SELECT password_hash FROM mnemonix_users WHERE id=${user.id}`;
        if (!await bcrypt.compare(body.current, stored.password_hash)) return fail(res, 400, 'Senha atual inválida.');
        const next = await bcrypt.hash(body.password, 12);
        const [changed] = await sql`WITH changed AS (
          UPDATE mnemonix_users SET password_hash=${next},updated_at=now()
          WHERE id=${user.id} AND password_hash=${stored.password_hash} RETURNING id
        ), revoked AS (
          DELETE FROM mnemonix_sessions WHERE user_id=(SELECT id FROM changed)
        ), reset_links AS (
          DELETE FROM mnemonix_password_links WHERE user_id=(SELECT id FROM changed)
        ) SELECT id FROM changed`;
        if (!changed) return fail(res, 409, 'A senha mudou em outro dispositivo. Entre novamente.');
        if (!await createSession(res, user.id, next)) return fail(res, 409, 'A senha mudou em outro dispositivo. Entre novamente.');
        return json(res, 200, {message: 'Senha alterada.'});
      }
      case 'accept': {
        const user = await currentUser(req);
        if (!user) return fail(res, 401, 'Sua sessão expirou. Entre novamente.');
        if (body.terms !== true || body.termsVersion !== TERMS_VERSION) return fail(res, 400, 'Aceite os termos para continuar.');
        await sql`INSERT INTO mnemonix_consents(user_id,version) VALUES (${user.id},${TERMS_VERSION}) ON CONFLICT DO NOTHING`;
        return json(res, 200, {user: publicUser({...user, terms: true})});
      }
      default: return fail(res, 400, 'Operação inválida.');
    }
  } catch (error) {
    console.error('mnemonix.auth', error.code || error.name);
    return fail(res, 503, 'O serviço de conta está indisponível. Tente novamente em instantes.');
  }
}
