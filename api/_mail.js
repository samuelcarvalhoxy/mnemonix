import nodemailer from 'nodemailer';

const settings = () => ({
  from: process.env.MNEMONIX_EMAIL_FROM,
  host: process.env.MNEMONIX_SMTP_HOST,
  port: Number(process.env.MNEMONIX_SMTP_PORT || 465),
  user: process.env.MNEMONIX_SMTP_USER,
  pass: process.env.MNEMONIX_SMTP_PASSWORD,
  resend: process.env.RESEND_API_KEY,
  url: process.env.MNEMONIX_APP_URL || 'https://mnemonix.vercel.app'
});
export function mailConfigured() {
  const {from, host, user, pass, resend, url, port} = settings();
  try {
    return new URL(url).protocol === 'https:' && Boolean(from && (resend || (host && user && pass && [465, 587, 2525].includes(port))));
  } catch { return false; }
}
export async function sendAccountMail(to, kind, token) {
  const cfg = settings();
  const url = new URL('/', cfg.url);
  url.hash = `auth/${kind}/${token}`;
  const subject = kind === 'verify' ? 'Confirme seu e-mail no Mnemônix' : 'Redefina sua senha do Mnemônix';
  const text = `${subject}\n\nAbra este link: ${url.href}\n\nO link vale por ${kind === 'verify' ? '60' : '30'} minutos. Ignore esta mensagem se não fez a solicitação.`;
  if (cfg.resend) {
    const result = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {Authorization: `Bearer ${cfg.resend}`, 'Content-Type': 'application/json'},
      body: JSON.stringify({from: cfg.from, to, subject, text}),
      signal: AbortSignal.timeout(12000)
    });
    if (!result.ok) throw new Error('MAIL_REJECTED');
    return;
  }
  const transport = nodemailer.createTransport({
    host: cfg.host, port: cfg.port, auth: {user: cfg.user, pass: cfg.pass},
    secure: cfg.port === 465, requireTLS: cfg.port !== 465, disableFileAccess: true, disableUrlAccess: true,
    connectionTimeout: 8000, greetingTimeout: 8000, socketTimeout: 12000
  });
  const result = await transport.sendMail({from: cfg.from, to, subject, text});
  if (!result.accepted.length) throw new Error('MAIL_REJECTED');
}
