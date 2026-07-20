const configuredBase = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, '');

export const cloudApiEnabled = Boolean(configuredBase || import.meta.env.VITE_CLOUD_API === 'true');

const apiBase = configuredBase || '/api';
let csrfToken = '';

const request = async (path, options = {}) => {
  const response = await fetch(`${apiBase}${path}`, {
    ...options,
    credentials: 'include',
    headers: {
      ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
      ...(options.headers || {})
    }
  });

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

export const cloudRegister = async details => {
  const result = await request('/auth/register', { method: 'POST', body: JSON.stringify(details) });
  csrfToken = result.csrfToken || '';
  return result;
};

export const requestCloudPasswordReset = details => request('/auth/password-reset/request', { method: 'POST', body: JSON.stringify(details) });

export const completeCloudPasswordReset = details => request('/auth/password-reset/complete', { method: 'POST', body: JSON.stringify(details) });

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

export const addCloudClub = club => request('/clubs', {
  method: 'POST',
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

export const toggleCloudHeart = (photoId, memberNumber) => request(`/photos/${encodeURIComponent(photoId)}/heart`, {
  method: 'POST',
  headers: { 'X-CSRF-Token': csrfToken },
  body: JSON.stringify({ memberNumber })
});

export const resetCloudData = () => request('/reset', { method: 'POST', headers: { 'X-CSRF-Token': csrfToken } });
