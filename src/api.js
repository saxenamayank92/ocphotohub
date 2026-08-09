import { Capacitor } from '@capacitor/core';

const configuredBase = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, '');
const nativeApiBase = 'https://pictide-api.summer-wind-c5c6.workers.dev/api';

// Production deployments proxy /api to the managed worker, so an explicit
// VITE_CLOUD_API flag is optional. Local development remains offline-friendly.
export const cloudApiEnabled = Boolean(configuredBase || import.meta.env.VITE_CLOUD_API === 'true' || import.meta.env.PROD);

const isLocalhost = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
const isNativeApp = Capacitor.isNativePlatform()
  || Capacitor.getPlatform?.() === 'ios'
  || Capacitor.getPlatform?.() === 'android'
  || (typeof window !== 'undefined' && ['capacitor:', 'ionic:'].includes(window.location.protocol));
const apiBase = configuredBase || (isNativeApp || isLocalhost ? nativeApiBase : '/api');

const browserStorage = typeof localStorage !== 'undefined' && typeof localStorage.getItem === 'function' ? localStorage : null;
let csrfToken = browserStorage?.getItem('oakville_csrf_token') || '';

const setCsrfToken = (token) => {
  csrfToken = token || '';
  if (browserStorage) {
    if (token) browserStorage.setItem('oakville_csrf_token', token);
    else browserStorage.removeItem('oakville_csrf_token');
  }
};

const REQUEST_TIMEOUT_MS = 20000;

export const resolveApiUrl = value => {
  if (!value) return '';

  // Bundled demo assets are part of the app shell, not protected Worker
  // uploads. Keeping these paths local lets the public product demo render
  // consistently in browsers and native WebViews.
  if (/^(?:\.\/|\/)?demo\//i.test(value)) {
    return new URL(value.replace(/^\.\//, ''), window.location.origin).href;
  }

  let resolved = value;
  if (!/^(?:https?:|data:|blob:)/i.test(value)) {
    const baseUrl = (isNativeApp || isLocalhost) ? nativeApiBase : (configuredBase || '/api');
    if (value.startsWith('/api/')) resolved = `${baseUrl}${value.slice(4)}`;
    else if (value.startsWith('/photos/')) resolved = `${baseUrl}${value}`;
    else if (value.startsWith('photos/')) resolved = `${baseUrl}/${value}`;
    else resolved = `${baseUrl}/${value.replace(/^\//, '')}`;
  }

  const token = csrfToken || browserStorage?.getItem('oakville_csrf_token');
  if (token && resolved.includes('/photos/') && !resolved.includes('token=')) {
    const separator = resolved.includes('?') ? '&' : '?';
    resolved = `${resolved}${separator}token=${encodeURIComponent(token)}`;
  }

  return resolved;
};

const request = async (path, options = {}) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), options.timeout || REQUEST_TIMEOUT_MS);
  let response;
  try {
    const publicRead = (options.method === 'GET' || options.method === 'HEAD') && (path.startsWith('/clubs/') || path === '/health');
    const authHeaders = csrfToken && !publicRead
      ? { 'X-CSRF-Token': csrfToken, 'Authorization': `Bearer ${csrfToken}` }
      : {};
    response = await fetch(`${apiBase}${path}`, {
      ...options,
      credentials: 'include',
      signal: controller.signal,
      headers: {
        ...(options.method !== 'GET' && options.method !== 'HEAD' && !(options.body instanceof FormData)
          ? { 'Content-Type': 'application/json' }
          : {}),
        ...authHeaders,
        ...(options.headers || {})
      }
    });
  } catch (error) {
    if (error.name === 'AbortError') throw new Error('The request timed out. Check your connection and try again.');
    throw new Error('We could not reach Club PhotoHub. Check your connection and try again.');
  } finally {
    clearTimeout(timeout);
  }

  if (!response.ok) {
    const message = await response.text();
    let payload;
    try { payload = JSON.parse(message); } catch { payload = null; }
    const error = new Error(payload?.error || message || `Cloud API request failed (${response.status})`);
    error.code = payload?.code;
    throw error;
  }

  return response.status === 204 ? null : response.json();
};

