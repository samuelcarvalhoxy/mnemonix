import {database, hasDatabase} from './_db.js';
import {json} from './_http.js';
import {mailConfigured} from './_mail.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') return json(res, 405, {error: 'Método não permitido.'});
  const registration = mailConfigured() && hasDatabase();
  if (!hasDatabase()) return json(res, 200, {ok: true, accounts: false, registration: false});
  try {
    const sql = database();
    await sql`SELECT 1`;
    return json(res, 200, {ok: true, accounts: true, registration});
  } catch {
    return json(res, 503, {ok: false, accounts: false, registration: false});
  }
}
