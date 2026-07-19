const SESSION_MAX_AGE = 60 * 60 * 24 * 7;
const encoder = new TextEncoder();

const seedMembers = [
  ['1001', 'Smith', 'John'], ['1002', 'Jenkins', 'Sarah'], ['1003', 'Davis', 'Robert'],
  ['1004', 'Thompson', 'Emily'], ['1005', 'Wilson', 'David']
];

const seedPhotos = [
  ['seed-1', 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?q=80&w=1200&auto=format&fit=crop', 'Perfect morning for a round on the 18th green.', 'Golf', 'Club Management', 'admin', 14],
  ['seed-2', 'https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?q=80&w=1200&auto=format&fit=crop', 'Action-packed mixed doubles finals under the sun!', 'Tennis', 'Sarah Jenkins', '1002', 28],
  ['seed-3', 'https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?q=80&w=1200&auto=format&fit=crop', 'Lovely summer patio dining experience at the Bistro.', 'Dining', 'John Smith', '1001', 9],
  ['seed-4', 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?q=80&w=1200&auto=format&fit=crop', 'Annual Oakville Gala reception looking spectacular.', 'Events', 'Club Management', 'admin', 35],
  ['seed-5', 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?q=80&w=1200&auto=format&fit=crop', 'Sunset reflecting on the harbor from the clubhouse lounge.', 'Clubhouse', 'Robert Davis', '1003', 19]
];

const b64 = bytes => btoa(String.fromCharCode(...new Uint8Array(bytes))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const randomToken = (size = 32) => b64(crypto.getRandomValues(new Uint8Array(size)));
const hash = async value => b64(await crypto.subtle.digest('SHA-256', encoder.encode(value)));

const derivePassword = async (password, salt) => {
  const key = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, ['deriveBits']);
  // Cloudflare Workers supports PBKDF2-SHA-256 up to 100,000 iterations.
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt: encoder.encode(salt), iterations: 100000, hash: 'SHA-256' }, key, 256);
  return b64(bits);
};

const validEmail = email => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || '').trim());

const safeEqual = async (left, right) => hash(left).then(a => hash(right).then(b => a === b));

const originFor = (request, env) => {
  const requestOrigin = request.headers.get('Origin');
  const allowedOrigins = String(env.ALLOWED_ORIGIN || '').split(',').map(value => value.trim()).filter(Boolean);
  if (!requestOrigin) return allowedOrigins[0] || '*';
  return allowedOrigins.length === 0 || allowedOrigins.includes(requestOrigin) ? requestOrigin : allowedOrigins[0];
};
const headersFor = (origin, extra = {}) => ({
  'Content-Type': 'application/json; charset=utf-8',
  'Access-Control-Allow-Origin': origin,
  'Access-Control-Allow-Credentials': 'true',
  'Access-Control-Allow-Headers': 'Content-Type, X-CSRF-Token',
  'Access-Control-Allow-Methods': 'GET,POST,PATCH,DELETE,OPTIONS',
  'Cache-Control': 'no-store',
  ...extra
});
const responseHeaders = (origin, extra = {}) => {
  const headers = new Headers(headersFor(origin));
  for (const [name, value] of Object.entries(extra)) {
    if (name.toLowerCase() === 'set-cookie' && Array.isArray(value)) value.forEach(cookieValue => headers.append('Set-Cookie', cookieValue));
    else headers.set(name, value);
  }
  return headers;
};
const json = (body, status, origin, extra) => new Response(JSON.stringify(body), { status: status || 200, headers: responseHeaders(origin, extra) });
const noContent = (status, origin, extra) => new Response(null, { status: status || 204, headers: responseHeaders(origin, extra) });

const cookies = request => Object.fromEntries((request.headers.get('Cookie') || '').split(';').map(part => part.trim().split('=').map(decodeURIComponent)).filter(pair => pair.length === 2));
const cookie = (name, value, maxAge, httpOnly) => `${name}=${encodeURIComponent(value)}; Path=/; Max-Age=${maxAge}; Secure; SameSite=None${httpOnly ? '; HttpOnly' : ''}`;

