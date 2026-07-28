import { Capacitor } from '@capacitor/core';

const configuredBase = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, '');
const nativeApiBase = 'https://pictide-api.summer-wind-c5c6.workers.dev/api';

// Production deployments proxy /api to the managed worker, so an explicit
// VITE_CLOUD_API flag is optional. Local development remains offline-friendly.
export const cloudApiEnabled = Boolean(configuredBase || import.meta.env.VITE_CLOUD_API === 'true' || import.meta.env.PROD);

// The Vercel site uses its same-origin /api proxy. Native Capacitor builds do
// not have that proxy, so they must call the managed API directly.
const apiBase = configuredBase || (Capacitor.isNativePlatform() ? nativeApiBase : '/api');
let csrfToken = '';
const REQUEST_TIMEOUT_MS = 20000;

const request = async (path, options = {}) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), options.timeout || REQUEST_TIMEOUT_MS);
  let response;
  try {
    response = await fetch(`${apiBase}${path}`, {
      ...options,
      credentials: 'include',
      signal: controller.signal,
      headers: {
        ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
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
export const listCloudClubs = () => request('/clubs');

export const cloudLogin = async credentials => {
  const result = await request('/auth/login', { method: 'POST', body: JSON.stringify(credentials) });
  csrfToken = result.csrfToken || '';
  return result;
};

export const checkCloudMember = details => request('/auth/member-check', { method: 'POST', body: JSON.stringify(details) });
export const requestRegistrationCode = details => request('/auth/registration-code', { method: 'POST', body: JSON.stringify(details) });
export const startClubOnboarding = details => request('/onboarding/start', { method: 'POST', body: JSON.stringify(details) });
export const completeClubOnboarding = async details => {
  const result = await request('/onboarding/complete', { method: 'POST', body: JSON.stringify(details) });
  csrfToken = result.csrfToken || '';
  return result;
};

export const cloudRegister = async details => {
  const result = await request('/auth/register', { method: 'POST', body: JSON.stringify(details) });
  csrfToken = result.csrfToken || '';
  return result;
};

export const requestCloudPasswordReset = details => request('/auth/password-reset/request', { method: 'POST', body: JSON.stringify(details) });

export const completeCloudPasswordReset = details => request('/auth/password-reset/complete', { method: 'POST', body: JSON.stringify(details) });
export const requestAdminPasswordReset = details => request('/auth/admin-password-reset/request', { method: 'POST', body: JSON.stringify(details) });
export const completeAdminPasswordReset = details => request('/auth/admin-password-reset/complete', { method: 'POST', body: JSON.stringify(details) });

export const cloudSession = async () => {
  const result = await request('/auth/me');
  csrfToken = result.csrfToken || '';
  return result;
};

export const cloudLogout = () => request('/auth/logout', { method: 'POST', headers: { 'X-CSRF-Token': csrfToken } }).finally(() => { csrfToken = ''; });

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

export const deleteCloudAccount = () => request('/account', { method: 'DELETE', headers: { 'X-CSRF-Token': csrfToken } }).finally(() => { csrfToken = ''; });

export const deleteCloudOrganization = confirmName => request('/organization', {
  method: 'DELETE',
  headers: { 'X-CSRF-Token': csrfToken },
  body: JSON.stringify({ confirmName })
}).finally(() => { csrfToken = ''; });