export const loadCloudData = () => request('/bootstrap');
export const searchCloudClubs = query => request(`/clubs/search?q=${encodeURIComponent(query)}`);
export const resolveCloudClub = slug => request(`/clubs/resolve?slug=${encodeURIComponent(slug)}`);

// Protected photo URLs cannot be used directly as <img src> values in every
// native WebView because those requests may not include the session cookie.
// Fetch the asset with the authenticated API request and let the UI render a
// short-lived local blob URL instead.
const fetchAuthenticatedPhotoResponse = value => fetch(resolveApiUrl(value), {
  credentials: 'include',
  headers: csrfToken ? { 'Authorization': `Bearer ${csrfToken}` } : {}
});

export const fetchAuthenticatedPhoto = async value => {
  const response = await fetchAuthenticatedPhotoResponse(value);
  if (!response.ok) throw new Error(`Photo request failed (${response.status})`);
  return URL.createObjectURL(await response.blob());
};

export const fetchAuthenticatedPhotoBlob = async value => {
  const response = await fetchAuthenticatedPhotoResponse(value);
  if (!response.ok) throw new Error(`Photo request failed (${response.status})`);
  return response.blob();
};

export const cloudLogin = async credentials => {
  const result = await request('/auth/login', { method: 'POST', body: JSON.stringify(credentials) });
  setCsrfToken(result.csrfToken);
  return result;
};

export const requestPlatformLogin = credentials => request('/auth/platform-login/start', { method: 'POST', body: JSON.stringify(credentials) });
export const completePlatformLogin = async credentials => {
  const result = await request('/auth/platform-login/complete', { method: 'POST', body: JSON.stringify(credentials) });
  setCsrfToken(result.csrfToken);
  return result;
};
export const getPlatformSession = () => request('/auth/platform-me');

export const checkCloudMember = details => request('/auth/member-check', { method: 'POST', body: JSON.stringify(details) });
export const requestRegistrationCode = details => request('/auth/registration-code', { method: 'POST', body: JSON.stringify(details) });
export const startClubOnboarding = details => request('/onboarding/start', { method: 'POST', body: JSON.stringify(details) });
export const completeClubOnboarding = async details => {
  const result = await request('/onboarding/complete', { method: 'POST', body: JSON.stringify(details) });
  setCsrfToken(result.csrfToken);
  return result;
};

export const cloudRegister = async details => {
  const result = await request('/auth/register', { method: 'POST', body: JSON.stringify(details) });
  setCsrfToken(result.csrfToken);
  return result;
};

export const requestCloudPasswordReset = details => request('/auth/password-reset/request', { method: 'POST', body: JSON.stringify(details) });

export const completeCloudPasswordReset = details => request('/auth/password-reset/complete', { method: 'POST', body: JSON.stringify(details) });
export const requestAdminPasswordReset = details => request('/auth/admin-password-reset/request', { method: 'POST', body: JSON.stringify(details) });
export const completeAdminPasswordReset = details => request('/auth/admin-password-reset/complete', { method: 'POST', body: JSON.stringify(details) });

export const cloudSession = async () => {
  const result = await request('/auth/me');
  setCsrfToken(result.csrfToken);
  return result;
};

export const getBillingStatus = () => request('/billing/status');
export const recordLeadEvent = details => request('/analytics/track', { method: 'POST', body: JSON.stringify(details) });
export const getLeadDashboard = () => request('/platform/leads');
export const createOutreachLead = details => request('/platform/leads', { method: 'POST', body: JSON.stringify(details) });
export const deleteOutreachLead = id => request(`/platform/leads/${encodeURIComponent(id)}`, { method: 'DELETE' });
export const updateOutreachLead = (id, updates) => request(`/platform/leads/${encodeURIComponent(id)}`, { method: 'PATCH', body: JSON.stringify(updates) });
export const sendOutreachEmail = details => request('/platform/leads/send-outreach', { method: 'POST', body: JSON.stringify(details) });
export const sendAgentChatCommand = payload => request('/platform/agent/chat', { method: 'POST', body: JSON.stringify(payload) });
export const fetchAgentLogs = () => request('/platform/agent/logs', { method: 'GET' });