async function auth(request, env) {
  const token = cookies(request).pt_session;
  if (!token) return null;
  const session = await env.DB.prepare('SELECT s.*, m.first_name AS firstName, m.last_name AS lastName FROM sessions s LEFT JOIN members m ON m.member_number = s.member_number WHERE s.token_hash = ? AND s.expires_at > ?').bind(await hash(token), Date.now()).first();
  return session || null;
}

async function requireAuth(request, env, role) {
  const session = await auth(request, env);
  if (!session || (role && session.role !== role)) return null;
  const csrf = request.headers.get('X-CSRF-Token');
  if (!csrf || (await hash(csrf)) !== session.csrf_hash) return null;
  return session;
}

const decodeDataUrl = dataUrl => {
  const match = /^data:([^;]+);base64,(.+)$/.exec(dataUrl || '');
  if (!match) throw new Error('Photo must be a base64 data URL.');
  return { contentType: match[1], bytes: Uint8Array.from(atob(match[2]), char => char.charCodeAt(0)) };
};

const photoUrl = (request, photo) => photo.external_url || `${new URL(request.url).origin}/api/photos/${encodeURIComponent(photo.id)}/file`;
const photoDownloadUrl = (request, photo) => `${new URL(request.url).origin}/api/photos/${encodeURIComponent(photo.id)}/file?download=1`;
const publicMember = member => ({ memberNumber: member.memberNumber, lastName: member.lastName, firstName: member.firstName, registeredAt: member.registeredAt, role: member.role });

