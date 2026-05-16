const API_BASE = '/api';

function getToken() {
  return localStorage.getItem('peio_token');
}

function setToken(token) {
  if (token) {
    localStorage.setItem('peio_token', token);
  } else {
    localStorage.removeItem('peio_token');
  }
}

function getUser() {
  const raw = localStorage.getItem('peio_user');
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    localStorage.removeItem('peio_user');
    return null;
  }
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function setUser(user) {
  if (user) {
    localStorage.setItem('peio_user', JSON.stringify(user));
  } else {
    localStorage.removeItem('peio_user');
  }
}

function logout() {
  setToken(null);
  setUser(null);
  window.location.href = '/';
}

async function parseResponseBody(response) {
  const text = await response.text();
  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch {
    if (response.ok) {
      throw new Error('Server returned invalid JSON');
    }
    return null;
  }
}

async function apiRequest(path, options = {}) {
  const { expectArray, ...fetchOptions } = options;

  const headers = {
    'Content-Type': 'application/json',
    ...fetchOptions.headers,
  };

  const token = getToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...fetchOptions,
    headers,
  });

  const data = await parseResponseBody(response);

  if (!response.ok) {
    if (response.status === 401 && getToken()) {
      logout();
      throw new Error(
        data && typeof data === 'object' && data.error
          ? data.error
          : 'Session expired. Please sign in again.'
      );
    }
    const message =
      data && typeof data === 'object' && data.error
        ? data.error
        : 'Request failed';
    throw new Error(message);
  }

  if (expectArray && !Array.isArray(data)) {
    throw new Error('Server returned an unexpected response format');
  }

  return data;
}

function requireAuth(allowedRoles) {
  const user = getUser();
  const token = getToken();

  if (!token || !user) {
    window.location.href = '/';
    return null;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    window.location.href = user.role === 'admin' ? '/admin.html' : '/report.html';
    return null;
  }

  return user;
}

function severityClass(severity) {
  if (severity === 'Low') return 'badge-low';
  if (severity === 'Medium') return 'badge-medium';
  if (severity === 'High') return 'badge-high';
  if (severity === 'Critical') return 'badge-critical';
  return '';
}

function statusClass(status) {
  if (status === 'Pending') return 'badge-pending';
  if (status === 'Investigating') return 'badge-investigating';
  if (status === 'Resolved') return 'badge-resolved';
  return '';
}

function formatDate(iso) {
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}