export const createBillingCheckout = details => request('/billing/checkout', {
  method: 'POST',
  headers: { 'X-CSRF-Token': csrfToken },
  body: JSON.stringify(details)
});

export const cloudLogout = () => request('/auth/logout', { method: 'POST', headers: { 'X-CSRF-Token': csrfToken } }).finally(() => { setCsrfToken(''); });

export const saveCloudPassword = (memberNumber, password) => request(`/members/${encodeURIComponent(memberNumber)}/password`, {
  method: 'PATCH',
  headers: { 'X-CSRF-Token': csrfToken },
  body: JSON.stringify({ password })
});

export const addCloudMember = (member) => request('/members', {
  method: 'POST',
  headers: { 'X-CSRF-Token': csrfToken },
  body: JSON.stringify(member)
});

export const addCloudMembers = (members) => request('/members/bulk', {
  method: 'POST',
  timeout: 60000,
  headers: { 'X-CSRF-Token': csrfToken },
  body: JSON.stringify({ members })
});

export const registerCloudPushToken = ({ token, platform }) => request('/devices/push-token', {
  method: 'POST',
  headers: { 'X-CSRF-Token': csrfToken },
  body: JSON.stringify({ token, platform })
});

export const updateCurrentClub = club => request('/clubs/current', {
  method: 'PATCH',
  headers: { 'X-CSRF-Token': csrfToken },
  body: JSON.stringify(club)
});

export const deleteCloudMember = (memberNumber) => request(`/members/${encodeURIComponent(memberNumber)}`, {
  method: 'DELETE',
  headers: { 'X-CSRF-Token': csrfToken }
});

export const updateCloudMember = (memberNumber, changes) => request(`/members/${encodeURIComponent(memberNumber)}`, {
  method: 'PATCH',
  headers: { 'X-CSRF-Token': csrfToken },
  body: JSON.stringify(changes)
});

export const uploadCloudPhoto = (photo) => {
  if (!(photo.blob instanceof Blob)) throw new Error('A compressed photo file is required.');
  const params = new URLSearchParams({
    id: photo.id,
    caption: photo.caption,
    category: photo.category,
    createdAt: photo.createdAt
  });
  return request(`/photos?${params}`, {
    method: 'POST',
    headers: {
      'X-CSRF-Token': csrfToken,
      'Content-Type': photo.blob.type || 'image/jpeg'
    },
    body: photo.blob
  });
};

export const deleteCloudPhoto = (photoId) => request(`/photos/${encodeURIComponent(photoId)}`, {
  method: 'DELETE',
  headers: { 'X-CSRF-Token': csrfToken }
});

export const updateCloudPhoto = (photoId, changes) => request(`/photos/${encodeURIComponent(photoId)}`, {
  method: 'PATCH',
  headers: { 'X-CSRF-Token': csrfToken },
  body: JSON.stringify(changes)
});

export const toggleCloudHeart = (photoId, memberNumber) => request(`/photos/${encodeURIComponent(photoId)}/heart`, {
  method: 'POST',
  headers: { 'X-CSRF-Token': csrfToken },
  body: JSON.stringify({ memberNumber })
});

export const resetCloudData = () => request('/reset', { method: 'POST', headers: { 'X-CSRF-Token': csrfToken } });

export const deleteCloudAccount = () => request('/account', { method: 'DELETE', headers: { 'X-CSRF-Token': csrfToken } }).finally(() => { setCsrfToken(''); });

export const deleteCloudOrganization = confirmName => request('/organization', {
  method: 'DELETE',
  headers: { 'X-CSRF-Token': csrfToken },
  body: JSON.stringify({ confirmName })
}).finally(() => { setCsrfToken(''); });
