const SESSION_MAX_AGE = 60 * 60 * 24 * 7;
const MAX_PHOTO_BYTES = 8 * 1024 * 1024;
const REGISTRATION_CODE_MAX_AGE = 10 * 60 * 1000;
const ALLOWED_PHOTO_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const MAX_LOGO_DATA_URL_BYTES = 256 * 1024;
const PHOTO_CATEGORIES = new Set(['General', 'Tennis', 'Golf', 'Dining', 'Clubhouse', 'Events']);
const encoder = new TextEncoder();

const b64 = bytes => btoa(String.fromCharCode(...new Uint8Array(bytes))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const randomToken = (size = 32) => b64(crypto.getRandomValues(new Uint8Array(size)));
const hash = async value => b64(await crypto.subtle.digest('SHA-256', encoder.encode(String(value))));
const normalize = value => String(value || '').trim().toLowerCase();
const normalizeMemberNumber = value => String(value || '').trim().toUpperCase();
const sameMemberNumber = (left, right) => normalizeMemberNumber(left) === normalizeMemberNumber(right);
const validEmail = email => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalize(email));
const safeEqual = async (left, right) => hash(left).then(a => hash(right).then(b => a === b));
const publicClub = club => ({ id: club.id, slug: club.slug, name: club.name, shortName: club.short_name, logoUrl: club.logo_url });
const accountClub = club => ({
  id: club.id,
  slug: club.slug,
  name: club.name,
  shortName: club.short_name,
  logoUrl: club.logo_url,
  organizationType: club.organization_type || 'Private Club',
  planStatus: club.plan_status || 'active',
  trialStartedAt: club.trial_started_at || '',
  trialEndsAt: club.trial_ends_at || '',
  storageLimitBytes: Number(club.storage_limit_bytes || 26843545600)
});
const publicMember = member => ({ memberNumber: member.memberNumber, lastName: member.lastName, firstName: member.firstName, email: member.email, registeredAt: member.registeredAt, role: member.role });
const cleanText = (value, max) => Array.from(String(value || '').trim()).filter(character => {
  const code = character.charCodeAt(0);
  return code >= 32 && code !== 127;
}).join('').slice(0, max);
const escapeHtml = value => String(value).replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);
const clubSlug = value => cleanText(value, 80).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60);
const secureLogoUrl = value => {
  const logoUrl = String(value || '').trim();
  if (!logoUrl || /^https:\/\//i.test(logoUrl)) return logoUrl;
  const match = logoUrl.match(/^data:(image\/(?:png|jpeg|webp));base64,([A-Za-z0-9+/]+={0,2})$/i);
  if (!match) return null;
  try { return atob(match[2]).length <= MAX_LOGO_DATA_URL_BYTES ? logoUrl : null; } catch { return null; }
};
const verificationCode = () => {
  const values = new Uint32Array(1);
  crypto.getRandomValues(values);
  return String(100000 + (values[0] % 900000));
};

const derivePassword = async (password, salt) => {
  const key = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt: encoder.encode(salt), iterations: 100000, hash: 'SHA-256' }, key, 256);
  return b64(bits);
};

const originFor = (request, env) => {
  const requestOrigin = request.headers.get('Origin');
  const allowed = String(env.ALLOWED_ORIGIN || '').split(',').map(value => value.trim()).filter(Boolean);
  if (!requestOrigin) return allowed[0] || '';
  return allowed.includes(requestOrigin) ? requestOrigin : '';
};
const responseHeaders = (origin, extra = {}) => {
  const headers = new Headers({
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Allow-Headers': 'Content-Type, X-CSRF-Token',
    'Access-Control-Allow-Methods': 'GET,POST,PATCH,DELETE,OPTIONS',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'no-referrer'
  });
  if (origin) headers.set('Access-Control-Allow-Origin', origin);
  headers.set('Vary', 'Origin');
  for (const [name, value] of Object.entries(extra)) {
    if (name.toLowerCase() === 'set-cookie' && Array.isArray(value)) value.forEach(item => headers.append('Set-Cookie', item));
    else headers.set(name, value);
  }
  return headers;
};
const json = (body, status, origin, extra) => new Response(JSON.stringify(body), { status: status || 200, headers: responseHeaders(origin, extra) });
const noContent = (status, origin, extra) => new Response(null, { status: status || 204, headers: responseHeaders(origin, extra) });
const rateLimited = origin => json({ error: 'Too many attempts. Please wait a minute and try again.', code: 'RATE_LIMITED' }, 429, origin, { 'Retry-After': '60' });

async function withinRateLimit(request, limiter, action) {
  if (!limiter) return true;
  const body = await request.clone().json().catch(() => ({}));
  const identity = `${body.clubId || ''}:${body.memberNumber || body.email || body.token || request.headers.get('CF-Connecting-IP') || 'anonymous'}`.trim().toLowerCase();
  const ip = request.headers.get('CF-Connecting-IP') || 'unknown-ip';
  const [identityResult, ipResult] = await Promise.all([
    limiter.limit({ key: await hash(`${action}:identity:${identity}`) }),
    limiter.limit({ key: await hash(`${action}:ip:${ip}`) })
  ]);
  return identityResult.success && ipResult.success;
}

const cookies = request => Object.fromEntries((request.headers.get('Cookie') || '').split(';').map(part => part.trim().split('=').map(decodeURIComponent)).filter(pair => pair.length === 2));
const cookie = (name, value, maxAge, httpOnly) => `${name}=${encodeURIComponent(value)}; Path=/; Max-Age=${maxAge}; Secure; SameSite=None${httpOnly ? '; HttpOnly' : ''}`;

async function getClub(env, clubId) {
  return env.DB.prepare('SELECT * FROM clubs WHERE id = ? AND status = \'active\'').bind(String(clubId || '').trim()).first();
}

async function auth(request, env) {
  const token = cookies(request).pt_session;
  if (!token) return null;
  return env.DB.prepare(`SELECT s.*, COALESCE(m.first_name, a.first_name) AS firstName,
    COALESCE(m.last_name, a.last_name) AS lastName, a.email AS adminEmail,
    c.name AS clubName, c.short_name AS clubShortName, c.slug AS clubSlug, c.logo_url AS clubLogoUrl,
    c.organization_type AS organizationType, c.plan_status AS planStatus,
    c.trial_started_at AS trialStartedAt, c.trial_ends_at AS trialEndsAt,
    c.storage_limit_bytes AS storageLimitBytes
    FROM sessions s
    JOIN clubs c ON c.id = s.club_id AND c.status = 'active'
    LEFT JOIN members m ON m.club_id = s.club_id AND m.member_number = s.member_number
    LEFT JOIN club_admins a ON a.club_id = s.club_id AND ('admin:' || a.id) = s.member_number AND a.status = 'active'
    WHERE s.token_hash = ? AND s.expires_at > ?
      AND ((s.role = 'admin' AND a.id IS NOT NULL) OR (s.role != 'admin' AND m.member_number IS NOT NULL))`).bind(await hash(token), Date.now()).first();
}

async function requireAuth(request, env, role) {
  const session = await auth(request, env);
  if (!session || (role && session.role !== role)) return null;
  const csrf = request.headers.get('X-CSRF-Token');
  if (!csrf || (await hash(csrf)) !== session.csrf_hash) return null;
  return session;
}

