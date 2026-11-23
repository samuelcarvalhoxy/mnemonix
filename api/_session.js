import {createHash, randomBytes} from 'node:crypto';
import {database} from './_db.js';
import {TERMS_VERSION} from '../public/assets/legal.js';

const COOKIE = 'mnemonix_session';
const SECONDS = 14 * 86400;
export const hash = value => createHash('sha256').update(value).digest('hex');
export const token = () => randomBytes(32).toString('base64url');
const tokenPattern = /^[A-Za-z0-9_-]{43}$/;
export const validToken = value => typeof value === 'string' && tokenPattern.test(value);
const sessionToken = req => {
  const match = (req.headers.cookie || '').split(';').map(part => part.trim()).find(part => part.startsWith(COOKIE + '='));
  const value = match?.slice(COOKIE.length + 1);
  return validToken(value) ? value : null;
};
function setCookie(res, value, age) {
  const secure = process.env.VERCEL || process.env.NODE_ENV === 'production' ? '; Secure' : '';
  res.setHeader('Set-Cookie', `${COOKIE}=${value}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${age}${secure}`);
}
export async function createSession(res, userId, passwordHash) {
  const value = token();
  const sql = database();
  const [session] = await sql`INSERT INTO mnemonix_sessions(token_hash,user_id,expires_at)
    SELECT ${hash(value)},id,now()+interval '14 days' FROM mnemonix_users
    WHERE id=${userId} AND password_hash=${passwordHash} AND active
    FOR UPDATE RETURNING user_id`;
  if (session) setCookie(res, value, SECONDS);
  return Boolean(session);
}
export async function clearSession(req, res) {
  const previous = sessionToken(req);
  if (previous) {
    const sql = database();
    await sql`DELETE FROM mnemonix_sessions WHERE token_hash = ${hash(previous)}`;
  }
  setCookie(res, '', 0);
}
export async function currentUser(req) {
  const value = sessionToken(req);
  if (!value) return null;
  const sql = database();
  const [user] = await sql`SELECT u.id, u.display_name, u.email, u.username, (u.email_verified_at IS NOT NULL) AS verified,
    EXISTS(SELECT 1 FROM mnemonix_consents c WHERE c.user_id=u.id AND c.version=${TERMS_VERSION}) AS terms
    FROM mnemonix_sessions s JOIN mnemonix_users u ON u.id=s.user_id
    WHERE s.token_hash=${hash(value)} AND s.expires_at>now() AND u.active`;
  return user || null;
}
export function publicUser(user) {
  return {
    id: user.id, name: user.display_name, email: user.email, username: user.username,
    verified: Boolean(user.verified), terms: Boolean(user.terms)
  };
}