async function seed(env) {
  for (const [memberNumber, lastName, firstName] of seedMembers) {
    await env.DB.prepare('INSERT OR IGNORE INTO members (member_number, last_name, first_name) VALUES (?, ?, ?)').bind(memberNumber, lastName, firstName).run();
  }
  for (let i = 0; i < seedPhotos.length; i += 1) {
    const [id, externalUrl, caption, category, uploaderName, uploaderId, hearts] = seedPhotos[i];
    await env.DB.prepare('INSERT OR IGNORE INTO photos (id, external_url, caption, category, uploader_name, uploader_id, created_at, hearts) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
      .bind(id, externalUrl, caption, category, uploaderName, uploaderId, new Date(Date.now() - (seedPhotos.length - i) * 86400000).toISOString(), hearts).run();
  }
}

async function bootstrap(request, env) {
  const session = await auth(request, env);
  const [membersResult, photosResult] = await Promise.all([
    session?.role === 'admin' ? env.DB.prepare('SELECT member_number AS memberNumber, last_name AS lastName, first_name AS firstName, registered_at AS registeredAt, role FROM members ORDER BY member_number').all() : Promise.resolve({ results: [] }),
    env.DB.prepare('SELECT * FROM photos ORDER BY created_at DESC').all()
  ]);
  if (photosResult.results.length === 0 && membersResult.results.length === 0) {
    await seed(env);
    return bootstrap(request, env);
  }
  const photos = [];
  for (const photo of photosResult.results) {
    const likes = await env.DB.prepare('SELECT member_number FROM photo_likes WHERE photo_id = ? ORDER BY member_number').bind(photo.id).all();
    photos.push({ id: photo.id, url: photoUrl(request, photo), downloadUrl: photoDownloadUrl(request, photo), fileName: photo.object_key || undefined, caption: photo.caption, category: photo.category, uploaderName: photo.uploader_name, uploaderId: photo.uploader_id, createdAt: photo.created_at, hearts: photo.hearts, heartUsers: likes.results.map(like => like.member_number) });
  }
  return { members: membersResult.results, photos };
}

async function login(request, env, origin) {
  const body = await request.json();
  let memberNumber;
  let user;
  let role;
  if (body.mode === 'admin') {
    if (!env.ADMIN_EMAIL || !env.ADMIN_PASSWORD || body.email !== env.ADMIN_EMAIL || !(await safeEqual(body.password || '', env.ADMIN_PASSWORD))) return json({ error: 'Invalid credentials.' }, 401, origin);
    memberNumber = 'admin';
    user = { memberNumber: 'admin', firstName: 'Club', lastName: 'Management', email: env.ADMIN_EMAIL };
    role = 'admin';
  } else {
    const member = await env.DB.prepare('SELECT * FROM members WHERE member_number = ?').bind(String(body.memberNumber || '').trim()).first();
    const suppliedLastName = String(body.lastName || '').trim().toLowerCase();
    const storedLastName = String(member?.last_name || '').trim().toLowerCase();
    if (member && suppliedLastName === storedLastName && !member.password_hash) return json({ error: 'Complete your first-time registration.', code: 'NEEDS_REGISTRATION' }, 403, origin);
    if (!member || !suppliedLastName || suppliedLastName !== storedLastName || !member.password_hash || !(await safeEqual(await derivePassword(body.password || '', member.password_salt), member.password_hash))) return json({ error: 'Invalid credentials.' }, 401, origin);
    memberNumber = member.member_number;
    user = { memberNumber, firstName: member.first_name, lastName: member.last_name };
    role = member.role || 'member';
  }
  const token = randomToken();
  const csrf = randomToken(24);
  await env.DB.prepare('INSERT INTO sessions (token_hash, member_number, role, csrf_hash, expires_at) VALUES (?, ?, ?, ?, ?)').bind(await hash(token), memberNumber, role, await hash(csrf), Date.now() + SESSION_MAX_AGE * 1000).run();
  return json({ user, role, csrfToken: csrf }, 200, origin, { 'Set-Cookie': [cookie('pt_session', token, SESSION_MAX_AGE, true), cookie('pt_csrf', csrf, SESSION_MAX_AGE, false)] });
}

async function registerMember(request, env, origin) {
  const body = await request.json();
  const memberNumber = String(body.memberNumber || '').trim();
  const suppliedLastName = String(body.lastName || '').trim().toLowerCase();
  const member = await env.DB.prepare('SELECT * FROM members WHERE member_number = ?').bind(memberNumber).first();
  if (!member || String(member.last_name).trim().toLowerCase() !== suppliedLastName || member.password_hash) return json({ error: 'Registration could not be completed.' }, 400, origin);
  if (!validEmail(body.email) || typeof body.password !== 'string' || body.password.length < 10) return json({ error: 'Provide a valid email and a password of at least 10 characters.' }, 400, origin);
  const salt = randomToken(16);
  await env.DB.prepare('UPDATE members SET email = ?, password = \'\', password_hash = ?, password_salt = ?, registered_at = ? WHERE member_number = ?')
    .bind(String(body.email).trim().toLowerCase(), await derivePassword(body.password, salt), salt, new Date().toISOString(), memberNumber).run();
  const token = randomToken();
  const csrf = randomToken(24);
  await env.DB.prepare('INSERT INTO sessions (token_hash, member_number, role, csrf_hash, expires_at) VALUES (?, ?, ?, ?, ?)').bind(await hash(token), memberNumber, member.role || 'member', await hash(csrf), Date.now() + SESSION_MAX_AGE * 1000).run();
  return json({ user: { memberNumber, firstName: member.first_name, lastName: member.last_name }, role: member.role || 'member', csrfToken: csrf }, 201, origin, { 'Set-Cookie': [cookie('pt_session', token, SESSION_MAX_AGE, true), cookie('pt_csrf', csrf, SESSION_MAX_AGE, false)] });
}

async function requestPasswordReset(request, env, origin) {
  const body = await request.json();
  const memberNumber = String(body.memberNumber || '').trim();
  const lastName = String(body.lastName || '').trim().toLowerCase();
  const member = await env.DB.prepare('SELECT member_number, last_name, email FROM members WHERE member_number = ?').bind(memberNumber).first();
  if (member && String(member.last_name).trim().toLowerCase() === lastName && validEmail(member.email) && env.MAILERSEND_API_TOKEN && env.MAIL_FROM) {
    const rawToken = randomToken(32);
    await env.DB.prepare('DELETE FROM password_resets WHERE member_number = ?').bind(member.member_number).run();
    await env.DB.prepare('INSERT INTO password_resets (token_hash, member_number, expires_at) VALUES (?, ?, ?)').bind(await hash(rawToken), member.member_number, Date.now() + 30 * 60 * 1000).run();
    const resetUrl = `${env.APP_ORIGIN || 'https://ocphotohub.netlify.app'}?reset=${encodeURIComponent(rawToken)}`;
    await fetch('https://api.mailersend.com/v1/email', { method: 'POST', headers: { Authorization: `Bearer ${env.MAILERSEND_API_TOKEN}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ from: { email: env.MAIL_FROM, name: 'PicTide' }, to: [{ email: member.email }], subject: 'Reset your PicTide password', text: `Use this link to reset your PicTide password. It expires in 30 minutes and can only be used once: ${resetUrl}`, html: `<p>Use this link to reset your PicTide password. It expires in 30 minutes and can only be used once.</p><p><a href="${resetUrl}">Reset password</a></p>` }) });
  }
  return json({ message: 'If the membership details and email are registered, a reset link will be sent.' }, 200, origin);
}

async function resetPassword(request, env, origin) {
  const body = await request.json();
  if (typeof body.password !== 'string' || body.password.length < 10 || !body.token) return json({ error: 'Invalid reset request.' }, 400, origin);
  const reset = await env.DB.prepare('SELECT * FROM password_resets WHERE token_hash = ? AND used_at IS NULL AND expires_at > ?').bind(await hash(body.token), Date.now()).first();
  if (!reset) return json({ error: 'Invalid or expired reset link.' }, 400, origin);
  const salt = randomToken(16);
  await env.DB.prepare('UPDATE members SET password = \'\', password_hash = ?, password_salt = ?, registered_at = ? WHERE member_number = ?').bind(await derivePassword(body.password, salt), salt, new Date().toISOString(), reset.member_number).run();
  await env.DB.prepare('UPDATE password_resets SET used_at = ? WHERE token_hash = ?').bind(Date.now(), reset.token_hash).run();
  await env.DB.prepare('DELETE FROM sessions WHERE member_number = ?').bind(reset.member_number).run();
  return json({ ok: true }, 200, origin);
}

export default {
  async fetch(request, env) {
    const origin = originFor(request, env);
    if (request.method === 'OPTIONS') return noContent(204, origin);
    try {
      const url = new URL(request.url);
      const path = url.pathname.replace(/^\/api/, '').replace(/\/$/, '') || '/';
      if (path === '/health' && request.method === 'GET') return json({ ok: true }, 200, origin);
      if (path === '/auth/login' && request.method === 'POST') return login(request, env, origin);
      if (path === '/auth/member-check' && request.method === 'POST') {
        const body = await request.json();
        const member = await env.DB.prepare('SELECT last_name, password_hash FROM members WHERE member_number = ?').bind(String(body.memberNumber || '').trim()).first();
        if (!member || String(member.last_name).trim().toLowerCase() !== String(body.lastName || '').trim().toLowerCase()) return json({ error: 'Invalid membership details.' }, 400, origin);
        return json({ registered: Boolean(member.password_hash) }, 200, origin);
      }
      if (path === '/auth/register' && request.method === 'POST') return registerMember(request, env, origin);
      if (path === '/auth/password-reset/request' && request.method === 'POST') return requestPasswordReset(request, env, origin);
      if (path === '/auth/password-reset/complete' && request.method === 'POST') return resetPassword(request, env, origin);
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
        return json({ authenticated: true, user: { memberNumber: session.member_number, firstName: session.firstName || 'Club', lastName: session.lastName || 'Management' }, role: session.role, csrfToken: csrf }, 200, origin, { 'Set-Cookie': cookie('pt_csrf', csrf, SESSION_MAX_AGE, false) });
      }
      if (path === '/bootstrap' && request.method === 'GET') {
        if (!await auth(request, env)) return json({ error: 'Unauthorized.' }, 401, origin);
        return json(await bootstrap(request, env), 200, origin);
      }

      if (path === '/members' && request.method === 'POST') {
        if (!await requireAuth(request, env, 'admin')) return json({ error: 'Forbidden.' }, 403, origin);
        const member = await request.json();
        await env.DB.prepare('INSERT INTO members (member_number, last_name, first_name) VALUES (?, ?, ?)').bind(member.memberNumber, member.lastName, member.firstName).run();
        return json(publicMember({ memberNumber: member.memberNumber, lastName: member.lastName, firstName: member.firstName, registeredAt: '', role: 'member' }), 201, origin);
      }
      const passwordMatch = path.match(/^\/members\/([^/]+)\/password$/);
      if (passwordMatch && request.method === 'PATCH') {
        const session = await requireAuth(request, env);
        const memberNumber = decodeURIComponent(passwordMatch[1]);
        if (!session || (session.role !== 'admin' && session.member_number !== memberNumber)) return json({ error: 'Forbidden.' }, 403, origin);
        const { password } = await request.json();
        if (typeof password !== 'string' || password.length < 10) return json({ error: 'Password must be at least 10 characters.' }, 400, origin);
        const salt = randomToken(16);
        await env.DB.prepare('UPDATE members SET password = \'\', password_hash = ?, password_salt = ?, registered_at = ? WHERE member_number = ?').bind(await derivePassword(password, salt), salt, new Date().toISOString(), memberNumber).run();
        return json({ ok: true }, 200, origin);
      }
      const memberMatch = path.match(/^\/members\/([^/]+)$/);
      if (memberMatch && request.method === 'DELETE') {
        if (!await requireAuth(request, env, 'admin')) return json({ error: 'Forbidden.' }, 403, origin);
        await env.DB.prepare('DELETE FROM members WHERE member_number = ?').bind(decodeURIComponent(memberMatch[1])).run();
        return noContent(204, origin);
      }

      if (path === '/photos' && request.method === 'POST') {
        const session = await requireAuth(request, env);
        if (!session) return json({ error: 'Unauthorized.' }, 401, origin);
        const photo = await request.json();
        const { contentType, bytes } = decodeDataUrl(photo.url);
        if (bytes.byteLength > 8 * 1024 * 1024) return json({ error: 'Photo exceeds the 8 MB limit.' }, 413, origin);
        const objectKey = `hub_photos/${session.member_number}/${photo.id}.jpg`;
        await env.PHOTOS.put(objectKey, bytes, { httpMetadata: { contentType } });
        await env.DB.prepare('INSERT INTO photos (id, object_key, caption, category, uploader_name, uploader_id, created_at, hearts) VALUES (?, ?, ?, ?, ?, ?, ?, 0)')
          .bind(photo.id, objectKey, String(photo.caption || '').slice(0, 500), photo.category, `${session.firstName || ''} ${session.lastName || ''}`.trim(), session.member_number, photo.createdAt).run();
        return json({ ...photo, url: `${new URL(request.url).origin}/api/photos/${encodeURIComponent(photo.id)}/file`, downloadUrl: `${new URL(request.url).origin}/api/photos/${encodeURIComponent(photo.id)}/file?download=1`, fileName: objectKey, uploaderId: session.member_number, hearts: 0, heartUsers: [] }, 201, origin);
      }
      const fileMatch = path.match(/^\/photos\/([^/]+)\/file$/);
      if (fileMatch && request.method === 'GET') {
        const photoId = decodeURIComponent(fileMatch[1]);
        const photo = await env.DB.prepare('SELECT object_key, external_url FROM photos WHERE id = ?').bind(photoId).first();
        if (!photo) return new Response('Not found', { status: 404 });
        if (!await auth(request, env)) return new Response('Unauthorized', { status: 401 });
        let body;
        let contentType = 'image/jpeg';
        if (photo.object_key) {
          const object = await env.PHOTOS.get(photo.object_key);
          if (!object) return new Response('Not found', { status: 404 });
          body = object.body;
          contentType = object.httpMetadata?.contentType || contentType;
        } else if (photo.external_url) {
          const upstream = await fetch(photo.external_url);
          if (!upstream.ok || !upstream.body) return new Response('Not found', { status: 404 });
          body = upstream.body;
          contentType = upstream.headers.get('Content-Type') || contentType;
        } else {
          return new Response('Not found', { status: 404 });
        }
        const headers = responseHeaders(origin, { 'Content-Type': contentType, 'Cache-Control': 'private, max-age=3600' });
        if (url.searchParams.get('download') === '1') {
          const safeId = photoId.replace(/[^a-zA-Z0-9_-]/g, '-');
          headers.set('Content-Disposition', `attachment; filename="pictide-${safeId}.jpg"`);
        }
        return new Response(body, { headers });
      }
      const heartMatch = path.match(/^\/photos\/([^/]+)\/heart$/);
      if (heartMatch && request.method === 'POST') {
        const session = await requireAuth(request, env);
        if (!session) return json({ error: 'Unauthorized.' }, 401, origin);
        const photoId = decodeURIComponent(heartMatch[1]);
        const existing = await env.DB.prepare('SELECT 1 FROM photo_likes WHERE photo_id = ? AND member_number = ?').bind(photoId, session.member_number).first();
        if (existing) await env.DB.prepare('DELETE FROM photo_likes WHERE photo_id = ? AND member_number = ?').bind(photoId, session.member_number).run();
        else await env.DB.prepare('INSERT INTO photo_likes (photo_id, member_number) VALUES (?, ?)').bind(photoId, session.member_number).run();
        const likes = await env.DB.prepare('SELECT member_number FROM photo_likes WHERE photo_id = ? ORDER BY member_number').bind(photoId).all();
        await env.DB.prepare('UPDATE photos SET hearts = ? WHERE id = ?').bind(likes.results.length, photoId).run();
        return json({ hearts: likes.results.length, heartUsers: likes.results.map(like => like.member_number) }, 200, origin);
      }
      const photoMatch = path.match(/^\/photos\/([^/]+)$/);
      if (photoMatch && request.method === 'DELETE') {
        const session = await requireAuth(request, env);
        const photoId = decodeURIComponent(photoMatch[1]);
        const photo = await env.DB.prepare('SELECT object_key, uploader_id FROM photos WHERE id = ?').bind(photoId).first();
        if (!session || !photo || (session.role !== 'admin' && session.member_number !== photo.uploader_id)) return json({ error: 'Forbidden.' }, 403, origin);
        if (photo.object_key) await env.PHOTOS.delete(photo.object_key);
        await env.DB.prepare('DELETE FROM photos WHERE id = ?').bind(photoId).run();
        return noContent(204, origin);
      }
      if (path === '/reset' && request.method === 'POST') {
        if (!await requireAuth(request, env, 'admin')) return json({ error: 'Forbidden.' }, 403, origin);
        await env.DB.batch([env.DB.prepare('DELETE FROM photo_likes'), env.DB.prepare('DELETE FROM photos'), env.DB.prepare('DELETE FROM members')]);
        await seed(env);
        return json({ ok: true }, 200, origin);
      }
      return json({ error: 'Not found' }, 404, origin);
    } catch (error) {
      console.error(error);
      return json({ error: error.message || 'Unexpected server error' }, 500, origin);
    }
  }
};