async function requireWritableClub(env, session) {
  if (!session) return false;
  const club = await env.DB.prepare('SELECT plan_status, trial_ends_at FROM clubs WHERE id = ?').bind(session.club_id).first();
  if (!club) return false;
  if (club.plan_status === 'active' || club.plan_status === 'demo') return club.plan_status !== 'demo';
  return club.plan_status === 'trialing' && Boolean(club.trial_ends_at) && Date.parse(club.trial_ends_at) > Date.now();
}

const readOnly = origin => json({ error: 'This workspace is read-only because its trial has ended. Activate a plan to make changes.', code: 'WORKSPACE_READ_ONLY' }, 402, origin);

const sessionClub = session => ({
  id: session.club_id,
  slug: session.clubSlug,
  name: session.clubName,
  shortName: session.clubShortName,
  logoUrl: session.clubLogoUrl,
  organizationType: session.organizationType,
  planStatus: session.planStatus,
  trialStartedAt: session.trialStartedAt,
  trialEndsAt: session.trialEndsAt,
  storageLimitBytes: Number(session.storageLimitBytes || 26843545600)
});
const photoUrl = photo => photo.external_url || `/api/photos/${encodeURIComponent(photo.id)}/file`;
const photoDownloadUrl = photo => `/api/photos/${encodeURIComponent(photo.id)}/file?download=1`;
const trustedExternalPhoto = (value, env) => {
  try {
    const url = new URL(value);
    const allowedHosts = String(env.LEGACY_PHOTO_HOSTS || 'images.unsplash.com').split(',').map(host => host.trim().toLowerCase()).filter(Boolean);
    return url.protocol === 'https:' && allowedHosts.includes(url.hostname.toLowerCase()) ? url.toString() : null;
  } catch {
    return null;
  }
};

async function sendMail(env, { to, subject, text, html }) {
  if (!env.MAILERSEND_API_TOKEN || !env.MAIL_FROM) throw new Error('Email delivery is not configured.');
  const response = await fetch('https://api.mailersend.com/v1/email', {
    method: 'POST',
    headers: { Authorization: `Bearer ${env.MAILERSEND_API_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: { email: env.MAIL_FROM, name: 'Club PhotoHub' }, to: [{ email: to }], subject, text, html })
  });
  if (!response.ok) throw new Error(`MailerSend rejected the message (${response.status}).`);
}

const emailEscape = value => escapeHtml(String(value ?? ''));
const clubPhotoHubEmail = ({ eyebrow = 'Secure member access', title, intro, code, details, actionLabel, actionUrl }) => {
  const codeMarkup = code
    ? `<div style="margin:28px 0 24px;padding:18px 22px;background:#f7f3eb;border:1px solid #d8c39a;border-radius:14px;color:#17133f;font-family:Arial,sans-serif;font-size:34px;font-weight:700;letter-spacing:9px;text-align:center">${emailEscape(code)}</div>`
    : '';
  const actionMarkup = actionUrl
    ? `<div style="margin:28px 0"><a href="${emailEscape(actionUrl)}" style="display:inline-block;background:#29216b;color:#ffffff;text-decoration:none;padding:14px 24px;border-radius:9px;font-family:Arial,sans-serif;font-size:16px;font-weight:700">${emailEscape(actionLabel || 'Continue')}</a></div>`
    : '';
  return `<!doctype html><html><body style="margin:0;background:#f5f2ed;color:#24213f;font-family:Arial,Helvetica,sans-serif"><div style="padding:32px 16px"><div style="max-width:600px;margin:0 auto;background:#ffffff;border:1px solid #e0e4df;border-top:8px solid #c8a354;border-radius:22px;overflow:hidden;box-shadow:0 10px 28px rgba(23,19,63,.08)"><div style="padding:28px 32px 24px;background:#29216b;color:#ffffff"><div style="display:inline-block;width:44px;height:44px;line-height:44px;border-radius:50%;background:#c8a354;color:#29216b;font-family:Georgia,serif;font-size:18px;font-weight:700;text-align:center">CP</div><div style="margin-top:18px;color:#e9d9b3;font-family:Arial,sans-serif;font-size:12px;font-weight:700;letter-spacing:2px;text-transform:uppercase">Club PhotoHub</div><div style="margin-top:8px;font-family:Georgia,'Times New Roman',serif;font-size:28px;line-height:1.2">${emailEscape(title)}</div></div><div style="padding:32px"><div style="color:#a27a2b;font-size:12px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase">${emailEscape(eyebrow)}</div><p style="margin:16px 0 0;font-size:17px;line-height:1.6">${emailEscape(intro)}</p>${codeMarkup}${details ? `<p style="margin:0;color:#6f7e76;font-size:14px;line-height:1.6">${emailEscape(details)}</p>` : ''}${actionMarkup}<p style="margin:28px 0 0;color:#6f7e76;font-size:13px;line-height:1.6">If you did not request this email, you can safely ignore it. For help, contact <a href="mailto:support@xtide.io" style="color:#29216b">support@xtide.io</a>.</p></div><div style="padding:18px 32px;background:#faf9f6;border-top:1px solid #e6e8e4;color:#7c8b83;font-size:12px;line-height:1.5">Private photo sharing for clubs and member organizations.<br><span style="color:#a27a2b">xTide Apps</span></div></div></div></body></html>`;
};

async function createSession(env, clubId, principalId, role) {
  const token = randomToken();
  const csrf = randomToken(24);
  await env.DB.prepare('INSERT INTO sessions (token_hash, club_id, member_number, role, csrf_hash, expires_at) VALUES (?, ?, ?, ?, ?, ?)')
    .bind(await hash(token), clubId, principalId, role, await hash(csrf), Date.now() + SESSION_MAX_AGE * 1000).run();
  return { token, csrf };
}

async function bootstrap(request, env) {
  const session = await auth(request, env);
  if (!session) return null;
  const [membersResult, photosResult] = await Promise.all([
    session.role === 'admin'
      ? env.DB.prepare('SELECT member_number AS memberNumber, last_name AS lastName, first_name AS firstName, email, registered_at AS registeredAt, role FROM members WHERE club_id = ? ORDER BY member_number').bind(session.club_id).all()
      : Promise.resolve({ results: [] }),
    env.DB.prepare('SELECT * FROM photos WHERE club_id = ? ORDER BY created_at DESC').bind(session.club_id).all()
  ]);
  const photos = await Promise.all(photosResult.results.map(async photo => {
    const likes = await env.DB.prepare('SELECT member_number FROM photo_likes WHERE club_id = ? AND photo_id = ? ORDER BY member_number').bind(session.club_id, photo.id).all();
    return { id: photo.id, url: photoUrl(photo), downloadUrl: photoDownloadUrl(photo), fileName: photo.object_key || undefined, caption: photo.caption, category: photo.category, uploaderName: photo.uploader_name, uploaderId: photo.uploader_id, createdAt: photo.created_at, hearts: likes.results.length, heartUsers: likes.results.map(like => like.member_number) };
  }));
  return { club: sessionClub(session), members: membersResult.results, photos };
}

async function login(request, env, origin) {
  const body = await request.json();
  const club = await getClub(env, body.clubId);
  if (!club) return json({ error: 'Select a valid club.' }, 400, origin);
  let memberNumber;
  let user;
  let role;
  if (body.mode === 'admin') {
    let admin = await env.DB.prepare("SELECT * FROM club_admins WHERE club_id = ? AND email = ? AND status = 'active'").bind(club.id, normalize(body.email)).first();
    const adminCount = admin ? 1 : Number((await env.DB.prepare("SELECT COUNT(*) AS count FROM club_admins WHERE club_id = ? AND status = 'active'").bind(club.id).first())?.count || 0);
    if (!admin && adminCount === 0 && club.id === 'oakville-club' && env.ADMIN_EMAIL && env.ADMIN_PASSWORD && normalize(body.email) === normalize(env.ADMIN_EMAIL) && await safeEqual(body.password || '', env.ADMIN_PASSWORD)) {
      const adminId = randomToken(12);
      const salt = randomToken(16);
      const now = new Date().toISOString();
      await env.DB.prepare('INSERT INTO club_admins (id, club_id, email, first_name, last_name, password_hash, password_salt, verified_at, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, \'active\', ?)')
        .bind(adminId, club.id, normalize(body.email), 'Club', 'Management', await derivePassword(body.password, salt), salt, now, now).run();
      admin = await env.DB.prepare('SELECT * FROM club_admins WHERE id = ?').bind(adminId).first();
    }
    if (!admin || !(await safeEqual(await derivePassword(body.password || '', admin.password_salt), admin.password_hash))) return json({ error: 'Invalid credentials.' }, 401, origin);
    memberNumber = `admin:${admin.id}`;
    user = { memberNumber, firstName: admin.first_name, lastName: admin.last_name, email: admin.email };
    role = 'admin';
  } else {
    const member = await env.DB.prepare('SELECT * FROM members WHERE club_id = ? AND member_number = ? COLLATE NOCASE').bind(club.id, String(body.memberNumber || '').trim()).first();
    const namesMatch = member && normalize(member.last_name) === normalize(body.lastName);
    if (namesMatch && !member.password_hash) return json({ error: 'Complete your first-time registration.', code: 'NEEDS_REGISTRATION' }, 403, origin);
    if (!namesMatch || !member.password_hash || !(await safeEqual(await derivePassword(body.password || '', member.password_salt), member.password_hash))) return json({ error: 'Invalid credentials.' }, 401, origin);
    memberNumber = member.member_number;
    user = { memberNumber, firstName: member.first_name, lastName: member.last_name };
    role = member.role || 'member';
  }
  const session = await createSession(env, club.id, memberNumber, role);
  return json({ user, club: accountClub(club), role, csrfToken: session.csrf }, 200, origin, { 'Set-Cookie': [cookie('pt_session', session.token, SESSION_MAX_AGE, true), cookie('pt_csrf', session.csrf, SESSION_MAX_AGE, false)] });
}

async function startClubOnboarding(request, env, origin) {
  const body = await request.json();
  const clubName = cleanText(body.clubName, 80);
  const shortName = cleanText(body.shortName || clubName, 40);
  const organizationType = cleanText(body.organizationType, 50);
  const slug = clubSlug(clubName);
  const firstName = cleanText(body.firstName, 50);
  const lastName = cleanText(body.lastName, 50);
  const email = normalize(body.email);
  const logoUrl = secureLogoUrl(body.logoUrl);
  if (clubName.length < 2 || shortName.length < 2 || !organizationType || !slug || !firstName || !lastName || !validEmail(email) || logoUrl === null) {
    return json({ error: 'Enter the organization name and type, administrator name, and a valid work email. Logo URLs must use HTTPS.' }, 400, origin);
  }
  if (await env.DB.prepare('SELECT 1 FROM clubs WHERE slug = ?').bind(slug).first()) return json({ error: 'A club workspace with that name already exists.' }, 409, origin);
  const signupId = randomToken(24);
  const code = verificationCode();
  await env.DB.prepare('DELETE FROM club_signup_challenges WHERE expires_at <= ? OR admin_email = ?').bind(Date.now(), email).run();
  await env.DB.prepare('INSERT INTO club_signup_challenges (id, club_slug, club_name, club_short_name, club_logo_url, organization_type, admin_email, admin_first_name, admin_last_name, code_hash, expires_at, attempts, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?)')
    .bind(signupId, slug, clubName, shortName, logoUrl, organizationType, email, firstName, lastName, await hash(code), Date.now() + REGISTRATION_CODE_MAX_AGE, Date.now()).run();
  try {
    await sendMail(env, {
      to: email,
      subject: 'Verify your Club PhotoHub workspace',
      text: `Your Club PhotoHub verification code is ${code}. It expires in 10 minutes.`,
      html: clubPhotoHubEmail({ eyebrow: 'Workspace setup', title: 'Verify your administrator email', intro: `Use this code to finish setting up ${clubName}.`, code, details: 'This code expires in 10 minutes.' })
    });
  } catch (error) {
    await env.DB.prepare('DELETE FROM club_signup_challenges WHERE id = ?').bind(signupId).run();
    console.error('Club onboarding email failed', { signupId, message: error.message });
    return json({ error: 'We could not send the verification code. Please try again shortly.' }, 502, origin);
  }
  return json({ signupId, message: 'A 6-digit verification code was sent to the administrator email.' }, 200, origin);
}

async function completeClubOnboarding(request, env, origin) {
  const body = await request.json();
  if (!body.signupId || !/^\d{6}$/.test(String(body.code || '')) || typeof body.password !== 'string' || body.password.length < 10) {
    return json({ error: 'Enter the 6-digit code and a password of at least 10 characters.' }, 400, origin);
  }
  const challenge = await env.DB.prepare('SELECT * FROM club_signup_challenges WHERE id = ?').bind(String(body.signupId)).first();
  if (!challenge || challenge.expires_at <= Date.now() || challenge.attempts >= 5) return json({ error: 'The verification code is invalid or expired.' }, 400, origin);
  await env.DB.prepare('UPDATE club_signup_challenges SET attempts = attempts + 1 WHERE id = ?').bind(challenge.id).run();
  if (!(await safeEqual(await hash(String(body.code)), challenge.code_hash))) return json({ error: 'The verification code is invalid or expired.' }, 400, origin);
  if (await env.DB.prepare('SELECT 1 FROM clubs WHERE slug = ?').bind(challenge.club_slug).first()) return json({ error: 'That club workspace was already created. Sign in instead.' }, 409, origin);
  const adminId = randomToken(12);
  const salt = randomToken(16);
  const now = new Date().toISOString();
  const trialEndsAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
  await env.DB.batch([
    env.DB.prepare('INSERT INTO clubs (id, slug, name, short_name, logo_url, status, organization_type, plan_status, trial_started_at, trial_ends_at, storage_limit_bytes, created_at) VALUES (?, ?, ?, ?, ?, \'active\', ?, \'trialing\', ?, ?, 26843545600, ?)').bind(challenge.club_slug, challenge.club_slug, challenge.club_name, challenge.club_short_name, challenge.club_logo_url, challenge.organization_type, now, trialEndsAt, now),
    env.DB.prepare('INSERT INTO club_admins (id, club_id, email, first_name, last_name, password_hash, password_salt, verified_at, status, role, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, \'active\', \'owner\', ?)').bind(adminId, challenge.club_slug, challenge.admin_email, challenge.admin_first_name, challenge.admin_last_name, await derivePassword(body.password, salt), salt, now, now),
    env.DB.prepare('DELETE FROM club_signup_challenges WHERE id = ?').bind(challenge.id)
  ]);
  const club = await getClub(env, challenge.club_slug);
  const session = await createSession(env, club.id, `admin:${adminId}`, 'admin');
  const user = { memberNumber: `admin:${adminId}`, firstName: challenge.admin_first_name, lastName: challenge.admin_last_name, email: challenge.admin_email };
  return json({ user, club: accountClub(club), role: 'admin', csrfToken: session.csrf }, 201, origin, { 'Set-Cookie': [cookie('pt_session', session.token, SESSION_MAX_AGE, true), cookie('pt_csrf', session.csrf, SESSION_MAX_AGE, false)] });
}

async function requestRegistrationCode(request, env, origin) {
  const body = await request.json();
  const club = await getClub(env, body.clubId);
  const memberNumber = String(body.memberNumber || '').trim();
  const email = normalize(body.email);
  const member = club ? await env.DB.prepare('SELECT * FROM members WHERE club_id = ? AND member_number = ? COLLATE NOCASE').bind(club.id, memberNumber).first() : null;
  const storedMemberNumber = member?.member_number || memberNumber;
  if (!member || member.password_hash || normalize(member.last_name) !== normalize(body.lastName) || !validEmail(email) || normalize(member.email) !== email) {
    return json({ error: 'Those details do not match the club directory. Contact your club if your roster email needs updating.' }, 400, origin);
  }
  const values = new Uint32Array(1);
  crypto.getRandomValues(values);
  const code = String(100000 + (values[0] % 900000));
  await env.DB.prepare('INSERT OR REPLACE INTO registration_challenges (club_id, member_number, email_hash, code_hash, expires_at, attempts, created_at) VALUES (?, ?, ?, ?, ?, 0, ?)')
    .bind(club.id, storedMemberNumber, await hash(email), await hash(code), Date.now() + REGISTRATION_CODE_MAX_AGE, Date.now()).run();
  try {
    await sendMail(env, {
      to: member.email,
      subject: `Your ${club.name} verification code`,
      text: `Your Club PhotoHub verification code is ${code}. It expires in 10 minutes.`,
      html: clubPhotoHubEmail({ eyebrow: 'Member verification', title: 'Confirm your member access', intro: `Use this code to finish creating your ${club.name} member account.`, code, details: 'This code expires in 10 minutes.' })
    });
  } catch (error) {
    await env.DB.prepare('DELETE FROM registration_challenges WHERE club_id = ? AND member_number = ? COLLATE NOCASE').bind(club.id, storedMemberNumber).run();
    console.error('Registration verification email failed', { clubId: club.id, memberNumber, message: error.message });
    return json({ error: 'We could not send the verification code. Please try again shortly.' }, 502, origin);
  }
  return json({ message: 'A 6-digit verification code was sent to the email address on file.' }, 200, origin);
}

async function registerMember(request, env, origin) {
  const body = await request.json();
  const club = await getClub(env, body.clubId);
  const memberNumber = String(body.memberNumber || '').trim();
  const email = normalize(body.email);
  const member = club ? await env.DB.prepare('SELECT * FROM members WHERE club_id = ? AND member_number = ? COLLATE NOCASE').bind(club.id, memberNumber).first() : null;
  if (!member || member.password_hash || normalize(member.last_name) !== normalize(body.lastName) || normalize(member.email) !== email) return json({ error: 'Registration could not be completed.' }, 400, origin);
  if (typeof body.password !== 'string' || body.password.length < 10 || !/^\d{6}$/.test(String(body.code || ''))) return json({ error: 'Enter the 6-digit code and a password of at least 10 characters.' }, 400, origin);
  const challenge = await env.DB.prepare('SELECT * FROM registration_challenges WHERE club_id = ? AND member_number = ? COLLATE NOCASE').bind(club.id, member.member_number).first();
  if (!challenge || challenge.expires_at <= Date.now() || challenge.attempts >= 5 || challenge.email_hash !== await hash(email)) return json({ error: 'The verification code is invalid or expired.' }, 400, origin);
  await env.DB.prepare('UPDATE registration_challenges SET attempts = attempts + 1 WHERE club_id = ? AND member_number = ? COLLATE NOCASE').bind(club.id, member.member_number).run();
  if (!(await safeEqual(await hash(String(body.code)), challenge.code_hash))) return json({ error: 'The verification code is invalid or expired.' }, 400, origin);
  const salt = randomToken(16);
  await env.DB.batch([
    env.DB.prepare('UPDATE members SET password = \'\', password_hash = ?, password_salt = ?, registered_at = ? WHERE club_id = ? AND member_number = ? COLLATE NOCASE').bind(await derivePassword(body.password, salt), salt, new Date().toISOString(), club.id, member.member_number),
    env.DB.prepare('DELETE FROM registration_challenges WHERE club_id = ? AND member_number = ? COLLATE NOCASE').bind(club.id, member.member_number)
  ]);
  const session = await createSession(env, club.id, member.member_number, member.role || 'member');
  return json({ user: { memberNumber: member.member_number, firstName: member.first_name, lastName: member.last_name }, club: accountClub(club), role: member.role || 'member', csrfToken: session.csrf }, 201, origin, { 'Set-Cookie': [cookie('pt_session', session.token, SESSION_MAX_AGE, true), cookie('pt_csrf', session.csrf, SESSION_MAX_AGE, false)] });
}

async function requestPasswordReset(request, env, origin) {
  const body = await request.json();
  const club = await getClub(env, body.clubId);
  const memberNumber = String(body.memberNumber || '').trim();
  const member = club ? await env.DB.prepare('SELECT member_number, last_name, email FROM members WHERE club_id = ? AND member_number = ? COLLATE NOCASE').bind(club.id, memberNumber).first() : null;
  if (member && normalize(member.last_name) === normalize(body.lastName) && validEmail(member.email)) {
    const rawToken = randomToken(32);
    await env.DB.prepare('DELETE FROM password_resets WHERE club_id = ? AND member_number = ?').bind(club.id, member.member_number).run();
    await env.DB.prepare('INSERT INTO password_resets (token_hash, club_id, member_number, expires_at) VALUES (?, ?, ?, ?)').bind(await hash(rawToken), club.id, member.member_number, Date.now() + 30 * 60 * 1000).run();
    const resetOrigin = origin || env.APP_ORIGIN || 'https://clubphotohub.xtide.io';
    const resetUrl = `${resetOrigin}/app?reset=${encodeURIComponent(rawToken)}`;
    try {
      await sendMail(env, { to: member.email, subject: 'Reset your Club PhotoHub password', text: `Use this link to reset your Club PhotoHub password. It expires in 30 minutes: ${resetUrl}`, html: clubPhotoHubEmail({ eyebrow: 'Account security', title: 'Reset your password', intro: 'Use the button below to choose a new Club PhotoHub password.', details: 'This link expires in 30 minutes and can only be used once.', actionLabel: 'Reset password', actionUrl: resetUrl }) });
    } catch (error) {
      console.error('Password reset email failed', { clubId: club.id, memberNumber, message: error.message });
      await env.DB.prepare('DELETE FROM password_resets WHERE club_id = ? AND member_number = ?').bind(club.id, member.member_number).run();
    }
  }
  return json({ message: 'If those membership details are registered, a reset link will be sent to the roster email.' }, 200, origin);
}

async function resetPassword(request, env, origin) {
  const body = await request.json();
  if (typeof body.password !== 'string' || body.password.length < 10 || !body.token) return json({ error: 'Invalid reset request.' }, 400, origin);
  const reset = await env.DB.prepare('SELECT * FROM password_resets WHERE token_hash = ? AND used_at IS NULL AND expires_at > ?').bind(await hash(body.token), Date.now()).first();
  if (!reset) return json({ error: 'Invalid or expired reset link.' }, 400, origin);
  const salt = randomToken(16);
  await env.DB.batch([
    env.DB.prepare('UPDATE members SET password = \'\', password_hash = ?, password_salt = ?, registered_at = ? WHERE club_id = ? AND member_number = ?').bind(await derivePassword(body.password, salt), salt, new Date().toISOString(), reset.club_id, reset.member_number),
    env.DB.prepare('UPDATE password_resets SET used_at = ? WHERE token_hash = ?').bind(Date.now(), reset.token_hash),
    env.DB.prepare('DELETE FROM sessions WHERE club_id = ? AND member_number = ?').bind(reset.club_id, reset.member_number)
  ]);
  return json({ ok: true }, 200, origin);
}

async function requestAdminPasswordReset(request, env, origin) {
  const body = await request.json();
  const club = await getClub(env, body.clubId);
  const admin = club && validEmail(body.email)
    ? await env.DB.prepare("SELECT id, email FROM club_admins WHERE club_id = ? AND email = ? AND status = 'active'").bind(club.id, normalize(body.email)).first()
    : null;
  if (admin) {
    const rawToken = randomToken(32);
    await env.DB.prepare('DELETE FROM admin_password_resets WHERE club_id = ? AND admin_id = ?').bind(club.id, admin.id).run();
    await env.DB.prepare('INSERT INTO admin_password_resets (token_hash, club_id, admin_id, expires_at) VALUES (?, ?, ?, ?)').bind(await hash(rawToken), club.id, admin.id, Date.now() + 30 * 60 * 1000).run();
    const resetOrigin = origin || env.APP_ORIGIN || 'https://clubphotohub.xtide.io';
    const resetUrl = `${resetOrigin}/app?adminReset=${encodeURIComponent(rawToken)}`;
    try {
      await sendMail(env, { to: admin.email, subject: 'Reset your Club PhotoHub administrator password', text: `Use this link to reset your Club PhotoHub administrator password. It expires in 30 minutes: ${resetUrl}`, html: clubPhotoHubEmail({ eyebrow: 'Administrator security', title: 'Reset your administrator password', intro: 'Use the button below to choose a new administrator password.', details: 'This link expires in 30 minutes and can only be used once.', actionLabel: 'Reset administrator password', actionUrl: resetUrl }) });
    } catch (error) {
      console.error('Administrator password reset email failed', { clubId: club.id, adminId: admin.id, message: error.message });
      await env.DB.prepare('DELETE FROM admin_password_resets WHERE club_id = ? AND admin_id = ?').bind(club.id, admin.id).run();
    }
  }
  return json({ message: 'If that administrator account exists, a reset link will be sent.' }, 200, origin);
}

async function resetAdminPassword(request, env, origin) {
  const body = await request.json();
  if (typeof body.password !== 'string' || body.password.length < 10 || !body.token) return json({ error: 'Invalid reset request.' }, 400, origin);
  const reset = await env.DB.prepare('SELECT * FROM admin_password_resets WHERE token_hash = ? AND used_at IS NULL AND expires_at > ?').bind(await hash(body.token), Date.now()).first();
  if (!reset) return json({ error: 'Invalid or expired reset link.' }, 400, origin);
  const salt = randomToken(16);
  await env.DB.batch([
    env.DB.prepare('UPDATE club_admins SET password_hash = ?, password_salt = ? WHERE club_id = ? AND id = ?').bind(await derivePassword(body.password, salt), salt, reset.club_id, reset.admin_id),
    env.DB.prepare('UPDATE admin_password_resets SET used_at = ? WHERE token_hash = ?').bind(Date.now(), reset.token_hash),
    env.DB.prepare('DELETE FROM sessions WHERE club_id = ? AND member_number = ?').bind(reset.club_id, `admin:${reset.admin_id}`)
  ]);
  return json({ ok: true }, 200, origin);
}

export default {
  async fetch(request, env) {
    const origin = originFor(request, env);
    if (request.headers.get('Origin') && !origin) return json({ error: 'Origin not allowed.' }, 403, '');
    if (request.method === 'OPTIONS') return noContent(204, origin);
    try {
      const url = new URL(request.url);
      const path = url.pathname.replace(/^\/api/, '').replace(/\/$/, '') || '/';
      if (path === '/health' && request.method === 'GET') return json({ ok: true }, 200, origin);
      if (path === '/clubs' && request.method === 'GET') {
        const clubs = await env.DB.prepare("SELECT * FROM clubs WHERE status = 'active' ORDER BY name").all();
        return json({ clubs: clubs.results.map(publicClub) }, 200, origin);
      }
      if (path === '/onboarding/start' && request.method === 'POST') {
        if (!await withinRateLimit(request, env.RESET_RATE_LIMITER, 'club-onboarding-start')) return rateLimited(origin);
        return startClubOnboarding(request, env, origin);
      }
      if (path === '/onboarding/complete' && request.method === 'POST') {
        if (!await withinRateLimit(request, env.AUTH_RATE_LIMITER, 'club-onboarding-complete')) return rateLimited(origin);
        return completeClubOnboarding(request, env, origin);
      }
      if (path === '/auth/login' && request.method === 'POST') {
        if (!await withinRateLimit(request, env.AUTH_RATE_LIMITER, 'login')) return rateLimited(origin);
        return login(request, env, origin);
      }
      if (path === '/auth/member-check' && request.method === 'POST') {
        if (!await withinRateLimit(request, env.AUTH_RATE_LIMITER, 'member-check')) return rateLimited(origin);
        const body = await request.json();
        const club = await getClub(env, body.clubId);
        const member = club ? await env.DB.prepare('SELECT last_name, password_hash FROM members WHERE club_id = ? AND member_number = ? COLLATE NOCASE').bind(club.id, String(body.memberNumber || '').trim()).first() : null;
        if (!member || normalize(member.last_name) !== normalize(body.lastName)) return json({ error: 'Invalid membership details.' }, 400, origin);
        return json({ registered: Boolean(member.password_hash) }, 200, origin);
      }
      if (path === '/auth/registration-code' && request.method === 'POST') {
        if (!await withinRateLimit(request, env.RESET_RATE_LIMITER, 'registration-code')) return rateLimited(origin);
        return requestRegistrationCode(request, env, origin);
      }
      if (path === '/auth/register' && request.method === 'POST') {
        if (!await withinRateLimit(request, env.AUTH_RATE_LIMITER, 'register')) return rateLimited(origin);
        return registerMember(request, env, origin);
      }
      if (path === '/auth/password-reset/request' && request.method === 'POST') {
        if (!await withinRateLimit(request, env.RESET_RATE_LIMITER, 'reset-request')) return rateLimited(origin);
        return requestPasswordReset(request, env, origin);
      }
      if (path === '/auth/password-reset/complete' && request.method === 'POST') {
        if (!await withinRateLimit(request, env.RESET_RATE_LIMITER, 'reset-complete')) return rateLimited(origin);
        return resetPassword(request, env, origin);
      }
      if (path === '/auth/admin-password-reset/request' && request.method === 'POST') {
        if (!await withinRateLimit(request, env.RESET_RATE_LIMITER, 'admin-reset-request')) return rateLimited(origin);
        return requestAdminPasswordReset(request, env, origin);
      }
      if (path === '/auth/admin-password-reset/complete' && request.method === 'POST') {
        if (!await withinRateLimit(request, env.RESET_RATE_LIMITER, 'admin-reset-complete')) return rateLimited(origin);
        return resetAdminPassword(request, env, origin);
      }
      if (path === '/auth/logout' && request.method === 'POST') {
        const session = await requireAuth(request, env);
        if (session) await env.DB.prepare('DELETE FROM sessions WHERE token_hash = ?').bind(await hash(cookies(request).pt_session)).run();
        return noContent(204, origin, { 'Set-Cookie': [cookie('pt_session', '', 0, true), cookie('pt_csrf', '', 0, false)] });
      }
      if (path === '/auth/me' && request.method === 'GET') {
        const session = await auth(request, env);
        if (!session) return json({ authenticated: false }, 200, origin);
        const csrf = randomToken(24);
        await env.DB.prepare('UPDATE sessions SET csrf_hash = ? WHERE token_hash = ?').bind(await hash(csrf), session.token_hash).run();
        return json({ authenticated: true, user: { memberNumber: session.member_number, firstName: session.firstName || 'Club', lastName: session.lastName || 'Management', email: session.adminEmail || undefined }, club: sessionClub(session), role: session.role, csrfToken: csrf }, 200, origin, { 'Set-Cookie': cookie('pt_csrf', csrf, SESSION_MAX_AGE, false) });
      }
      if (path === '/bootstrap' && request.method === 'GET') {
        const data = await bootstrap(request, env);
        return data ? json(data, 200, origin) : json({ error: 'Unauthorized.' }, 401, origin);
      }

      if (path === '/account' && request.method === 'DELETE') {
        const session = await requireAuth(request, env);
        if (!session) return json({ error: 'Unauthorized.' }, 401, origin);
        if (session.role === 'admin') {
          const admins = Number((await env.DB.prepare("SELECT COUNT(*) AS count FROM club_admins WHERE club_id = ? AND status = 'active'").bind(session.club_id).first())?.count || 0);
          if (admins <= 1) return json({ error: 'The only organization owner cannot delete just their account. Delete the organization workspace instead.', code: 'SOLE_OWNER' }, 409, origin);
          const adminId = session.member_number.replace(/^admin:/, '');
          await env.DB.batch([
            env.DB.prepare('DELETE FROM sessions WHERE club_id = ? AND member_number = ?').bind(session.club_id, session.member_number),
            env.DB.prepare('DELETE FROM admin_password_resets WHERE club_id = ? AND admin_id = ?').bind(session.club_id, adminId),
            env.DB.prepare('DELETE FROM club_admins WHERE club_id = ? AND id = ?').bind(session.club_id, adminId)
          ]);
        } else {
          const photos = await env.DB.prepare('SELECT id, object_key FROM photos WHERE club_id = ? AND uploader_id = ?').bind(session.club_id, session.member_number).all();
          await Promise.all(photos.results.filter(photo => photo.object_key).map(photo => env.PHOTOS.delete(photo.object_key)));
          await env.DB.batch([
            env.DB.prepare('DELETE FROM photo_likes WHERE club_id = ? AND (member_number = ? OR photo_id IN (SELECT id FROM photos WHERE club_id = ? AND uploader_id = ?))').bind(session.club_id, session.member_number, session.club_id, session.member_number),
            env.DB.prepare('DELETE FROM photos WHERE club_id = ? AND uploader_id = ?').bind(session.club_id, session.member_number),
            env.DB.prepare('DELETE FROM sessions WHERE club_id = ? AND member_number = ?').bind(session.club_id, session.member_number),
            env.DB.prepare('DELETE FROM password_resets WHERE club_id = ? AND member_number = ?').bind(session.club_id, session.member_number),
            env.DB.prepare('DELETE FROM registration_challenges WHERE club_id = ? AND member_number = ?').bind(session.club_id, session.member_number),
            env.DB.prepare('DELETE FROM members WHERE club_id = ? AND member_number = ?').bind(session.club_id, session.member_number)
          ]);
        }
        return noContent(204, origin, { 'Set-Cookie': [cookie('pt_session', '', 0, true), cookie('pt_csrf', '', 0, false)] });
      }

      if (path === '/organization' && request.method === 'DELETE') {
        const session = await requireAuth(request, env, 'admin');
        if (!session) return json({ error: 'Forbidden.' }, 403, origin);
        const adminId = session.member_number.replace(/^admin:/, '');
        const owner = await env.DB.prepare("SELECT role FROM club_admins WHERE club_id = ? AND id = ? AND status = 'active'").bind(session.club_id, adminId).first();
        if (owner?.role !== 'owner') return json({ error: 'Only the organization owner can delete this workspace.' }, 403, origin);
        const body = await request.json().catch(() => ({}));
        const club = await env.DB.prepare('SELECT name FROM clubs WHERE id = ?').bind(session.club_id).first();
        if (!club || String(body.confirmName || '').trim() !== club.name) return json({ error: 'Enter the exact organization name to confirm deletion.' }, 400, origin);
        const photos = await env.DB.prepare('SELECT object_key FROM photos WHERE club_id = ?').bind(session.club_id).all();
        await Promise.all(photos.results.filter(photo => photo.object_key).map(photo => env.PHOTOS.delete(photo.object_key)));
        await env.DB.batch([
          env.DB.prepare('DELETE FROM photo_likes WHERE club_id = ?').bind(session.club_id),
          env.DB.prepare('DELETE FROM photos WHERE club_id = ?').bind(session.club_id),
          env.DB.prepare('DELETE FROM sessions WHERE club_id = ?').bind(session.club_id),
          env.DB.prepare('DELETE FROM password_resets WHERE club_id = ?').bind(session.club_id),
          env.DB.prepare('DELETE FROM registration_challenges WHERE club_id = ?').bind(session.club_id),
          env.DB.prepare('DELETE FROM admin_password_resets WHERE club_id = ?').bind(session.club_id),
          env.DB.prepare('DELETE FROM members WHERE club_id = ?').bind(session.club_id),
          env.DB.prepare('DELETE FROM club_admins WHERE club_id = ?').bind(session.club_id),
          env.DB.prepare('DELETE FROM club_signup_challenges WHERE club_slug = ?').bind(session.club_id),
          env.DB.prepare('DELETE FROM clubs WHERE id = ?').bind(session.club_id)
        ]);
        return noContent(204, origin, { 'Set-Cookie': [cookie('pt_session', '', 0, true), cookie('pt_csrf', '', 0, false)] });
      }

      if (path === '/clubs/current' && request.method === 'PATCH') {
        const session = await requireAuth(request, env, 'admin');
        if (!session) return json({ error: 'Forbidden.' }, 403, origin);
        if (!await requireWritableClub(env, session)) return readOnly(origin);
        const body = await request.json();
        const name = cleanText(body.name, 80);
        const shortName = cleanText(body.shortName || name, 40);
        const logoUrl = secureLogoUrl(body.logoUrl);
        if (name.length < 2 || shortName.length < 2 || logoUrl === null) return json({ error: 'Enter a valid club name. Logo URLs must use HTTPS.' }, 400, origin);
        await env.DB.prepare('UPDATE clubs SET name = ?, short_name = ?, logo_url = ? WHERE id = ?').bind(name, shortName, logoUrl, session.club_id).run();
        return json(accountClub(await getClub(env, session.club_id)), 200, origin);
      }
      if (path === '/members' && request.method === 'POST') {
        const session = await requireAuth(request, env, 'admin');
        if (!session) return json({ error: 'Forbidden.' }, 403, origin);
        if (!await requireWritableClub(env, session)) return readOnly(origin);
        const member = await request.json();
        if (!member.memberNumber || !member.lastName || !member.firstName || !validEmail(member.email)) return json({ error: 'Member number, name, and a valid roster email are required.' }, 400, origin);
        const memberNumber = normalizeMemberNumber(member.memberNumber);
        if (await env.DB.prepare('SELECT 1 FROM members WHERE club_id = ? AND member_number = ? COLLATE NOCASE').bind(session.club_id, memberNumber).first()) return json({ error: 'That member number already exists.' }, 409, origin);
        await env.DB.prepare('INSERT INTO members (club_id, member_number, last_name, first_name, email) VALUES (?, ?, ?, ?, ?)').bind(session.club_id, memberNumber, String(member.lastName).trim(), String(member.firstName).trim(), normalize(member.email)).run();
        return json(publicMember({ ...member, memberNumber, email: normalize(member.email), registeredAt: '', role: 'member' }), 201, origin);
      }
      const passwordMatch = path.match(/^\/members\/([^/]+)\/password$/);
      if (passwordMatch && request.method === 'PATCH') {
        const session = await requireAuth(request, env);
        const memberNumber = decodeURIComponent(passwordMatch[1]);
        if (!session || (session.role !== 'admin' && !sameMemberNumber(session.member_number, memberNumber))) return json({ error: 'Forbidden.' }, 403, origin);
        const { password } = await request.json();
        if (typeof password !== 'string' || password.length < 10) return json({ error: 'Password must be at least 10 characters.' }, 400, origin);
        const salt = randomToken(16);
        await env.DB.prepare('UPDATE members SET password = \'\', password_hash = ?, password_salt = ?, registered_at = ? WHERE club_id = ? AND member_number = ? COLLATE NOCASE').bind(await derivePassword(password, salt), salt, new Date().toISOString(), session.club_id, memberNumber).run();
        return json({ ok: true }, 200, origin);
      }
      const memberMatch = path.match(/^\/members\/([^/]+)$/);
      if (memberMatch && request.method === 'PATCH') {
        const session = await requireAuth(request, env, 'admin');
        if (!session) return json({ error: 'Forbidden.' }, 403, origin);
        if (!await requireWritableClub(env, session)) return readOnly(origin);
        const body = await request.json();
        if (!validEmail(body.email)) return json({ error: 'Enter a valid roster email.' }, 400, origin);
        const memberNumber = decodeURIComponent(memberMatch[1]);
        const result = await env.DB.prepare('UPDATE members SET email = ? WHERE club_id = ? AND member_number = ? COLLATE NOCASE').bind(normalize(body.email), session.club_id, memberNumber).run();
        if (!result.meta.changes) return json({ error: 'Member not found.' }, 404, origin);
        const member = await env.DB.prepare('SELECT member_number AS memberNumber, last_name AS lastName, first_name AS firstName, email, registered_at AS registeredAt, role FROM members WHERE club_id = ? AND member_number = ? COLLATE NOCASE').bind(session.club_id, memberNumber).first();
        return json(publicMember(member), 200, origin);
      }
      if (memberMatch && request.method === 'DELETE') {
        const session = await requireAuth(request, env, 'admin');
        if (!session) return json({ error: 'Forbidden.' }, 403, origin);
        if (!await requireWritableClub(env, session)) return readOnly(origin);
        const memberNumber = decodeURIComponent(memberMatch[1]);
        await env.DB.batch([
          env.DB.prepare('DELETE FROM photo_likes WHERE club_id = ? AND member_number = ? COLLATE NOCASE').bind(session.club_id, memberNumber),
          env.DB.prepare('DELETE FROM sessions WHERE club_id = ? AND member_number = ? COLLATE NOCASE').bind(session.club_id, memberNumber),
          env.DB.prepare('DELETE FROM password_resets WHERE club_id = ? AND member_number = ? COLLATE NOCASE').bind(session.club_id, memberNumber),
          env.DB.prepare('DELETE FROM registration_challenges WHERE club_id = ? AND member_number = ? COLLATE NOCASE').bind(session.club_id, memberNumber),
          env.DB.prepare('DELETE FROM members WHERE club_id = ? AND member_number = ? COLLATE NOCASE').bind(session.club_id, memberNumber)
        ]);
        return noContent(204, origin);
      }

      if (path === '/photos' && request.method === 'POST') {
        const session = await requireAuth(request, env);
        if (!session) return json({ error: 'Unauthorized.' }, 401, origin);
        if (!await requireWritableClub(env, session)) return readOnly(origin);
        const photoId = String(url.searchParams.get('id') || '').trim();
        const caption = String(url.searchParams.get('caption') || '').trim().slice(0, 500);
        const category = String(url.searchParams.get('category') || '').trim();
        const createdAt = String(url.searchParams.get('createdAt') || '').trim();
        const contentType = String(request.headers.get('Content-Type') || '').split(';')[0].toLowerCase();
        const declaredLength = Number(request.headers.get('Content-Length') || 0);
        if (!/^[a-zA-Z0-9_-]{8,100}$/.test(photoId)) return json({ error: 'Invalid photo identifier.' }, 400, origin);
        if (!PHOTO_CATEGORIES.has(category)) return json({ error: 'Invalid photo category.' }, 400, origin);
        if (!ALLOWED_PHOTO_TYPES.has(contentType)) return json({ error: 'Only JPEG, PNG, and WebP photos are accepted.' }, 415, origin);
        if (!request.body) return json({ error: 'Photo file is required.' }, 400, origin);
        if (declaredLength > MAX_PHOTO_BYTES) return json({ error: 'Photo exceeds the 8 MB limit.' }, 413, origin);
        const extension = contentType === 'image/png' ? 'png' : contentType === 'image/webp' ? 'webp' : 'jpg';
        const objectKey = `hub_photos/${session.club_id}/${session.member_number}/${photoId}.${extension}`;
        const stored = await env.PHOTOS.put(objectKey, request.body, { httpMetadata: { contentType } });
        if (stored.size > MAX_PHOTO_BYTES) { await env.PHOTOS.delete(objectKey); return json({ error: 'Photo exceeds the 8 MB limit.' }, 413, origin); }
        const clubPlan = await env.DB.prepare('SELECT storage_limit_bytes FROM clubs WHERE id = ?').bind(session.club_id).first();
        const currentStorage = Number((await env.DB.prepare('SELECT COALESCE(SUM(byte_size), 0) AS total FROM photos WHERE club_id = ?').bind(session.club_id).first())?.total || 0);
        if (currentStorage + stored.size > Number(clubPlan?.storage_limit_bytes || 26843545600)) {
          await env.PHOTOS.delete(objectKey);
          return json({ error: 'This workspace has reached its photo storage limit. Contact the organization administrator.', code: 'STORAGE_LIMIT_REACHED' }, 413, origin);
        }
        const fallbackCaption = `${category} scene at the club`;
        try {
          await env.DB.prepare('INSERT INTO photos (id, club_id, object_key, caption, category, uploader_name, uploader_id, created_at, hearts, byte_size) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?)').bind(photoId, session.club_id, objectKey, caption || fallbackCaption, category, `${session.firstName || ''} ${session.lastName || ''}`.trim(), session.member_number, createdAt || new Date().toISOString(), stored.size).run();
        } catch (error) { await env.PHOTOS.delete(objectKey); throw error; }
        return json({ id: photoId, url: `/api/photos/${encodeURIComponent(photoId)}/file`, downloadUrl: `/api/photos/${encodeURIComponent(photoId)}/file?download=1`, fileName: objectKey, caption: caption || fallbackCaption, category, uploaderName: `${session.firstName || ''} ${session.lastName || ''}`.trim(), uploaderId: session.member_number, createdAt: createdAt || new Date().toISOString(), hearts: 0, heartUsers: [] }, 201, origin);
      }
      const fileMatch = path.match(/^\/photos\/([^/]+)\/file$/);
      if (fileMatch && request.method === 'GET') {
        const session = await auth(request, env);
        if (!session) return new Response('Unauthorized', { status: 401 });
        const photoId = decodeURIComponent(fileMatch[1]);
        const photo = await env.DB.prepare('SELECT object_key, external_url FROM photos WHERE club_id = ? AND id = ?').bind(session.club_id, photoId).first();
        if (!photo) return new Response('Not found', { status: 404 });
        let body;
        let contentType = 'image/jpeg';
        if (photo.object_key) {
          const object = await env.PHOTOS.get(photo.object_key);
          if (!object) return new Response('Not found', { status: 404 });
          body = object.body; contentType = object.httpMetadata?.contentType || contentType;
        } else if (photo.external_url) {
          const externalUrl = trustedExternalPhoto(photo.external_url, env);
          if (!externalUrl) return new Response('Not found', { status: 404 });
          const upstream = await fetch(externalUrl, { redirect: 'error' });
          if (!upstream.ok || !upstream.body) return new Response('Not found', { status: 404 });
          body = upstream.body; contentType = upstream.headers.get('Content-Type') || contentType;
        } else return new Response('Not found', { status: 404 });
        const headers = responseHeaders(origin, { 'Content-Type': contentType, 'Cache-Control': 'private, max-age=3600' });
        if (url.searchParams.get('download') === '1') headers.set('Content-Disposition', `attachment; filename="club-photohub-${photoId.replace(/[^a-zA-Z0-9_-]/g, '-')}.jpg"`);
        return new Response(body, { headers });
      }
      const heartMatch = path.match(/^\/photos\/([^/]+)\/heart$/);
      if (heartMatch && request.method === 'POST') {
        const session = await requireAuth(request, env);
        if (!session) return json({ error: 'Unauthorized.' }, 401, origin);
        if (!await requireWritableClub(env, session)) return readOnly(origin);
        const photoId = decodeURIComponent(heartMatch[1]);
        if (!await env.DB.prepare('SELECT 1 FROM photos WHERE club_id = ? AND id = ?').bind(session.club_id, photoId).first()) return json({ error: 'Not found.' }, 404, origin);
        const existing = await env.DB.prepare('SELECT 1 FROM photo_likes WHERE club_id = ? AND photo_id = ? AND member_number = ?').bind(session.club_id, photoId, session.member_number).first();
        if (existing) await env.DB.prepare('DELETE FROM photo_likes WHERE club_id = ? AND photo_id = ? AND member_number = ?').bind(session.club_id, photoId, session.member_number).run();
        else await env.DB.prepare('INSERT INTO photo_likes (club_id, photo_id, member_number) VALUES (?, ?, ?)').bind(session.club_id, photoId, session.member_number).run();
        const likes = await env.DB.prepare('SELECT member_number FROM photo_likes WHERE club_id = ? AND photo_id = ? ORDER BY member_number').bind(session.club_id, photoId).all();
        await env.DB.prepare('UPDATE photos SET hearts = ? WHERE club_id = ? AND id = ?').bind(likes.results.length, session.club_id, photoId).run();
        return json({ hearts: likes.results.length, heartUsers: likes.results.map(like => like.member_number) }, 200, origin);
      }
      const photoMatch = path.match(/^\/photos\/([^/]+)$/);
      if (photoMatch && request.method === 'PATCH') {
        const session = await requireAuth(request, env, 'admin');
        if (!session) return json({ error: 'Forbidden.' }, 403, origin);
        if (!await requireWritableClub(env, session)) return readOnly(origin);
        const photoId = decodeURIComponent(photoMatch[1]);
        const body = await request.json();
        const caption = String(body.caption || '').trim().slice(0, 500);
        const category = String(body.category || '').trim();
        if (!caption) return json({ error: 'Caption cannot be empty.' }, 400, origin);
        if (!PHOTO_CATEGORIES.has(category)) return json({ error: 'Invalid photo category.' }, 400, origin);
        const result = await env.DB.prepare('UPDATE photos SET caption = ?, category = ? WHERE club_id = ? AND id = ?').bind(caption, category, session.club_id, photoId).run();
        if (!result.meta.changes) return json({ error: 'Photo not found.' }, 404, origin);
        const photo = await env.DB.prepare('SELECT * FROM photos WHERE club_id = ? AND id = ?').bind(session.club_id, photoId).first();
        return json({ id: photo.id, url: photoUrl(photo), downloadUrl: photoDownloadUrl(photo), fileName: photo.object_key || undefined, caption: photo.caption, category: photo.category, uploaderName: photo.uploader_name, uploaderId: photo.uploader_id, createdAt: photo.created_at, hearts: photo.hearts || 0, heartUsers: [] }, 200, origin);
      }
      if (photoMatch && request.method === 'DELETE') {
        const session = await requireAuth(request, env);
        if (!session) return json({ error: 'Forbidden.' }, 403, origin);
        if (!await requireWritableClub(env, session)) return readOnly(origin);
        const photoId = decodeURIComponent(photoMatch[1]);
        const photo = await env.DB.prepare('SELECT object_key, uploader_id FROM photos WHERE club_id = ? AND id = ?').bind(session.club_id, photoId).first();
        if (!photo || (session.role !== 'admin' && session.member_number !== photo.uploader_id)) return json({ error: 'Forbidden.' }, 403, origin);
        if (photo.object_key) await env.PHOTOS.delete(photo.object_key);
        await env.DB.batch([
          env.DB.prepare('DELETE FROM photo_likes WHERE club_id = ? AND photo_id = ?').bind(session.club_id, photoId),
          env.DB.prepare('DELETE FROM photos WHERE club_id = ? AND id = ?').bind(session.club_id, photoId)
        ]);
        return noContent(204, origin);
      }
      if (path === '/reset' && request.method === 'POST') {
        const session = await requireAuth(request, env, 'admin');
        if (!session) return json({ error: 'Forbidden.' }, 403, origin);
        if (!await requireWritableClub(env, session)) return readOnly(origin);
        await env.DB.batch([
          env.DB.prepare('DELETE FROM photo_likes WHERE club_id = ?').bind(session.club_id),
          env.DB.prepare('DELETE FROM photos WHERE club_id = ?').bind(session.club_id),
          env.DB.prepare('DELETE FROM members WHERE club_id = ?').bind(session.club_id)
        ]);
        return json({ ok: true }, 200, origin);
      }
      return json({ error: 'Not found' }, 404, origin);
    } catch (error) {
      console.error(error);
      const status = String(error.message || '').includes('UNIQUE constraint') ? 409 : 500;
      return json({ error: status === 409 ? 'That record already exists.' : 'Unexpected server error.' }, status, origin);
    }
  }
};
